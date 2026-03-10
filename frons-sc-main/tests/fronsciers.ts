import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Fronsciers } from "../target/types/fronsciers";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  getOrCreateAssociatedTokenAccount,
  getAssociatedTokenAddressSync,
  mintTo,
  setAuthority,
  AuthorityType,
  getAccount,
} from "@solana/spl-token";
import {
  PublicKey,
  SystemProgram,
  Keypair,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { assert } from "chai";

describe("Fronsciers — Grand Design Revenue Sharing Tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Fronsciers as Program<Fronsciers>;
  const admin = provider.wallet.publicKey;

  // Keypairs
  const author = Keypair.generate();
  const reviewer1 = Keypair.generate();
  const reviewer2 = Keypair.generate();
  const reviewer3 = Keypair.generate();
  const manuscriptAccount = Keypair.generate();
  const rejectedManuscript = Keypair.generate();

  // Treasury / Pool / Reserve wallets
  const treasuryWallet = Keypair.generate();
  const sharingPoolWallet = Keypair.generate();
  const reserveWallet = Keypair.generate();

  // PDAs
  let userPda: PublicKey;
  let escrowPda: PublicKey;
  let dociRegistryPda: PublicKey;
  let protocolPda: PublicKey;
  let authorVaultPda: PublicKey;

  // Token mints (USDC = 6 decimals per Grand Design)
  let usdcMint: PublicKey;
  let fronsMint: PublicKey;

  // Token accounts
  let authorUsdcAccount: PublicKey;
  let escrowUsdcAccount: PublicKey;
  let treasuryUsdcAccount: PublicKey;
  let sharingPoolUsdcAccount: PublicKey;
  let reserveUsdcAccount: PublicKey;
  let escrowFronsAccount: PublicKey;
  let reviewerEscrowFronsAccount: PublicKey;

  // Grand Design constants (6 decimals)
  const SUBMISSION_FEE = 50_000_000;   // $50 USDC
  const REJECTION_REFUND = 45_000_000; // $45 refund
  const REJECTION_KEEP = 5_000_000;    // $5 kept

  before(async () => {
    console.log("🚀 Setting up Grand Design Revenue Sharing Test Environment...\n");

    // ── Derive PDAs ──
    [userPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), author.publicKey.toBuffer()],
      program.programId
    );
    [escrowPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow")],
      program.programId
    );
    [dociRegistryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("doci_registry")],
      program.programId
    );
    [protocolPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("protocol")],
      program.programId
    );
    [authorVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("author_vault"), author.publicKey.toBuffer()],
      program.programId
    );

    // ── Airdrop SOL ──
    const airdropTargets = [
      author.publicKey,
      treasuryWallet.publicKey,
      sharingPoolWallet.publicKey,
      reserveWallet.publicKey,
      reviewer1.publicKey,
      reviewer2.publicKey,
      reviewer3.publicKey,
    ];

    for (const pubkey of airdropTargets) {
      const sig = await provider.connection.requestAirdrop(pubkey, 2 * LAMPORTS_PER_SOL);
      await provider.connection.confirmTransaction(sig, "confirmed");
    }
    console.log("  ✅ SOL airdropped to all accounts");

    // ── Initialize Escrow ──
    await program.methods
      .initializeEscrow()
      .accountsPartial({
        escrow: escrowPda,
        authority: admin,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    console.log("  ✅ Escrow initialized");

    // ── Initialize DOCI Registry ──
    await program.methods
      .initializeDociRegistry()
      .accountsPartial({
        dociRegistry: dociRegistryPda,
        authority: admin,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    console.log("  ✅ DOCI Registry initialized");

    // ── Create USDC mock mint (6 decimals — matches Solana USDC) ──
    usdcMint = await createMint(
      provider.connection,
      provider.wallet.payer,
      admin,
      null,
      6 // ← 6 decimals per Grand Design
    );

    // ── Create FRONS token mint (9 decimals) ──
    fronsMint = await createMint(
      provider.connection,
      provider.wallet.payer,
      admin,
      null,
      9
    );

    // Transfer FRONS mint authority to escrow PDA
    await setAuthority(
      provider.connection,
      provider.wallet.payer,
      fronsMint,
      admin,
      AuthorityType.MintTokens,
      escrowPda
    );

    console.log("  ✅ Token mints created (USDC=6 decimals, FRONS=9 decimals)");

    // ── Create all USDC token accounts ──
    authorUsdcAccount = (
      await getOrCreateAssociatedTokenAccount(provider.connection, author, usdcMint, author.publicKey)
    ).address;

    escrowUsdcAccount = (
      await getOrCreateAssociatedTokenAccount(provider.connection, provider.wallet.payer, usdcMint, escrowPda, true)
    ).address;

    treasuryUsdcAccount = (
      await getOrCreateAssociatedTokenAccount(provider.connection, treasuryWallet, usdcMint, treasuryWallet.publicKey)
    ).address;

    sharingPoolUsdcAccount = (
      await getOrCreateAssociatedTokenAccount(provider.connection, sharingPoolWallet, usdcMint, sharingPoolWallet.publicKey)
    ).address;

    reserveUsdcAccount = (
      await getOrCreateAssociatedTokenAccount(provider.connection, reserveWallet, usdcMint, reserveWallet.publicKey)
    ).address;

    escrowFronsAccount = (
      await getOrCreateAssociatedTokenAccount(provider.connection, provider.wallet.payer, fronsMint, escrowPda, true)
    ).address;

    reviewerEscrowFronsAccount = escrowFronsAccount;

    // ── Fund author with $200 USDC (enough for multiple submissions) ──
    await mintTo(
      provider.connection,
      provider.wallet.payer,
      usdcMint,
      authorUsdcAccount,
      admin,
      200_000_000 // $200 USDC (6 decimals)
    );

    console.log("  ✅ Token accounts created and funded ($200 USDC)");
    console.log("  🎯 Test environment ready!\n");
  });

  // ═══════════════════════════════════════════════════
  // 1. Initialize Protocol State
  // ═══════════════════════════════════════════════════
  it("1. Initializes protocol with treasury, pool, and reserve wallets", async () => {
    console.log("📡 Testing protocol initialization...");

    await program.methods
      .initializeProtocol(
        treasuryWallet.publicKey,
        sharingPoolWallet.publicKey,
        reserveWallet.publicKey
      )
      .accountsPartial({
        protocolState: protocolPda,
        authority: admin,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const protocol = await program.account.protocolState.fetch(protocolPda);

    assert.equal(protocol.authority.toString(), admin.toString());
    assert.equal(protocol.treasury.toString(), treasuryWallet.publicKey.toString());
    assert.equal(protocol.sharingPool.toString(), sharingPoolWallet.publicKey.toString());
    assert.equal(protocol.reserve.toString(), reserveWallet.publicKey.toString());
    assert.equal(protocol.platformFeeBps, 4000, "Platform fee should be 40%");
    assert.equal(protocol.poolFeeBps, 3000, "Pool fee should be 30%");
    assert.equal(protocol.authorFeeBps, 1000, "Author fee should be 10%");
    assert.equal(protocol.reserveFeeBps, 2000, "Reserve fee should be 20%");
    assert.equal(protocol.paused, false);

    console.log("  ✅ Protocol initialized with Grand Design fee splits");
    console.log(`     Treasury:  ${treasuryWallet.publicKey.toString().slice(0, 12)}... (40%)`);
    console.log(`     Pool:      ${sharingPoolWallet.publicKey.toString().slice(0, 12)}... (30%)`);
    console.log(`     Reserve:   ${reserveWallet.publicKey.toString().slice(0, 12)}... (20%)`);
    console.log(`     Author:    direct (10%)`);
  });

  // ═══════════════════════════════════════════════════
  // 2. Register User
  // ═══════════════════════════════════════════════════
  it("2. Registers a user successfully", async () => {
    console.log("\n📝 Testing user registration...");

    await program.methods
      .registerUser("PhD")
      .accountsPartial({
        user: userPda,
        wallet: author.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([author])
      .rpc();

    const user = await program.account.user.fetch(userPda);
    assert.equal(user.education, "PhD");
    assert.equal(user.wallet.toString(), author.publicKey.toString());

    console.log("  ✅ User registered (PhD, wallet: " + author.publicKey.toString().slice(0, 12) + "...)");

    // Initialize Reviewers
    const reviewers = [reviewer1, reviewer2, reviewer3];
    for (let i = 0; i < 3; i++) {
      const [rUserPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("user"), reviewers[i].publicKey.toBuffer()],
        program.programId
      );
      
      await program.methods
        .registerUser("PhD")
        .accountsPartial({
          user: rUserPda,
          wallet: reviewers[i].publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([reviewers[i]])
        .rpc();
    }
    console.log("  ✅ 3 Reviewer Users registered");
  });

  // ═══════════════════════════════════════════════════
  // 3. Verify CV
  // ═══════════════════════════════════════════════════
  it("3. Verifies user CV before submission", async () => {
    console.log("\n🔍 Testing CV verification...");

    await program.methods
      .verifyCv(
        "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
        5,
        "backend_signature_verification"
      )
      .accountsPartial({
        user: userPda,
        userWallet: author.publicKey,
        backendAuthority: admin,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const user = await program.account.user.fetch(userPda);
    assert.equal(user.cvVerified, true);
    assert.equal(user.publishedPapers, 5);

    console.log("  ✅ CV verified (5 papers, cv_verified=true)");

    const reviewers = [reviewer1, reviewer2, reviewer3];
    for (let i = 0; i < 3; i++) {
      const [rUserPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("user"), reviewers[i].publicKey.toBuffer()],
        program.programId
      );
      
      await program.methods
        .verifyCv("bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi", 5, "backend_sig")
        .accountsPartial({
          user: rUserPda,
          userWallet: reviewers[i].publicKey,
          backendAuthority: admin,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await program.methods
        .mockVerifyReviewer(`reviewer${i}@university.edu`)
        .accountsPartial({
          user: rUserPda,
          wallet: reviewers[i].publicKey,
        })
        .signers([reviewers[i]])
        .rpc();
    }

    const r3Pda = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), reviewers[2].publicKey.toBuffer()],
      program.programId
    )[0];
    const r3User = await program.account.user.fetch(r3Pda);
    console.log(`Reviewer 3 CV verified state: ${r3User.cvVerified}, email: ${r3User.academicEmail}`);
    assert.isTrue(r3User.cvVerified, "Reviewer 3 CV MUST be verified");

    console.log("  ✅ 3 Reviewers CVs and Academic Emails mocked successfully");
  });

  // ═══════════════════════════════════════════════════
  // 4. Submit Manuscript ($50 USDC to escrow)
  // ═══════════════════════════════════════════════════
  it("4. Submits manuscript — $50 USDC goes to escrow", async () => {
    console.log("\n📄 Testing manuscript submission...");

    const authorBalanceBefore = await getAccount(provider.connection, authorUsdcAccount);
    const authorBefore = Number(authorBalanceBefore.amount);

    await program.methods
      .submitManuscript("QmTestHashGrandDesign123")
      .accountsPartial({
        manuscript: manuscriptAccount.publicKey,
        user: userPda,
        author: author.publicKey,
        authorUsdAccount: authorUsdcAccount,
        escrowUsdAccount: escrowUsdcAccount,
        escrow: escrowPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([author, manuscriptAccount])
      .rpc();

    const manuscript = await program.account.manuscript.fetch(manuscriptAccount.publicKey);
    assert.equal(manuscript.ipfsHash, "QmTestHashGrandDesign123");
    assert.isOk(manuscript.status.pending, "Status should be Pending");

    const authorBalanceAfter = await getAccount(provider.connection, authorUsdcAccount);
    const authorAfter = Number(authorBalanceAfter.amount);
    assert.equal(authorBefore - authorAfter, SUBMISSION_FEE, "Author should pay $50 USDC");

    const escrowBalance = await getAccount(provider.connection, escrowUsdcAccount);
    assert.equal(Number(escrowBalance.amount), SUBMISSION_FEE, "Escrow should hold $50 USDC");

    console.log("  ✅ Manuscript submitted");
    console.log(`     IPFS Hash: ${manuscript.ipfsHash}`);
    console.log(`     Author paid: $${(authorBefore - authorAfter) / 1e6} USDC`);
    console.log(`     Escrow holds: $${Number(escrowBalance.amount) / 1e6} USDC`);
  });

  // ═══════════════════════════════════════════════════
  // 5. Review & Accept — 4-Way Revenue Split
  // ═══════════════════════════════════════════════════
  it("5. Reviews manuscript — 4-way split: $20 treasury / $15 pool / $5 author / $10 reserve", async () => {
    console.log("\n🔍 Testing review process with Grand Design revenue split...");

    const reviewers = [reviewer1, reviewer2, reviewer3];

    // Record balances before
    const authorBefore = Number((await getAccount(provider.connection, authorUsdcAccount)).amount);

    for (let i = 0; i < 3; i++) {
      console.log(`     📋 Review ${i + 1}/3 from ${reviewers[i].publicKey.toString().slice(0, 8)}...`);

      const [rUserPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("user"), reviewers[i].publicKey.toBuffer()],
        program.programId
      );

      await program.methods
        .reviewManuscript({ accepted: {} })
        .accountsPartial({
          manuscript: manuscriptAccount.publicKey,
          reviewer: reviewers[i].publicKey,
          reviewerUser: rUserPda,
          author: userPda,
          protocolState: protocolPda,
          escrowUsdAccount: escrowUsdcAccount,
          authorUsdAccount: authorUsdcAccount,
          treasuryUsdAccount: treasuryUsdcAccount,
          sharingPoolUsdAccount: sharingPoolUsdcAccount,
          reserveUsdAccount: reserveUsdcAccount,
          fronsMint: fronsMint,
          escrow: escrowPda,
          escrowTokenAccount: escrowFronsAccount,
          reviewerEscrowTokenAccount: reviewerEscrowFronsAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([reviewers[i]])
        .rpc();
    }

    // ── Verify manuscript accepted ──
    const manuscript = await program.account.manuscript.fetch(manuscriptAccount.publicKey);
    assert.isOk(manuscript.status.accepted, "Status should be Accepted");
    assert.equal(manuscript.reviewers.length, 3);

    // ── Verify 4-way split ──
    const treasuryBalance = Number((await getAccount(provider.connection, treasuryUsdcAccount)).amount);
    const poolBalance = Number((await getAccount(provider.connection, sharingPoolUsdcAccount)).amount);
    const authorAfter = Number((await getAccount(provider.connection, authorUsdcAccount)).amount);
    const reserveBalance = Number((await getAccount(provider.connection, reserveUsdcAccount)).amount);
    const escrowBalance = Number((await getAccount(provider.connection, escrowUsdcAccount)).amount);

    console.log("\n  💰 Revenue Split Results:");
    console.log(`     Treasury:  $${treasuryBalance / 1e6} USDC (expected: $20)`);
    console.log(`     Pool:      $${poolBalance / 1e6} USDC (expected: $15)`);
    console.log(`     Author:    +$${(authorAfter - authorBefore) / 1e6} USDC (expected: +$5)`);
    console.log(`     Reserve:   $${reserveBalance / 1e6} USDC (expected: $10)`);
    console.log(`     Escrow:    $${escrowBalance / 1e6} USDC (expected: $0)`);

    assert.equal(treasuryBalance, 20_000_000, "Treasury should receive $20 (40% of $50)");
    assert.equal(poolBalance, 15_000_000, "Pool should receive $15 (30% of $50)");
    assert.equal(authorAfter - authorBefore, 5_000_000, "Author should receive $5 (10% of $50)");
    assert.equal(reserveBalance, 10_000_000, "Reserve should receive $10 (20% of $50)");
    assert.equal(escrowBalance, 0, "Escrow should be empty after split");

    // ── Verify FRONS rewards ──
    const fronsBalance = Number((await getAccount(provider.connection, escrowFronsAccount)).amount);
    console.log(`     FRONS minted: ${fronsBalance / 1e9} (author: 0.1 + reviewers: 3×0.06 = 0.28)`);
    assert.equal(fronsBalance, 280_000_000, "Should mint 0.1 + 3×0.06 = 0.28 FRONS");

    console.log("  ✅ Grand Design 4-way split verified!");
  });

  // ═══════════════════════════════════════════════════
  // 6. Initialize Author Vault
  // ═══════════════════════════════════════════════════
  it("6. Initializes author vault for citation earnings", async () => {
    console.log("\n🏦 Testing author vault initialization...");

    await program.methods
      .initializeAuthorVault()
      .accountsPartial({
        authorVault: authorVaultPda,
        author: author.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([author])
      .rpc();

    const vault = await program.account.authorVault.fetch(authorVaultPda);
    assert.equal(vault.author.toString(), author.publicKey.toString());
    assert.equal(Number(vault.totalEarned), 0);
    assert.equal(Number(vault.claimable), 0);
    assert.equal(Number(vault.totalCitations), 0);

    console.log("  ✅ Author vault initialized (claimable: $0, citations: 0)");
  });

  // ═══════════════════════════════════════════════════
  // 7. DOCI NFT Minting (with updated RoyaltyConfig)
  // ═══════════════════════════════════════════════════
  it("7. Mints DOCI NFT with Grand Design royalty splits", async () => {
    console.log("\n🎨 Testing DOCI NFT minting...");

    const dociMintKeypair = Keypair.generate();

    const [dociManuscriptPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("doci_manuscript"), manuscriptAccount.publicKey.toBuffer()],
      program.programId
    );

    const authorNftTokenAccount = getAssociatedTokenAddressSync(
      dociMintKeypair.publicKey,
      author.publicKey
    );

    await program.methods
      .mintDociNft("Grand Design Test Paper", "Testing revenue sharing on Fronsciers")
      .accountsPartial({
        manuscript: manuscriptAccount.publicKey,
        dociRegistry: dociRegistryPda,
        dociManuscript: dociManuscriptPda,
        dociMint: dociMintKeypair.publicKey,
        author: author.publicKey,
        authorTokenAccount: authorNftTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([author, dociMintKeypair])
      .rpc();

    const dociManuscript = await program.account.dociManuscript.fetch(dociManuscriptPda);
    const manuscript = await program.account.manuscript.fetch(manuscriptAccount.publicKey);

    // Verify royalty config matches Grand Design
    assert.equal(dociManuscript.royaltyConfig.authorsShare, 1000, "Authors share should be 10%");
    assert.equal(dociManuscript.royaltyConfig.platformShare, 4000, "Platform share should be 40%");
    assert.equal(dociManuscript.royaltyConfig.poolShare, 3000, "Pool share should be 30%");
    assert.equal(dociManuscript.royaltyConfig.reserveShare, 2000, "Reserve share should be 20%");
    assert.isOk(manuscript.status.published, "Status should be Published");

    // Verify NFT
    const nftAccount = await getAccount(provider.connection, authorNftTokenAccount);
    assert.equal(nftAccount.amount.toString(), "1", "Author should have 1 DOCI NFT");

    console.log("  ✅ DOCI NFT minted");
    console.log(`     DOCI: ${dociManuscript.doci}`);
    console.log(`     Royalty: author=10%, platform=40%, pool=30%, reserve=20%`);
    console.log(`     Status: Published`);
  });

  // ═══════════════════════════════════════════════════
  // 8. Rejection — $45 refund, $5 kept
  // ═══════════════════════════════════════════════════
  it("8. Rejects manuscript — refunds $45, keeps $5 in treasury", async () => {
    console.log("\n❌ Testing manuscript rejection with partial refund...");

    // Submit a second manuscript
    await program.methods
      .submitManuscript("QmRejectedManuscriptHash")
      .accountsPartial({
        manuscript: rejectedManuscript.publicKey,
        user: userPda,
        author: author.publicKey,
        authorUsdAccount: authorUsdcAccount,
        escrowUsdAccount: escrowUsdcAccount,
        escrow: escrowPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([author, rejectedManuscript])
      .rpc();

    // Record balances before rejection
    const authorBefore = Number((await getAccount(provider.connection, authorUsdcAccount)).amount);
    const treasuryBefore = Number((await getAccount(provider.connection, treasuryUsdcAccount)).amount);

    // 3 rejection reviews
    const reviewers = [reviewer1, reviewer2, reviewer3];
    for (let i = 0; i < 3; i++) {
      const [rUserPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("user"), reviewers[i].publicKey.toBuffer()],
        program.programId
      );

      await program.methods
        .reviewManuscript({ rejected: {} })
        .accountsPartial({
          manuscript: rejectedManuscript.publicKey,
          reviewer: reviewers[i].publicKey,
          reviewerUser: rUserPda,
          author: userPda,
          protocolState: protocolPda,
          escrowUsdAccount: escrowUsdcAccount,
          authorUsdAccount: authorUsdcAccount,
          treasuryUsdAccount: treasuryUsdcAccount,
          sharingPoolUsdAccount: sharingPoolUsdcAccount,
          reserveUsdAccount: reserveUsdcAccount,
          fronsMint: fronsMint,
          escrow: escrowPda,
          escrowTokenAccount: escrowFronsAccount,
          reviewerEscrowTokenAccount: reviewerEscrowFronsAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([reviewers[i]])
        .rpc();
    }

    const manuscript = await program.account.manuscript.fetch(rejectedManuscript.publicKey);
    assert.isOk(manuscript.status.rejected, "Status should be Rejected");

    const authorAfter = Number((await getAccount(provider.connection, authorUsdcAccount)).amount);
    const treasuryAfter = Number((await getAccount(provider.connection, treasuryUsdcAccount)).amount);
    const escrowAfter = Number((await getAccount(provider.connection, escrowUsdcAccount)).amount);

    const authorRefund = authorAfter - authorBefore;
    const treasuryGain = treasuryAfter - treasuryBefore;

    console.log(`     Author refund: $${authorRefund / 1e6} (expected: $45)`);
    console.log(`     Treasury kept: $${treasuryGain / 1e6} (expected: $5)`);
    console.log(`     Escrow remaining: $${escrowAfter / 1e6} (expected: $0)`);

    assert.equal(authorRefund, REJECTION_REFUND, "Author should receive $45 refund");
    assert.equal(treasuryGain, REJECTION_KEEP, "Treasury should keep $5");
    assert.equal(escrowAfter, 0, "Escrow should be empty");

    console.log("  ✅ Rejection partial refund verified ($45 back, $5 kept)");
  });

  // ═══════════════════════════════════════════════════
  // 9. Final Economic Model Summary
  // ═══════════════════════════════════════════════════
  it("9. Verifies complete Grand Design economic model", async () => {
    console.log("\n📊 Complete Grand Design Economic Model Verification\n");

    const treasuryBalance = Number((await getAccount(provider.connection, treasuryUsdcAccount)).amount);
    const poolBalance = Number((await getAccount(provider.connection, sharingPoolUsdcAccount)).amount);
    const reserveBalance = Number((await getAccount(provider.connection, reserveUsdcAccount)).amount);
    const fronsBalance = Number((await getAccount(provider.connection, escrowFronsAccount)).amount);

    console.log("  ═══ Submission Revenue ($50 USDC) ═══");
    console.log(`  Treasury:  $${20} (40%) — actual: $${treasuryBalance / 1e6}`);
    console.log(`  Pool:      $${15} (30%) — actual: $${poolBalance / 1e6}`);
    console.log(`  Author:    $${5} (10%) — verified in test 5`);
    console.log(`  Reserve:   $${10} (20%) — actual: $${reserveBalance / 1e6}`);

    console.log("\n  ═══ Rejection Handling ($50 USDC) ═══");
    console.log(`  Author refund: $45 — verified in test 8`);
    console.log(`  Treasury kept: $5 — included in treasury total`);

    console.log("\n  ═══ FRONS Rewards ═══");
    console.log(`  Author:    0.1 FRONS`);
    console.log(`  Reviewers: 0.18 FRONS (3 × 0.06)`);
    console.log(`  Total:     ${fronsBalance / 1e9} FRONS`);

    console.log("\n  ═══ DOCI NFT Royalty Config ═══");
    console.log("  Author:   10% | Platform: 40% | Pool: 30% | Reserve: 20%");

    // Treasury should have $20 from acceptance + $5 from rejection = $25
    assert.equal(treasuryBalance, 25_000_000, "Treasury total: $20 (accept) + $5 (reject) = $25");

    console.log("\n  ✅ All Grand Design revenue splits verified!");
  });

  after(() => {
    console.log("\n🎉 Fronsciers Grand Design Test Suite Complete!");
    console.log("═══════════════════════════════════════════════");
    console.log("✅ Protocol initialization with 4-way wallets");
    console.log("✅ User registration & CV verification");
    console.log("✅ Manuscript submission ($50 USDC, 6 decimals)");
    console.log("✅ Review + Accept: 40/30/10/20 split");
    console.log("✅ Review + Reject: $45 refund, $5 kept");
    console.log("✅ Author vault initialization");
    console.log("✅ DOCI NFT with Grand Design royalty config");
    console.log("✅ Complete economic model verified");
    console.log("═══════════════════════════════════════════════\n");
  });
});
