import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { FronsJSc } from "../target/types/frons_j_sc";
import { assert } from "chai";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { getAssociatedTokenAddress, createMint, createAccount, mintTo, TOKEN_PROGRAM_ID } from "@solana/spl-token";

describe("frons_j_sc E2E Scaffolding", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.FronsJSc as Program<FronsJSc>;

  // Test Accounts
  const institutionAuthority = Keypair.generate();
  const relayerFeePayer = Keypair.generate();
  const authorWallet = Keypair.generate();
  const editorWallet = Keypair.generate();
  
  // Journal settings
  const journalSlug = "nature-xyz";
  const journalName = "Nature XYZ";
  const journalDesc = "The best journal on the localnet.";

  // Spl Token Setup (USDC Mock)
  let usdcMint: PublicKey;
  let authorUsdAccount: PublicKey;
  let protocolUsdAccount: PublicKey;
  const submissionFee = new anchor.BN(50_000_000); // 50 USDC
  
  // Derived PDAs
  let journalPda: PublicKey;
  let articlePda: PublicKey;
  
  before(async () => {
    // 1. Airdrop SOL for gas and rent
    const signature1 = await provider.connection.requestAirdrop(institutionAuthority.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL);
    const signature2 = await provider.connection.requestAirdrop(relayerFeePayer.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL);
    const signature3 = await provider.connection.requestAirdrop(authorWallet.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(signature1);
    await provider.connection.confirmTransaction(signature2);
    await provider.connection.confirmTransaction(signature3);

    // 2. Setup PDAs
    [journalPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("journal"), Buffer.from(journalSlug)],
      program.programId
    );

    const ipfsHash = "QmTestHash12345";
    [articlePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("article"), journalPda.toBuffer(), authorWallet.publicKey.toBuffer(), Buffer.from(ipfsHash)],
      program.programId
    );

    // 3. Setup Mock USDC Mint for Submission Fee tests
    usdcMint = await createMint(provider.connection, relayerFeePayer, relayerFeePayer.publicKey, null, 6);
    authorUsdAccount = await getAssociatedTokenAddress(usdcMint, authorWallet.publicKey);
    protocolUsdAccount = await getAssociatedTokenAddress(usdcMint, relayerFeePayer.publicKey);

    // Create ATAs and Mint Tokens to Author
    await createAccount(provider.connection, authorWallet, usdcMint, authorWallet.publicKey);
    await createAccount(provider.connection, relayerFeePayer, usdcMint, relayerFeePayer.publicKey);
    await mintTo(provider.connection, relayerFeePayer, usdcMint, authorUsdAccount, relayerFeePayer, 100_000_000); // 100 USDC
  });

  it("Step 1: Creates a Multi-Tenant Journal with a custom slug", async () => {
    await program.methods
      .createJournal(journalSlug, journalName, journalDesc)
      .accounts({
        journal: journalPda,
        authority: institutionAuthority.publicKey,
        feePayer: relayerFeePayer.publicKey, // Relayer pays the gas
        systemProgram: SystemProgram.programId,
      } as any)
      .signers([institutionAuthority, relayerFeePayer])
      .rpc();

    const journalState = await program.account.journal.fetch(journalPda);
    assert.equal(journalState.slug, journalSlug);
    assert.equal(journalState.name, journalName);
    assert.equal(journalState.authority.toBase58(), institutionAuthority.publicKey.toBase58());
  });

  it("Step 2: Manages the Editorial Board (Invites an Editor)", async () => {
    await program.methods
      .manageEditorialBoard(editorWallet.publicKey, true)
      .accounts({
        journal: journalPda,
        authority: institutionAuthority.publicKey,
      } as any)
      .signers([institutionAuthority])
      .rpc();

    const journalState = await program.account.journal.fetch(journalPda);
    assert.isTrue(journalState.editorialBoard.some(pk => pk.toBase58() === editorWallet.publicKey.toBase58()));
  });

  it("Step 3: Submits an Article (Pays 50 USDC Submission Fee)", async () => {
    const ipfsHash = "QmTestHash12345";

    // User initiates Tx, Relayer signs as feePayer
    await program.methods
      .submitToJournal(ipfsHash)
      .accounts({
        journal: journalPda,
        article: articlePda,
        author: authorWallet.publicKey,
        feePayer: relayerFeePayer.publicKey,
        authorUsdAccount: authorUsdAccount,
        protocolUsdAccount: protocolUsdAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      } as any)
      .signers([authorWallet, relayerFeePayer])
      .rpc();

    const articleState = await program.account.journalArticle.fetch(articlePda);
    assert.equal(articleState.ipfsHash, ipfsHash);
    assert.equal(articleState.author.toBase58(), authorWallet.publicKey.toBase58());
    
    // Status is an enum. Anchor maps it to an object with the variant name as key.
    assert.property(articleState.status, 'pending'); 
  });
});
