// src/utils/walrus.ts

// The Walrus Publisher and Aggregator nodes for Testnet
// Ensure these match the currently active Walrus testnet endpoints.
const WALRUS_PUBLISHER = "https://publisher-devnet.walrus.space";
const WALRUS_AGGREGATOR = "https://aggregator-devnet.walrus.space";

/**
 * Uploads a text payload (or base64 ciphertext) to a Walrus Publisher node.
 * @param data The string data (usually encrypted ciphertext) to upload.
 * @param epochs Number of Sui epochs to store the data (default: 1).
 * @returns The unique Walrus Blob ID mapping to the uploaded data.
 */
export async function uploadToWalrus(data: string, epochs: number = 1): Promise<string> {
  const url = `${WALRUS_PUBLISHER}/v1/store?epochs=${epochs}`;

  try {
    const response = await fetch(url, {
      method: "PUT",
      body: data,
    });

    if (!response.ok) {
      throw new Error(`Walrus upload failed with status: ${response.status}`);
    }

    const result = await response.json();
    
    // Walrus returns a complex object; we need either the `alreadyCertified` or `newlyCreated` blobId
    if (result.alreadyCertified) {
      return result.alreadyCertified.blobId;
    } else if (result.newlyCreated) {
      return result.newlyCreated.blobObject.blobId;
    } else {
      throw new Error(`Unexpected Walrus response structure: ${JSON.stringify(result)}`);
    }
  } catch (error) {
    console.error("Error uploading to Walrus:", error);
    throw error;
  }
}

/**
 * Retrieves string data (ciphertext) from a Walrus Aggregator node using its Blob ID.
 * @param blobId The unique Walrus Blob ID.
 * @returns The requested string data.
 */
export async function readFromWalrus(blobId: string): Promise<string> {
  const url = `${WALRUS_AGGREGATOR}/v1/${blobId}`;

  try {
    const response = await fetch(url, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`Walrus read failed with status: ${response.status}`);
    }

    // Since we are primarily storing Base64 AES-GCM ciphertexts, we return text.
    return await response.text();
  } catch (error) {
    console.error("Error reading from Walrus:", error);
    throw error;
  }
}
