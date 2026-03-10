import { useState, useCallback } from "react";
import { PublicKey, Transaction } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { DEVNET_USDCF_ADDRESS, ESCROW_ADDRESS } from "@/lib/constants/solana";
import { useProgram } from "./useProgram";
import { useGasSponsorship, TransactionType } from "./useGasSponsorship";

interface UsePaymentProps {
  walletAddress?: string;
  wallet?: any;
}

export function usePayment({ walletAddress, wallet }: UsePaymentProps) {
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const { connection } = useProgram();
  const { sponsorTransaction, isSponsoring, sponsorshipError } =
    useGasSponsorship({
      walletAddress,
    });

  const executePaymentWithSponsorship = useCallback(
    async (amount: number): Promise<string> => {
      console.log(
        "🎯 executePaymentWithSponsorship started with amount:",
        amount
      );

      try {
        const userPublicKey = new PublicKey(walletAddress!);
        const usdcfMint = new PublicKey(DEVNET_USDCF_ADDRESS);
        const escrowPublicKey = new PublicKey(ESCROW_ADDRESS);

        console.log("📋 Transaction participants:");
        console.log("  - User:", userPublicKey.toString());
        console.log("  - USDCF Mint:", usdcfMint.toString());
        console.log("  - Escrow:", escrowPublicKey.toString());
        console.log("  - Amount:", amount, "USDCF");

        console.log("🔧 Preparing USDCF transfer transaction");

        console.log("🔑 Fetching fee payer public key...");
        const apiUrl =
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001/api";
        console.log("🌐 API URL:", apiUrl);

        const feePayerResponse = await fetch(
          `${apiUrl}/transactions/fee-payer-public-key`
        );
        console.log(
          "📡 Fee payer response status:",
          feePayerResponse.status,
          feePayerResponse.statusText
        );

        if (!feePayerResponse.ok) {
          const errorText = await feePayerResponse.text();
          console.error("❌ Fee payer fetch failed:", errorText);
          throw new Error(
            `Failed to fetch fee payer public key: ${feePayerResponse.status} ${errorText}`
          );
        }

        const feePayerData = await feePayerResponse.json();
        console.log("📦 Fee payer data received:", feePayerData);

        if (!feePayerData.success) {
          console.error("❌ Fee payer data indicates failure:", feePayerData);
          throw new Error(
            feePayerData.error || "Failed to get fee payer public key"
          );
        }

        const feePayerPublicKey = new PublicKey(feePayerData.feePayerPublicKey);
        console.log("✅ Fee payer public key:", feePayerPublicKey.toString());

        const userTokenAccount = await getAssociatedTokenAddress(
          usdcfMint,
          userPublicKey
        );
        const escrowTokenAccount = await getAssociatedTokenAddress(
          usdcfMint,
          escrowPublicKey
        );

        const transaction = new Transaction();

        const userAccountInfo = await connection.getAccountInfo(
          userTokenAccount
        );
        if (!userAccountInfo) {
          console.log("📦 Adding create user token account instruction");
          transaction.add(
            createAssociatedTokenAccountInstruction(
              userPublicKey,
              userTokenAccount,
              userPublicKey,
              usdcfMint
            )
          );
        }

        const escrowAccountInfo = await connection.getAccountInfo(
          escrowTokenAccount
        );
        if (!escrowAccountInfo) {
          console.log("📦 Adding create escrow token account instruction");
          transaction.add(
            createAssociatedTokenAccountInstruction(
              userPublicKey,
              escrowTokenAccount,
              escrowPublicKey,
              usdcfMint
            )
          );
        }

        const transferAmount = amount * Math.pow(10, 3); // Convert to base USDCF units (3 decimals)
        console.log(
          `💰 Adding transfer instruction: ${amount} USDCF (${transferAmount} base units)`
        );
        transaction.add(
          createTransferInstruction(
            userTokenAccount,
            escrowTokenAccount,
            userPublicKey,
            transferAmount
          )
        );

        console.log(
          "🏦 Setting fee payer to platform fee payer:",
          feePayerPublicKey.toString()
        );
        transaction.feePayer = feePayerPublicKey;

        console.log(
          "🔄 Getting fresh blockhash with 'confirmed' commitment..."
        );
        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash("confirmed");
        transaction.recentBlockhash = blockhash;

        console.log("📊 Blockhash details:");
        console.log("  - Blockhash:", blockhash);
        console.log("  - Last valid block height:", lastValidBlockHeight);
        console.log("  - Current slot:", await connection.getSlot());

        console.log("📊 Transaction structure BEFORE user signing:");
        console.log("  - Fee payer:", transaction.feePayer?.toString());
        console.log("  - Recent blockhash:", transaction.recentBlockhash);
        console.log("  - Instructions count:", transaction.instructions.length);
        console.log("  - Signatures count:", transaction.signatures.length);
        console.log(
          "  - Signatures structure:",
          transaction.signatures.map((sig, i) => ({
            index: i,
            publicKey: sig.publicKey.toString(),
            hasSignature: !!sig.signature,
          }))
        );

        console.log("✍️ User signing transaction...");

        const originalBlockhash = transaction.recentBlockhash;
        const originalLastValidBlockHeight = lastValidBlockHeight;

        let signedTransaction;
        try {
          signedTransaction = await wallet.signTransaction(transaction);
          console.log("✅ User signing completed successfully");
        } catch (signingError) {
          console.error("❌ User signing failed:", signingError);
          throw signingError;
        }


        try {
          console.log(
            "🚨 CRITICAL DEBUG: Complete transaction state before backend call:"
          );
          console.log("📊 Transaction Details:");
          console.log("  - Fee payer:", signedTransaction.feePayer?.toString());
          console.log(
            "  - Recent blockhash:",
            signedTransaction.recentBlockhash
          );
          console.log(
            "  - Instructions count:",
            signedTransaction.instructions.length
          );
          console.log(
            "  - Signatures count:",
            signedTransaction.signatures.length
          );

          for (let i = 0; i < signedTransaction.signatures.length; i++) {
            try {
              const sig = signedTransaction.signatures[i];
              console.log(`📝 Signature ${i} COMPLETE DETAILS:`);
              console.log(`  - Public key: ${sig.publicKey.toString()}`);
              console.log(`  - Has signature: ${!!sig.signature}`);
              if (sig.signature) {
                console.log(
                  `  - Signature length: ${sig.signature.length} bytes`
                );
                console.log(
                  `  - Signature bytes (first 16): [${Array.from(
                    sig.signature.slice(0, 16)
                  ).join(",")}]`
                );
                console.log(
                  `  - Signature bytes (last 16): [${Array.from(
                    sig.signature.slice(-16)
                  ).join(",")}]`
                );
              }
            } catch (sigDetailError) {
              console.error(
                `❌ Error logging signature ${i} details:`,
                sigDetailError
              );
            }
          }

          for (let i = 0; i < signedTransaction.instructions.length; i++) {
            try {
              const instruction = signedTransaction.instructions[i];
              console.log(`📋 Instruction ${i} COMPLETE DETAILS:`);
              console.log(
                `  - Program ID: ${instruction.programId.toString()}`
              );
              console.log(`  - Keys count: ${instruction.keys.length}`);
              console.log(`  - Data length: ${instruction.data.length} bytes`);

              for (
                let keyIndex = 0;
                keyIndex < instruction.keys.length;
                keyIndex++
              ) {
                try {
                  const key = instruction.keys[keyIndex];
                  console.log(
                    `    - Key ${keyIndex}: ${key.pubkey.toString()} (signer: ${
                      key.isSigner
                    }, writable: ${key.isWritable})`
                  );
                } catch (keyError) {
                  console.error(`❌ Error logging key ${keyIndex}:`, keyError);
                }
              }
            } catch (instructionError) {
              console.error(
                `❌ Error logging instruction ${i}:`,
                instructionError
              );
            }
          }
        } catch (criticalLogError) {
          console.error("❌ Critical debug logging failed:", criticalLogError);
        }

        console.log("🎯 Sponsoring transaction through backend...");
        console.log("📤 Calling sponsorTransaction with:");
        console.log(
          "  - Transaction signatures:",
          signedTransaction.signatures.length
        );
        console.log(
          "  - Transaction type:",
          TransactionType.MANUSCRIPT_SUBMISSION
        );
        console.log("  - Metadata:", {
          amount,
          type: "usdc_transfer",
          userWallet: walletAddress,
        });

        const sponsorshipResult = await sponsorTransaction(
          signedTransaction,
          TransactionType.MANUSCRIPT_SUBMISSION,
          {
            amount,
            type: "usdc_transfer",
            userWallet: walletAddress,
          }
        );

        console.log("📨 Sponsorship result received:", sponsorshipResult);

        if (!sponsorshipResult.success) {
          console.error("❌ Sponsorship failed:", sponsorshipResult.error);
          throw new Error(
            sponsorshipResult.error || "Transaction sponsorship failed"
          );
        }

        console.log(
          "✅ Payment successful with gas sponsorship:",
          sponsorshipResult.signature
        );
        console.log("💰 Gas used:", sponsorshipResult.gasUsed);

        return sponsorshipResult.signature!;
      } catch (error) {
        console.error("❌ executePaymentWithSponsorship error:", error);
        console.error(
          "Error stack:",
          error instanceof Error ? error.stack : "No stack"
        );
        throw error;
      }
    },
    [wallet, walletAddress, connection, sponsorTransaction]
  );

  const processPayment = useCallback(
    async (amount: number = 50): Promise<string> => {
      console.log("🚀 processPayment called with:", {
        amount,
        wallet: !!wallet,
        walletAddress,
      });

      if (!wallet || !walletAddress) {
        console.error("❌ Wallet validation failed:", {
          wallet: !!wallet,
          walletAddress,
        });
        throw new Error("Solana wallet not connected");
      }

      console.log(
        "✅ Wallet validation passed, starting payment processing..."
      );
      setPaymentProcessing(true);
      setPaymentError(null);

      try {
        console.log(
          `💳 Processing $${amount} USDCF payment with gas sponsorship`
        );
        console.log("📞 Calling executePaymentWithSponsorship...");
        const result = await executePaymentWithSponsorship(amount);
        console.log("✅ executePaymentWithSponsorship completed:", result);
        return result;
      } catch (error) {
        console.error("❌ Payment failed with error:", error);
        console.error("❌ Error details:", {
          message: error instanceof Error ? error.message : "Unknown",
          stack: error instanceof Error ? error.stack : "No stack",
        });
        const errorMessage =
          error instanceof Error ? error.message : "Payment failed";
        setPaymentError(errorMessage);
        throw error;
      } finally {
        console.log("🏁 Payment processing finished, setting state...");
        setPaymentProcessing(false);
      }
    },
    [wallet, walletAddress, executePaymentWithSponsorship]
  );

  const processUSDCPayment = useCallback(async (): Promise<string> => {
    return processPayment(50); // $50 USDCF payment
  }, [processPayment]);

  return {
    paymentProcessing: paymentProcessing || isSponsoring,
    paymentError: paymentError || sponsorshipError,
    processPayment,
    processUSDCPayment,
  };
}
