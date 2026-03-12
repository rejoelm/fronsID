const WALRUS_PUBLISHER = "https://publisher-devnet.walrus.space";
const WALRUS_AGGREGATOR = "https://aggregator-devnet.walrus.space";

export async function uploadToWalrus(data: BodyInit, epochs: number = 1): Promise<string> {
  const url = `${WALRUS_PUBLISHER}/v1/store?epochs=${epochs}`;
  try {
    const response = await fetch(url, { method: "PUT", body: data });
    if (!response.ok) throw new Error(`Walrus upload failed: ${response.status}`);
    const result = await response.json();
    if (result.alreadyCertified) return result.alreadyCertified.blobId;
    if (result.newlyCreated) return result.newlyCreated.blobObject.blobId;
    throw new Error(`Unexpected Walrus response: ${JSON.stringify(result)}`);
  } catch (error) {
    console.error("Error uploading to Walrus:", error);
    throw error;
  }
}
