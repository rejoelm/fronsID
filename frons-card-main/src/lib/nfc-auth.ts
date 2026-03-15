import crypto from "crypto";

export interface NfcValidation {
  isValid: boolean;
  cardId?: string;
  tapCount?: number;
  error?: string;
}

interface NfcCard {
  id: string;
  profile_slug: string;
  sun_key: string; // AES-128 key (hex) programmed into the NTAG 424 DNA
  cmac_counter: number;
  total_taps: number;
  last_tap_at: string | null;
  is_active: boolean;
}

/**
 * Compute SUN (Secure Unique NFC) CMAC for NTAG 424 DNA.
 *
 * The NFC chip generates a CMAC using AES-128-CMAC (per NIST SP 800-38B)
 * over a session vector derived from the UID and the read counter.
 *
 * For SUN message authentication the input data is:
 *   SV2 = 0x3CC300010080 || UID (7 bytes) || counter (3 bytes LE)
 * padded to 32 bytes, then AES-CMAC is computed.
 *
 * We truncate the 16-byte MAC to 8 bytes by picking even-index bytes (industry standard).
 */
function computeSunCmac(sunKeyHex: string, uid: string, counter: number): string {
  const key = Buffer.from(sunKeyHex, "hex");

  // Build SV2 (Session Vector 2) for SUN MAC computation
  // Header: 3C C3 00 01 00 80
  const header = Buffer.from([0x3c, 0xc3, 0x00, 0x01, 0x00, 0x80]);

  // UID: 7 bytes
  const uidBuf = Buffer.from(uid.replace(/:/g, ""), "hex");

  // Counter: 3 bytes little-endian
  const ctrBuf = Buffer.alloc(3);
  ctrBuf.writeUIntLE(counter, 0, 3);

  // SV2 = header || UID || counter, padded to 16 bytes (AES block)
  const sv2Input = Buffer.concat([header, uidBuf, ctrBuf]);
  const sv2Padded = Buffer.alloc(16, 0x00);
  sv2Input.copy(sv2Padded);

  // Derive session key: AES-ECB encrypt SV2 with the SUN key
  const cipher = crypto.createCipheriv("aes-128-ecb", key, null);
  cipher.setAutoPadding(false);
  const sessionKey = Buffer.concat([cipher.update(sv2Padded), cipher.final()]);

  // Compute AES-CMAC over an empty message (the MAC is the authentication itself)
  const cmacFull = aesCmac(sessionKey, Buffer.alloc(0));

  // Truncate: pick bytes at even indices (0, 2, 4, 6, 8, 10, 12, 14)
  const truncated = Buffer.alloc(8);
  for (let i = 0; i < 8; i++) {
    truncated[i] = cmacFull[i * 2];
  }

  return truncated.toString("hex").toUpperCase();
}

/**
 * AES-CMAC implementation per NIST SP 800-38B (RFC 4493).
 */
function aesCmac(key: Buffer, message: Buffer): Buffer {
  const ZERO = Buffer.alloc(16, 0x00);
  const CONST_RB = Buffer.from("00000000000000000000000000000087", "hex");

  // Generate subkeys
  const cipher0 = crypto.createCipheriv("aes-128-ecb", key, null);
  cipher0.setAutoPadding(false);
  const L = Buffer.concat([cipher0.update(ZERO), cipher0.final()]);

  const K1 = leftShift(L);
  if (L[0] & 0x80) {
    xorBuffers(K1, CONST_RB);
  }

  const K2 = leftShift(Buffer.from(K1));
  if (K1[0] & 0x80) {
    xorBuffers(K2, CONST_RB);
  }

  const n = message.length === 0 ? 1 : Math.ceil(message.length / 16);
  const isComplete = message.length > 0 && message.length % 16 === 0;

  // Prepare the last block
  let lastBlock: Buffer;
  if (isComplete) {
    lastBlock = Buffer.alloc(16);
    message.copy(lastBlock, 0, (n - 1) * 16, n * 16);
    xorBuffers(lastBlock, K1);
  } else {
    lastBlock = Buffer.alloc(16, 0x00);
    const lastStart = (n - 1) * 16;
    const remaining = message.length - lastStart;
    if (remaining > 0) {
      message.copy(lastBlock, 0, lastStart, message.length);
    }
    lastBlock[remaining] = 0x80; // padding
    xorBuffers(lastBlock, K2);
  }

  // CBC-MAC
  let X = Buffer.alloc(16, 0x00);
  for (let i = 0; i < n - 1; i++) {
    const block = message.subarray(i * 16, (i + 1) * 16);
    const Y = Buffer.alloc(16);
    for (let j = 0; j < 16; j++) {
      Y[j] = X[j] ^ block[j];
    }
    const cipherBlock = crypto.createCipheriv("aes-128-ecb", key, null);
    cipherBlock.setAutoPadding(false);
    X = Buffer.concat([cipherBlock.update(Y), cipherBlock.final()]);
  }

  // Final block
  const Y = Buffer.alloc(16);
  for (let j = 0; j < 16; j++) {
    Y[j] = X[j] ^ lastBlock[j];
  }
  const cipherFinal = crypto.createCipheriv("aes-128-ecb", key, null);
  cipherFinal.setAutoPadding(false);
  return Buffer.concat([cipherFinal.update(Y), cipherFinal.final()]);
}

function leftShift(buf: Buffer): Buffer {
  const shifted = Buffer.alloc(buf.length);
  let carry = 0;
  for (let i = buf.length - 1; i >= 0; i--) {
    shifted[i] = ((buf[i] << 1) | carry) & 0xff;
    carry = (buf[i] & 0x80) ? 1 : 0;
  }
  return shifted;
}

function xorBuffers(target: Buffer, source: Buffer): void {
  for (let i = 0; i < target.length; i++) {
    target[i] ^= source[i];
  }
}

/**
 * Validate an NFC tap from an NTAG 424 DNA card.
 *
 * URL format: card.fronsciers.id/p/{slug}?cmac={value}&ctr={counter_hex}
 *
 * Steps:
 * 1. Look up the card by profile_slug
 * 2. Decode the counter (hex -> int)
 * 3. Verify counter > stored cmac_counter (replay prevention)
 * 4. Compute expected CMAC using card's sun_key + counter
 * 5. Compare computed vs provided CMAC
 * 6. If valid: update counter, increment taps, set last_tap_at
 * 7. Log the tap in nfc_tap_log
 * 8. Return validation result
 */
export async function validateNfcTap(
  slug: string,
  cmac: string,
  counter: string,
  supabase: any
): Promise<NfcValidation> {
  try {
    // 1. Look up the card by profile_slug
    const { data: card, error: lookupError } = await supabase
      .from("nfc_cards")
      .select("*")
      .eq("profile_slug", slug)
      .eq("is_active", true)
      .single();

    if (lookupError || !card) {
      return {
        isValid: false,
        error: "Card not found or inactive",
      };
    }

    const nfcCard = card as NfcCard;

    // 2. Decode counter from hex to integer
    const counterValue = parseInt(counter, 16);
    if (isNaN(counterValue)) {
      return {
        isValid: false,
        error: "Invalid counter format",
      };
    }

    // 3. Verify counter > stored cmac_counter (replay prevention)
    if (counterValue <= nfcCard.cmac_counter) {
      await logTap(supabase, nfcCard.id, slug, counterValue, false, "Replay attack: counter not greater than stored");
      return {
        isValid: false,
        error: "Replay detected: counter value has already been used",
      };
    }

    // 4. Compute expected CMAC using the card's sun_key and counter
    // The card UID is stored as part of the card record
    const expectedCmac = computeSunCmac(
      nfcCard.sun_key,
      nfcCard.uid || "00000000000000", // 7-byte UID hex
      counterValue
    );

    // 5. Compare computed CMAC with provided CMAC (case-insensitive)
    const providedCmac = cmac.toUpperCase();
    if (expectedCmac !== providedCmac) {
      await logTap(supabase, nfcCard.id, slug, counterValue, false, "CMAC mismatch");
      return {
        isValid: false,
        error: "Invalid CMAC: authentication failed",
      };
    }

    // 6. If valid: update cmac_counter, increment total_taps, set last_tap_at
    const newTapCount = nfcCard.total_taps + 1;
    const { error: updateError } = await supabase
      .from("nfc_cards")
      .update({
        cmac_counter: counterValue,
        total_taps: newTapCount,
        last_tap_at: new Date().toISOString(),
      })
      .eq("id", nfcCard.id);

    if (updateError) {
      console.error("[nfc-auth] Failed to update card:", updateError.message);
    }

    // 7. Log the successful tap
    await logTap(supabase, nfcCard.id, slug, counterValue, true, null);

    // 8. Return validation result
    return {
      isValid: true,
      cardId: nfcCard.id,
      tapCount: newTapCount,
    };
  } catch (err: any) {
    console.error("[nfc-auth] Unexpected error:", err);
    return {
      isValid: false,
      error: "Internal validation error",
    };
  }
}

async function logTap(
  supabase: any,
  cardId: string,
  slug: string,
  counter: number,
  success: boolean,
  errorMessage: string | null
): Promise<void> {
  try {
    await supabase.from("nfc_tap_log").insert({
      card_id: cardId,
      profile_slug: slug,
      counter_value: counter,
      success,
      error_message: errorMessage,
      tapped_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[nfc-auth] Failed to log tap:", err);
  }
}
