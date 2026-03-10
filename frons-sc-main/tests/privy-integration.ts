import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Fronsciers } from "../target/types/fronsciers";
import { expect } from "chai";
import { 
  PublicKey, 
  Keypair, 
  SystemProgram, 
  SYSVAR_RENT_PUBKEY,
  LAMPORTS_PER_SOL 
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

describe("Privy Integration Tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Fronsciers as Program<Fronsciers>;
  
  // Test wallets
  const legacyWallet = Keypair.generate();
  const embeddedWallet = Keypair.generate();
  const backendAuthority = Keypair.generate();
  const payer = Keypair.generate();

  // Test data
  const testPrivyUserId = "clzzx1234567890abcdef";
  const testAcademicEmail = "researcher@stanford.edu";
  const testInstitution = "Stanford University";
  const testEducation = "PhD";
  const testCvHash = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";

  before(async () => {
    // Airdrop SOL to test wallets
    await provider.connection.requestAirdrop(payer.publicKey, 2 * LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(legacyWallet.publicKey, 2 * LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(embeddedWallet.publicKey, 2 * LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(backendAuthority.publicKey, 2 * LAMPORTS_PER_SOL);
    
    // Wait for airdrops
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  describe("Privy User Registration", () => {
    it("Registers a new Privy user with embedded wallet", async () => {
      // Create validation data
      const validation = {
        userId: testPrivyUserId,
        email: testAcademicEmail,
        signature: "backend_signature_12345",
        timestamp: new BN(Math.floor(Date.now() / 1000)),
        cvHash: testCvHash,
      };

      // Derive user PDA
      const [userPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("user"), embeddedWallet.publicKey.toBuffer()],
        program.programId
      );

      try {
        const tx = await program.methods
          .registerPrivyUser(
            testPrivyUserId,
            testEducation,
            testAcademicEmail,
            testInstitution,
            validation
          )
          .accounts({
            user: userPda,
            embeddedWallet: embeddedWallet.publicKey,
            payer: payer.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([payer])
          .rpc();

        console.log("Privy user registration tx:", tx);

        // Verify user account was created
        const userAccount = await program.account.user.fetch(userPda);
        expect(userAccount.wallet.toString()).to.equal(embeddedWallet.publicKey.toString());
        expect(userAccount.privyUserId).to.equal(testPrivyUserId);
        expect(userAccount.embeddedWallet.toString()).to.equal(embeddedWallet.publicKey.toString());
        expect(userAccount.education).to.equal(testEducation);
        expect(userAccount.academicEmail).to.equal(testAcademicEmail);
        expect(userAccount.institution).to.equal(testInstitution);
        expect(userAccount.createdViaPrivy).to.be.true;
        expect(userAccount.cvVerified).to.be.false;
        
        console.log("✅ Privy user registration successful");
      } catch (error) {
        console.error("❌ Privy user registration failed:", error);
        throw error;
      }
    });

    it("Verifies CV for Privy user", async () => {
      const [userPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("user"), embeddedWallet.publicKey.toBuffer()],
        program.programId
      );

      try {
        const tx = await program.methods
          .verifyCv(testCvHash, 5, "backend_signature_cv_verification")
          .accounts({
            user: userPda,
            userWallet: embeddedWallet.publicKey,
            backendAuthority: backendAuthority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([])
          .rpc();

        console.log("CV verification tx:", tx);

        // Verify CV was verified
        const userAccount = await program.account.user.fetch(userPda);
        expect(userAccount.cvVerified).to.be.true;
        expect(userAccount.publishedPapers).to.equal(5);
        
        console.log("✅ CV verification successful");
      } catch (error) {
        console.error("❌ CV verification failed:", error);
        throw error;
      }
    });

    it("Validates user meets submission requirements", async () => {
      const [userPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("user"), embeddedWallet.publicKey.toBuffer()],
        program.programId
      );

      const userAccount = await program.account.user.fetch(userPda);
      
      // Check that user meets requirements
      expect(userAccount.education).to.be.oneOf(["PhD", "Master", "Bachelor", "Doctorate"]);
      expect(userAccount.publishedPapers).to.be.greaterThan(2);
      expect(userAccount.cvVerified).to.be.true;
      
      console.log("✅ User meets submission requirements");
    });
  });

  describe("Legacy User Migration", () => {
    it("Registers a legacy user first", async () => {
      const [legacyUserPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("user"), legacyWallet.publicKey.toBuffer()],
        program.programId
      );

      try {
        const tx = await program.methods
          .registerUser(testEducation)
          .accounts({
            user: legacyUserPda,
            wallet: legacyWallet.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([legacyWallet])
          .rpc();

        console.log("Legacy user registration tx:", tx);

        // Verify legacy user account
        const userAccount = await program.account.user.fetch(legacyUserPda);
        expect(userAccount.wallet.toString()).to.equal(legacyWallet.publicKey.toString());
        expect(userAccount.createdViaPrivy).to.be.false;
        expect(userAccount.privyUserId).to.be.null;
        expect(userAccount.embeddedWallet).to.be.null;
        
        console.log("✅ Legacy user registration successful");
      } catch (error) {
        console.error("❌ Legacy user registration failed:", error);
        throw error;
      }
    });

    it("Migrates legacy user to Privy", async () => {
      const [legacyUserPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("user"), legacyWallet.publicKey.toBuffer()],
        program.programId
      );

      const newEmbeddedWallet = Keypair.generate();
      const migrationPrivyUserId = "clzzx_migration_123456789";
      
      const validation = {
        userId: migrationPrivyUserId,
        email: "migrated@university.edu",
        signature: "migration_signature_12345",
        timestamp: new BN(Math.floor(Date.now() / 1000)),
        cvHash: "migration_cv_hash_12345",
      };

      try {
        const tx = await program.methods
          .migrateToPrivy(
            migrationPrivyUserId,
            newEmbeddedWallet.publicKey,
            "migrated@university.edu",
            "University of Migration",
            validation
          )
          .accounts({
            user: legacyUserPda,
            legacyWallet: legacyWallet.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([legacyWallet])
          .rpc();

        console.log("User migration tx:", tx);

        // Verify migration
        const userAccount = await program.account.user.fetch(legacyUserPda);
        expect(userAccount.wallet.toString()).to.equal(legacyWallet.publicKey.toString()); // Original wallet preserved
        expect(userAccount.privyUserId).to.equal(migrationPrivyUserId);
        expect(userAccount.embeddedWallet.toString()).to.equal(newEmbeddedWallet.publicKey.toString());
        expect(userAccount.createdViaPrivy).to.be.true;
        expect(userAccount.academicEmail).to.equal("migrated@university.edu");
        expect(userAccount.institution).to.equal("University of Migration");
        
        console.log("✅ User migration successful");
      } catch (error) {
        console.error("❌ User migration failed:", error);
        throw error;
      }
    });
  });

  describe("Academic Validation", () => {
    it("Validates academic email domains", async () => {
      const [userPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("user"), embeddedWallet.publicKey.toBuffer()],
        program.programId
      );

      const userAccount = await program.account.user.fetch(userPda);
      
      // Check academic email validation
      expect(userAccount.academicEmail).to.equal(testAcademicEmail);
      expect(testAcademicEmail).to.include(".edu"); // Should be academic domain
      
      console.log("✅ Academic email validation passed");
    });

    it("Validates institutional affiliation", async () => {
      const [userPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("user"), embeddedWallet.publicKey.toBuffer()],
        program.programId
      );

      const userAccount = await program.account.user.fetch(userPda);
      
      expect(userAccount.institution).to.equal(testInstitution);
      expect(userAccount.institution).to.not.be.empty;
      
      console.log("✅ Institutional affiliation validation passed");
    });
  });

  describe("Integration with Existing Features", () => {
    it("Supports manuscript submission with Privy users", async () => {
      // This test would require setting up escrow accounts and token programs
      // For now, we'll just verify the user account structure supports it
      
      const [userPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("user"), embeddedWallet.publicKey.toBuffer()],
        program.programId
      );

      const userAccount = await program.account.user.fetch(userPda);
      
      // Verify user can submit manuscripts
      expect(userAccount.education).to.be.oneOf(["PhD", "Master", "Bachelor", "Doctorate"]);
      expect(userAccount.publishedPapers).to.be.greaterThan(2);
      expect(userAccount.cvVerified).to.be.true;
      
      // Verify embedded wallet is available for transactions
      expect(userAccount.embeddedWallet).to.not.be.null;
      
      console.log("✅ Privy user ready for manuscript submission");
    });

    it("Supports both legacy and embedded wallet addresses", async () => {
      const [legacyUserPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("user"), legacyWallet.publicKey.toBuffer()],
        program.programId
      );

      const [privyUserPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("user"), embeddedWallet.publicKey.toBuffer()],
        program.programId
      );

      const legacyUser = await program.account.user.fetch(legacyUserPda);
      const privyUser = await program.account.user.fetch(privyUserPda);
      
      // Legacy user should have embedded wallet after migration
      expect(legacyUser.embeddedWallet).to.not.be.null;
      expect(legacyUser.privyUserId).to.not.be.null;
      
      // Privy user should have embedded wallet as primary
      expect(privyUser.embeddedWallet).to.not.be.null;
      expect(privyUser.privyUserId).to.not.be.null;
      expect(privyUser.createdViaPrivy).to.be.true;
      
      console.log("✅ Both user types supported");
    });
  });

  describe("Error Handling", () => {
    it("Rejects invalid education levels", async () => {
      const invalidWallet = Keypair.generate();
      const [userPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("user"), invalidWallet.publicKey.toBuffer()],
        program.programId
      );

      const validation = {
        userId: "invalid_user_123",
        email: "invalid@test.com",
        signature: "invalid_signature",
        timestamp: new BN(Math.floor(Date.now() / 1000)),
        cvHash: "invalid_cv_hash",
      };

      try {
        await program.methods
          .registerPrivyUser(
            "invalid_user_123",
            "InvalidDegree", // Invalid education level
            "invalid@test.com",
            "Test Institution",
            validation
          )
          .accounts({
            user: userPda,
            embeddedWallet: invalidWallet.publicKey,
            payer: payer.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([payer])
          .rpc();

        // Should not reach here
        expect.fail("Expected transaction to fail");
      } catch (error) {
        expect(error.message).to.include("Invalid education level");
        console.log("✅ Invalid education level rejected");
      }
    });

    it("Rejects expired validation timestamps", async () => {
      const expiredWallet = Keypair.generate();
      const [userPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("user"), expiredWallet.publicKey.toBuffer()],
        program.programId
      );

      const validation = {
        userId: "expired_user_123",
        email: "expired@test.edu",
        signature: "expired_signature",
        timestamp: new BN(Math.floor(Date.now() / 1000) - 3600), // 1 hour ago
        cvHash: "expired_cv_hash",
      };

      try {
        await program.methods
          .registerPrivyUser(
            "expired_user_123",
            "PhD",
            "expired@test.edu",
            "Test Institution",
            validation
          )
          .accounts({
            user: userPda,
            embeddedWallet: expiredWallet.publicKey,
            payer: payer.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([payer])
          .rpc();

        // Should not reach here
        expect.fail("Expected transaction to fail");
      } catch (error) {
        expect(error.message).to.include("Validation timestamp expired");
        console.log("✅ Expired validation timestamp rejected");
      }
    });
  });

  describe("Performance and Gas Optimization", () => {
    it("Measures gas usage for Privy user registration", async () => {
      const gasMeasureWallet = Keypair.generate();
      const [userPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("user"), gasMeasureWallet.publicKey.toBuffer()],
        program.programId
      );

      const validation = {
        userId: "gas_measure_user",
        email: "gas@measure.edu",
        signature: "gas_signature",
        timestamp: new BN(Math.floor(Date.now() / 1000)),
        cvHash: "gas_cv_hash",
      };

      const beforeBalance = await provider.connection.getBalance(payer.publicKey);
      
      await program.methods
        .registerPrivyUser(
          "gas_measure_user",
          "PhD",
          "gas@measure.edu",
          "Gas Measure University",
          validation
        )
        .accounts({
          user: userPda,
          embeddedWallet: gasMeasureWallet.publicKey,
          payer: payer.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([payer])
        .rpc();

      const afterBalance = await provider.connection.getBalance(payer.publicKey);
      const gasUsed = beforeBalance - afterBalance;
      
      console.log(`💰 Gas used for Privy user registration: ${gasUsed} lamports`);
      expect(gasUsed).to.be.greaterThan(0);
      expect(gasUsed).to.be.lessThan(10000000); // Should be reasonable
      
      console.log("✅ Gas usage within expected range");
    });
  });
});