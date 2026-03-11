// src/utils/encryption.ts

/**
 * Generates an encryption key from a user password using PBKDF2.
 * @param password The user's input password.
 * @param salt Optional deterministic salt (could be derived from user ID to ensure consistent keys across sessions).
 */
export async function deriveKey(password: string, saltString: string = "frons-vault-salt"): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  const salt = enc.encode(saltString);

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Generates a random AES-256-GCM key for encrypting data.
 */
export async function generateRandomKey(): Promise<CryptoKey> {
  return window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts a string of text using AES-256-GCM.
 * @param text The plaintext string to encrypt.
 * @param key The AES-GCM CryptoKey.
 * @returns Base64 encoded ciphertext and the Initialization Vector (IV).
 */
export async function encryptText(text: string, key: CryptoKey): Promise<{ ciphertextBase64: string; ivBase64: string }> {
  const enc = new TextEncoder();
  const encodedText = enc.encode(text);

  // Generate a random initialization vector
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    encodedText
  );

  return {
    ciphertextBase64: arrayBufferToBase64(ciphertext),
    ivBase64: arrayBufferToBase64(iv.buffer),
  };
}

/**
 * Decrypts a base64 ciphertext string using AES-256-GCM.
 * @param ciphertextBase64 The base64 encoded ciphertext.
 * @param ivBase64 The base64 encoded IV used during encryption.
 * @param key The AES-GCM CryptoKey.
 * @returns The decrypted plaintext string.
 */
export async function decryptText(ciphertextBase64: string, ivBase64: string, key: CryptoKey): Promise<string> {
  const ciphertextBuffer = base64ToArrayBuffer(ciphertextBase64);
  const ivBuffer = base64ToArrayBuffer(ivBase64);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: new Uint8Array(ivBuffer),
    },
    key,
    ciphertextBuffer
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedBuffer);
}

/**
 * Exports a CryptoKey to a Base64 string so it can be securely stored locally (e.g. in a vault).
 */
export async function exportKeyToBase64(key: CryptoKey): Promise<string> {
  const exportedBuffer = await window.crypto.subtle.exportKey("raw", key);
  return arrayBufferToBase64(exportedBuffer);
}

/**
 * Imports a CryptoKey from a Base64 string.
 */
export async function importKeyFromBase64(base64Key: string): Promise<CryptoKey> {
  const keyBuffer = base64ToArrayBuffer(base64Key);
  return window.crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"]
  );
}

// --- Helpers ---

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
