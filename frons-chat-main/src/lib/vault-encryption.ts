/**
 * FRONS Vault — Zero-Knowledge Client-Side Encryption
 *
 * Key derivation: passphrase + wallet signature → PBKDF2 (100k iterations, SHA-512) → master key
 * Sub-keys via HKDF: "file-encryption" → FEK, "metadata-encryption" → MEK
 * File encryption: AES-256-GCM with random 96-bit nonce
 * Metadata encryption: file name + tags encrypted with MEK
 *
 * The server NEVER sees plaintext, keys, or passphrases.
 */

const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_HASH = "SHA-512";
const AES_KEY_LENGTH = 256;
const NONCE_LENGTH = 12; // 96 bits

// BIP39-style word list (simplified — production should use full 2048 words)
const WORD_LIST = [
  "abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract",
  "absurd", "abuse", "access", "accident", "account", "accuse", "achieve", "acid",
  "acoustic", "acquire", "across", "act", "action", "actor", "actual", "adapt",
  "add", "addict", "address", "adjust", "admit", "adult", "advance", "advice",
  "aerobic", "affair", "afford", "afraid", "again", "age", "agent", "agree",
  "ahead", "aim", "air", "airport", "aisle", "alarm", "album", "alcohol",
  "alert", "alien", "all", "alley", "allow", "almost", "alone", "alpha",
  "already", "also", "alter", "always", "amateur", "amazing", "among", "amount",
  "amused", "analyst", "anchor", "ancient", "anger", "angle", "angry", "animal",
  "ankle", "announce", "annual", "another", "answer", "antenna", "antique", "anxiety",
  "any", "apart", "apology", "appear", "apple", "approve", "april", "arch",
  "arctic", "area", "arena", "argue", "arm", "armed", "armor", "army",
  "around", "arrange", "arrest", "arrive", "arrow", "art", "artefact", "artist",
  "artwork", "ask", "aspect", "assault", "asset", "assist", "assume", "asthma",
  "athlete", "atom", "attack", "attend", "attitude", "attract", "auction", "audit",
  "august", "aunt", "author", "auto", "autumn", "average", "avocado", "avoid",
  "awake", "aware", "awesome", "awful", "awkward", "axis", "baby", "bachelor",
  "bacon", "badge", "bag", "balance", "balcony", "ball", "bamboo", "banana",
  "banner", "bar", "barely", "bargain", "barrel", "base", "basic", "basket",
  "battle", "beach", "bean", "beauty", "because", "become", "beef", "before",
  "begin", "behave", "behind", "believe", "below", "belt", "bench", "benefit",
  "best", "betray", "better", "between", "beyond", "bicycle", "bid", "bike",
  "bind", "biology", "bird", "birth", "bitter", "black", "blade", "blame",
  "blanket", "blast", "bleak", "bless", "blind", "blood", "blossom", "blow",
  "blue", "blur", "blush", "board", "boat", "body", "boil", "bomb",
  "bone", "bonus", "book", "boost", "border", "boring", "borrow", "boss",
  "bottom", "bounce", "box", "boy", "bracket", "brain", "brand", "brass",
  "brave", "bread", "breeze", "brick", "bridge", "brief", "bright", "bring",
  "brisk", "broccoli", "broken", "bronze", "broom", "brother", "brown", "brush",
];

export interface VaultKeys {
  fek: CryptoKey; // File Encryption Key
  mek: CryptoKey; // Metadata Encryption Key
}

export interface EncryptedFileResult {
  encrypted: ArrayBuffer;
  nonce: Uint8Array;
}

/**
 * Derive vault encryption keys from passphrase and wallet signature.
 * Uses PBKDF2 (100k iterations, SHA-512) → HKDF sub-keys.
 */
export async function deriveVaultKeys(
  passphrase: string,
  walletSignature: Uint8Array
): Promise<VaultKeys> {
  const salt = walletSignature.slice(0, 16);

  // Import passphrase as key material
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  // Derive 512-bit master key via PBKDF2
  const masterBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: PBKDF2_HASH,
    },
    keyMaterial,
    512
  );

  // Import master bits for HKDF derivation
  const masterKey = await crypto.subtle.importKey(
    "raw",
    masterBits,
    "HKDF",
    false,
    ["deriveBits"]
  );

  // Derive File Encryption Key (FEK) via HKDF
  const fekBits = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new Uint8Array(0),
      info: new TextEncoder().encode("file-encryption"),
    },
    masterKey,
    AES_KEY_LENGTH
  );

  // Derive Metadata Encryption Key (MEK) via HKDF
  const mekBits = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new Uint8Array(0),
      info: new TextEncoder().encode("metadata-encryption"),
    },
    masterKey,
    AES_KEY_LENGTH
  );

  const fek = await crypto.subtle.importKey(
    "raw",
    fekBits,
    "AES-GCM",
    false,
    ["encrypt", "decrypt"]
  );

  const mek = await crypto.subtle.importKey(
    "raw",
    mekBits,
    "AES-GCM",
    false,
    ["encrypt", "decrypt"]
  );

  return { fek, mek };
}

/**
 * Encrypt a file buffer with AES-256-GCM using the File Encryption Key.
 */
export async function encryptFile(
  file: ArrayBuffer,
  fek: CryptoKey
): Promise<EncryptedFileResult> {
  const nonce = crypto.getRandomValues(new Uint8Array(NONCE_LENGTH));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce },
    fek,
    file
  );
  return { encrypted, nonce };
}

/**
 * Decrypt a file buffer with AES-256-GCM using the File Encryption Key.
 */
export async function decryptFile(
  encrypted: ArrayBuffer,
  nonce: Uint8Array,
  fek: CryptoKey
): Promise<ArrayBuffer> {
  return await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: nonce },
    fek,
    encrypted
  );
}

/**
 * Encrypt metadata (file name, tags, description) with the Metadata Encryption Key.
 * Returns a base64-encoded JSON string of encrypted fields.
 */
export async function encryptMetadata(
  metadata: { name: string; tags: string[]; description: string },
  mek: CryptoKey
): Promise<string> {
  const plaintext = JSON.stringify(metadata);
  const nonce = crypto.getRandomValues(new Uint8Array(NONCE_LENGTH));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce },
    mek,
    new TextEncoder().encode(plaintext)
  );

  // Pack nonce + ciphertext into a single base64 string
  const packed = new Uint8Array(nonce.length + encrypted.byteLength);
  packed.set(nonce, 0);
  packed.set(new Uint8Array(encrypted), nonce.length);

  return bufferToBase64(packed.buffer);
}

/**
 * Decrypt metadata from a base64-encoded encrypted string.
 */
export async function decryptMetadata(
  encryptedMetadata: string,
  mek: CryptoKey
): Promise<{ name: string; tags: string[]; description: string }> {
  const packed = base64ToBuffer(encryptedMetadata);
  const packedArray = new Uint8Array(packed);

  const nonce = packedArray.slice(0, NONCE_LENGTH);
  const ciphertext = packedArray.slice(NONCE_LENGTH);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: nonce },
    mek,
    ciphertext
  );

  return JSON.parse(new TextDecoder().decode(decrypted));
}

/**
 * Generate a 12-word recovery phrase for vault key recovery.
 */
export function generateRecoveryPhrase(): string {
  const entropy = crypto.getRandomValues(new Uint8Array(16)); // 128 bits
  const words: string[] = [];
  for (let i = 0; i < 12; i++) {
    const index =
      ((entropy[i] || 0) * 256 + (entropy[(i + 1) % 16] || 0)) %
      WORD_LIST.length;
    words.push(WORD_LIST[index]);
  }
  return words.join(" ");
}

/**
 * Compute SHA-256 hash of a file for integrity proof on Solana.
 */
export async function computeFileHash(file: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", file);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// --- Helpers ---

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
