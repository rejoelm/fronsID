import { NextRequest, NextResponse } from "next/server";
import { Connection, Keypair, VersionedTransaction } from "@solana/web3.js";

export async function POST(req: NextRequest) {
  try {
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
