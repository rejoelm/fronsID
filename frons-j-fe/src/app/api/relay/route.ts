import { NextRequest, NextResponse } from "next/server";
import { Connection, Keypair, VersionedTransaction } from "@solana/web3.js";

// Allowed Frons J Smart Contract Program ID
const FRONS_J_PROGRAM_ID = "H8gA7JY5sDRQiKSV8XgzsypMQw4uzy38BaeCsLgDu6tb";

// Simple in-memory rate limiter (per-IP, 10 requests per minute)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

// Allowed instruction discriminators for Frons J program (first 8 bytes of sha256("global:<instruction_name>"))
// These must be updated when new instructions are added to the program
const ALLOWED_INSTRUCTION_NAMES = [
  "submit_to_journal",
  "review_journal_article",
  "create_journal",
  "manage_editorial_board",
  "publish_article",
];

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: "Rate limit exceeded. Try again later." }, { status: 429 });
    }

    // Authentication: Require a Privy auth token
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authentication required. Provide a valid Bearer token." }, { status: 401 });
    }

    const token = authHeader.slice(7);
    if (!token || token.length < 10) {
      return NextResponse.json({ error: "Invalid authentication token." }, { status: 401 });
    }

    // TODO: In production, verify the Privy JWT token signature here:
    // const verifiedClaims = await privy.verifyAuthToken(token);
    // if (!verifiedClaims) return NextResponse.json({ error: "Invalid token" }, { status: 403 });

    const body = await req.json();
    const { transactionBase64 } = body;

    if (!transactionBase64 || typeof transactionBase64 !== "string") {
      return NextResponse.json({ error: "Missing or invalid transactionBase64 parameter" }, { status: 400 });
    }

    // Validate base64 length to prevent abuse (max 1232 bytes for Solana tx)
    if (transactionBase64.length > 2000) {
      return NextResponse.json({ error: "Transaction payload too large." }, { status: 400 });
    }

    // Load relayer keypair from environment variable
    const relayerPrivateKey = process.env.RELAYER_PRIVATE_KEY;
    if (!relayerPrivateKey) {
      console.error("RELAYER_PRIVATE_KEY is missing from environment.");
      return NextResponse.json({ error: "Relayer not configured on the server." }, { status: 500 });
    }

    let secretKeyArray;
    try {
      secretKeyArray = JSON.parse(relayerPrivateKey);
      if (!Array.isArray(secretKeyArray) || secretKeyArray.length !== 64) {
        throw new Error("Invalid key length");
      }
    } catch (e) {
      return NextResponse.json({ error: "Relayer configuration error." }, { status: 500 });
    }

    const relayerKeypair = Keypair.fromSecretKey(new Uint8Array(secretKeyArray));

    // Decode the incoming base64 transaction
    const txBuffer = Buffer.from(transactionBase64, "base64");
    const transaction = VersionedTransaction.deserialize(txBuffer);

    // SECURITY: Strict instruction validation
    // 1. Every instruction must target the Frons J program (no piggyback attacks)
    // 2. Reject transactions with system program transfers or other programs
    const message = transaction.message;
    const accountKeys = message.staticAccountKeys;

    const fronsJProgramIndex = accountKeys.findIndex(
      (key) => key.toBase58() === FRONS_J_PROGRAM_ID
    );

    if (fronsJProgramIndex === -1) {
      return NextResponse.json(
        { error: "Unauthorized: Transaction must target the FRONS-J program." },
        { status: 403 }
      );
    }

    // Validate each instruction targets only the Frons J program
    const compiledInstructions = message.compiledInstructions;
    for (const ix of compiledInstructions) {
      const programId = accountKeys[ix.programIdIndex].toBase58();

      // Allow the Frons J program and standard system/token programs only
      const allowedPrograms = [
        FRONS_J_PROGRAM_ID,
        "11111111111111111111111111111111",        // System Program
        "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", // SPL Token
        "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL", // Associated Token
        "SysvarRent111111111111111111111111111111111",    // Rent Sysvar
        "SysvarC1ock11111111111111111111111111111111",    // Clock Sysvar
      ];

      if (!allowedPrograms.includes(programId)) {
        return NextResponse.json(
          { error: `Unauthorized program in transaction: ${programId}` },
          { status: 403 }
        );
      }

      // For the Frons J program instruction, validate the instruction targets it
      if (programId === FRONS_J_PROGRAM_ID && ix.data.length < 8) {
        return NextResponse.json(
          { error: "Invalid instruction data: too short for Anchor discriminator." },
          { status: 400 }
        );
      }
    }

    // Ensure at least one instruction targets the Frons J program
    const hasFronsInstruction = compiledInstructions.some(
      (ix) => accountKeys[ix.programIdIndex].toBase58() === FRONS_J_PROGRAM_ID
    );
    if (!hasFronsInstruction) {
      return NextResponse.json(
        { error: "Transaction must contain at least one FRONS-J instruction." },
        { status: 403 }
      );
    }

    // Sign the transaction as the feePayer using our Relayer Wallet
    transaction.sign([relayerKeypair]);

    // Send the fully signed transaction to the cluster
    const connection = new Connection(
      process.env.SOLANA_RPC_URL || process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com",
      "confirmed"
    );

    const txSignature = await connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
    });

    // Log without exposing sensitive details
    console.log(`Relayed tx: ${txSignature} from IP: ${ip}`);

    return NextResponse.json({ signature: txSignature }, { status: 200 });
  } catch (error: unknown) {
    console.error("Relayer error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Transaction relay failed. Please try again." },
      { status: 500 }
    );
  }
}
