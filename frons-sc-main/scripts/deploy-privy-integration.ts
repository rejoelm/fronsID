import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Fronsciers } from "../target/types/fronsciers";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { writeFileSync } from "fs";


async function main() {
    console.log("🚀 Deploying Privy-enhanced Fronsciers Smart Contract...\n");

    
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const program = anchor.workspace.Fronsciers as Program<Fronsciers>;

    console.log("📋 Deployment Configuration:");
    console.log(`• Network: ${provider.connection.rpcEndpoint}`);
    console.log(`• Program ID: ${program.programId.toString()}`);
    console.log(`• Deployer: ${provider.wallet.publicKey.toString()}`);
    console.log(`• Anchor Version: ${anchor.VERSION}`);
    console.log("");

  
    const deployerBalance = await provider.connection.getBalance(provider.wallet.publicKey);
    console.log(`💰 Deployer Balance: ${deployerBalance / LAMPORTS_PER_SOL} SOL`);
    
    if (deployerBalance < 0.1 * LAMPORTS_PER_SOL) {
        console.error("❌ Insufficient balance for deployment. Need at least 0.1 SOL");
        process.exit(1);
    }

   
    console.log("1. 🏗️ Initializing DOCI Registry...");
    
    const [dociRegistryPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("doci_registry")],
        program.programId
    );

    try {
        await program.methods
            .initializeDociRegistry()
            .accounts({
                dociRegistry: dociRegistryPda,
                authority: provider.wallet.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .rpc();
        
        console.log("✅ DOCI Registry initialized successfully");
        console.log(`   Registry PDA: ${dociRegistryPda.toString()}`);
    } catch (error) {
        if (error.message.includes("already in use")) {
            console.log("⚠️ DOCI Registry already initialized");
        } else {
            console.error("❌ DOCI Registry initialization failed:", error);
            throw error;
        }
    }

  
    console.log("\n2. 🔐 Initializing Escrow Account...");
    
    const [escrowPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow")],
        program.programId
    );

    try {
        await program.methods
            .initializeEscrow()
            .accounts({
                escrow: escrowPda,
                authority: provider.wallet.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .rpc();
        
        console.log("✅ Escrow Account initialized successfully");
        console.log(`   Escrow PDA: ${escrowPda.toString()}`);
    } catch (error) {
        if (error.message.includes("already in use")) {
            console.log("⚠️ Escrow Account already initialized");
        } else {
            console.error("❌ Escrow Account initialization failed:", error);
            throw error;
        }
    }

   
    if (provider.connection.rpcEndpoint.includes("localhost") || 
        provider.connection.rpcEndpoint.includes("devnet")) {
        
        console.log("\n3. 🧪 Creating Test Users (Development Environment)...");
        
       
        const legacyTestWallet = Keypair.generate();
        const [legacyUserPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("user"), legacyTestWallet.publicKey.toBuffer()],
            program.programId
        );

        try {
            
            await provider.connection.requestAirdrop(legacyTestWallet.publicKey, LAMPORTS_PER_SOL);
            await new Promise(resolve => setTimeout(resolve, 1000));

            await program.methods
                .registerUser("PhD")
                .accounts({
                    user: legacyUserPda,
                    wallet: legacyTestWallet.publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .signers([legacyTestWallet])
                .rpc();

            console.log("✅ Test legacy user created");
            console.log(`   Wallet: ${legacyTestWallet.publicKey.toString()}`);
            console.log(`   User PDA: ${legacyUserPda.toString()}`);
        } catch (error) {
            console.error("❌ Test legacy user creation failed:", error);
        }

    
        const privyTestWallet = Keypair.generate();
        const [privyUserPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("user"), privyTestWallet.publicKey.toBuffer()],
            program.programId
        );

        try {
            const validation = {
                userId: "test_privy_user_123",
                email: "test@stanford.edu",
                signature: "test_signature_12345",
                timestamp: new Date().getTime() / 1000,
                cvHash: "test_cv_hash_12345",
            };

            await program.methods
                .registerPrivyUser(
                    "test_privy_user_123",
                    "PhD",
                    "test@stanford.edu",
                    "Stanford University",
                    validation
                )
                .accounts({
                    user: privyUserPda,
                    embeddedWallet: privyTestWallet.publicKey,
                    payer: provider.wallet.publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();

            console.log("✅ Test Privy user created");
            console.log(`   Embedded Wallet: ${privyTestWallet.publicKey.toString()}`);
            console.log(`   User PDA: ${privyUserPda.toString()}`);
        } catch (error) {
            console.error("❌ Test Privy user creation failed:", error);
        }
    }

    // 4. Export Configuration
    console.log("\n4. 📄 Exporting Configuration...");
    
    const deploymentConfig = {
        network: provider.connection.rpcEndpoint,
        programId: program.programId.toString(),
        deployer: provider.wallet.publicKey.toString(),
        deploymentTime: new Date().toISOString(),
        accounts: {
            dociRegistry: dociRegistryPda.toString(),
            escrow: escrowPda.toString(),
        },
        features: {
            privyIntegration: true,
            backwardCompatibility: true,
            academicValidation: true,
            cvVerification: true,
        },
        constants: {
            submissionFee: "50000000000", // 50 USD in lamports (with 9 decimals)
            fronsReward: "100000000", // 0.1 USD
            reviewerReward: "60000000", // 0.06 USD
            minReviews: 3,
            userSpace: "500", 
            manuscriptSpace: "800", 
        },
        validationRules: {
            educationLevels: ["PhD", "Master", "Bachelor", "Doctorate"],
            academicDomains: [".edu", ".ac.uk", ".ac.in", ".edu.au", ".ac.jp"],
            validationWindow: 600, 
            minPublishedPapers: 3,
        }
    };

    writeFileSync("./deployment-config.json", JSON.stringify(deploymentConfig, null, 2));
    console.log("✅ Configuration exported to deployment-config.json");

    
    console.log("\n5. ✅ Verifying Deployment...");
    
    try {

        const dociRegistry = await program.account.dociRegistry.fetch(dociRegistryPda);
        console.log(`• DOCI Registry: ${dociRegistry.totalPublished} total published`);
        
    
        const escrowAccount = await program.account.escrowAccount.fetch(escrowPda);
        console.log(`• Escrow Authority: ${escrowAccount.authority.toString()}`);
        
        console.log("\n🎉 Deployment Verification Complete!");
        
    } catch (error) {
        console.error("❌ Deployment verification failed:", error);
        throw error;
    }

 
    console.log("\n📊 Deployment Summary:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`✅ Smart Contract: ${program.programId.toString()}`);
    console.log(`✅ DOCI Registry: ${dociRegistryPda.toString()}`);
    console.log(`✅ Escrow Account: ${escrowPda.toString()}`);
    console.log(`✅ Network: ${provider.connection.rpcEndpoint}`);
    console.log(`✅ Deployer: ${provider.wallet.publicKey.toString()}`);
    console.log("");
    console.log("🌟 Features Enabled:");
    console.log("  • Privy Embedded Wallet Integration");
    console.log("  • Legacy Wallet Backward Compatibility");
    console.log("  • Academic Email Validation");
    console.log("  • CV Verification System");
    console.log("  • User Migration Support");
    console.log("  • Enhanced Error Handling");
    console.log("");
    console.log("📚 Next Steps:");
    console.log("  1. Update frontend to use new contract");
    console.log("  2. Configure backend for CV verification");
    console.log("  3. Test user registration flows");
    console.log("  4. Deploy to production network");
    console.log("");
    console.log("🚀 Deployment Complete! Ready for Privy Integration.");
}

main()
    .then(() => {
        console.log("\n✅ Deployment script completed successfully");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Deployment failed:", error);
        process.exit(1);
    });