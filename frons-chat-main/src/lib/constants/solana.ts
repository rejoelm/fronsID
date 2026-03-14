export const SOLANA_CONFIG = {
  PROGRAM_ID: "28VkA76EcTTN746SxZyYT8NTte9gofeBQ2L4N8hfYPgd",
  RPC_URL: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com",
  WS_URL: process.env.NEXT_PUBLIC_SOLANA_WS_URL || "wss://api.devnet.solana.com",
  COMMITMENT: "confirmed" as const,
} as const;

export const DEVNET_USDCF_ADDRESS =
  "B4UmZhTkjFJoAFp2r4LcuWaY8aPy4oH7kE9ej1Ctp4Vo";
export const DEVNET_FRONS_ADDRESS =
  "2MjhRY9M2qL3PxAa5jCw4hqkpjbebLwq7EkLHtowDkUL";
export const ESCROW_ADDRESS = "FwnvmuPAfFzbqksKPRnoBcBjHT1NKzvo2fv4uX3iTayk";
export const DOCI_REGISTRY_ADDRESS =
  "95E4ip51CThHfugWdU8uVCk6st6qgTnLJEGnmafkMRWo";
