import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Fronsciers } from "../target/types/fronsciers";
import { expect } from "chai";
import { 
  PublicKey, 
  Keypair, 
  SystemProgram, 
  LAMPORTS_PER_SOL 
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

describe("Simple Privy Test", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Fronsciers as Program<Fronsciers>;
  
  const embeddedWallet = Keypair.generate();
  const payer = Keypair.generate();

  const testPrivyUserId = "clzzx1234567890abcdef";
  const testAcademicEmail = "researcher@stanford.edu";
  const testInstitution = "Stanford University";
  const testEducation = "PhD";
  const testCvHash = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";

  before(async () => {
    // Airdrop SOL to test wallets
    await provider.connection.requestAirdrop(payer.publicKey, 2 * LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(embeddedWallet.publicKey, 2 * LAMPORTS_PER_SOL);
    
    // Wait for airdrops
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

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

    console.log("User PDA:", userPda.toString());
    console.log("Embedded Wallet:", embeddedWallet.publicKey.toString());
    console.log("Payer:", payer.publicKey.toString());

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

      console.log("✅ Privy user registration tx:", tx);

      // Verify user account was created
      const userAccount = await program.account.user.fetch(userPda);
      console.log("User account:", userAccount);
      
      expect(userAccount.wallet.toString()).to.equal(embeddedWallet.publicKey.toString());
      expect(userAccount.education).to.equal(testEducation);
      expect(userAccount.createdViaPrivy).to.be.true;
      expect(userAccount.cvVerified).to.be.false;
      
      console.log("✅ All validations passed!");
      
    } catch (error) {
      console.error("❌ Test failed:", error);
      throw error;
    }
  });
});