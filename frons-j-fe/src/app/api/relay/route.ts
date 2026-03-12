import { NextRequest, NextResponse } from "next/server";
import { Connection, Keypair, PublicKey, VersionedTransaction } from "@solana/web3.js";

// Allowlisted program IDs that the relayer is permitted to sign for
const ALLOWED_PROGRAM_IDS = new Set([
  "H8gA7JY5sDRQiKSV8XgzsypMQw4uzy38BaeCsLgDu6tb", // Frons J SC Program ID
  "11111111111111111111111111111111",                 // System Program (for account creation)
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",    // SPL Token Program
]);

async function verifyPrivyToken(authHeader: string | null): Promise<boolean> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return false;

  const token = authHeader.slice(7);
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const privyAppSecret = process.env.PRIVY_APP_SECRET;

  if (!privyAppId || !privyAppSecret) {
    console.error("Privy credentials not configured on server.");
    return false;
  }

  try {
    const response = await fetch("https://auth.privy.io/api/v1/token/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "privy-app-id": privyAppId,
        Authorization: `Basic ${Buffer.from(`${privyAppId}:${privyAppSecret}`).toString("base64")}`,
      },
      body: JSON.stringify({ token }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    // SECURITY: Authenticate the caller via Privy token
    const isAuthenticated = await verifyPrivyToken(req.headers.get("Authorization"));
    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized: Valid Privy auth token required." }, { status: 401 });
    }

    const { transactionBase64 } = await req.json();

    if (!transactionBase64) {
      return NextResponse.json({ error: "Missing transactionBase64 parameter" }, { status: 400 });
    }

    // Load relayer keypair from environment variable (JSON array format)
    // E.g., RELAYER_PRIVATE_KEY="[1,2,3...]"
    const relayerPrivateKey = process.env.RELAYER_PRIVATE_KEY;
    if (!relayerPrivateKey) {
      console.error("RELAYER_PRIVATE_KEY is missing from environment.");
      return NextResponse.json({ error: "Relayer not configured on the server." }, { status: 500 });
    }

    let secretKeyArray;
    try {
      secretKeyArray = JSON.parse(relayerPrivateKey);
    } catch (e) {
      return NextResponse.json({ error: "Invalid RELAYER_PRIVATE_KEY format. Must be a JSON array." }, { status: 500 });
    }

    const relayerKeypair = Keypair.fromSecretKey(new Uint8Array(secretKeyArray));

    // Decode the incoming base64 transaction
    const txBuffer = Buffer.from(transactionBase64, "base64");
    const transaction = VersionedTransaction.deserialize(txBuffer);

    // SECURITY: Instruction-level whitelisting
    // Verify that EVERY instruction in the transaction invokes an allowed program
    const message = transaction.message;
    const accountKeys = message.staticAccountKeys;

    for (const instruction of message.compiledInstructions) {
      const programId = accountKeys[instruction.programIdIndex];
      if (!programId || !ALLOWED_PROGRAM_IDS.has(programId.toBase58())) {
        const offending = programId ? programId.toBase58() : "unknown";
        return NextResponse.json(
          { error: `Unauthorized program invocation: ${offending}. This relayer only signs for FRONS protocols.` },
          { status: 403 }
        );
      }
    }

    // Reject transactions using address lookup tables (could hide unauthorized programs)
    if (message.addressTableLookups && message.addressTableLookups.length > 0) {
      return NextResponse.json(
        { error: "Transactions with address lookup tables are not supported by this relayer." },
        { status: 403 }
      );
    }

    // Sign the transaction as the feePayer using our Relayer Wallet
    transaction.sign([relayerKeypair]);

    // Send the fully signed transaction to the cluster
    const connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com",
      "confirmed"
    );

    const txSignature = await connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
    });

    console.log("Successfully relayed gasless transaction:", txSignature);

    return NextResponse.json({ signature: txSignature }, { status: 200 });
  } catch (error: any) {
    console.error("Relayer execution error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
