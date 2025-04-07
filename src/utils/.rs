// lib.rs
use anchor_lang::prelude::*;

declare_id!("FEE5PROGRAM11111111111111111111111111111");

#[program]
pub mod fee_account_manager {
    use super::*;

    // Initialize fee account if it doesn't exist
    pub fn ensure_fee_account(
        ctx: Context<EnsureFeeAccount>,
    ) -> Result<()> {
        // Account creation is handled automatically by Anchor
        // when using the init_if_needed constraint
        Ok(())
    }
}

#[derive(Accounts)]
pub struct EnsureFeeAccount<'info> {
    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = fee_owner
    )]
    pub fee_account: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub fee_owner: SystemAccount<'info>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

/*
CLIENT SIDE USAGE
import { Program } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';

// 1. Initialize program
const programId = new PublicKey("FEE5PROGRAM11111111111111111111111111111");
const program = new Program(idl, programId, provider);

// 2. Prepare accounts
const feeOwner = new PublicKey("GQqS2np5FTfzuzaG3fjJGjPie3GjDWz9UfibNEemnnC3");
const feeAccount = await getAssociatedTokenAddress(
  outputMint,
  feeOwner
);

// 3. Execute program
await program.methods.ensureFeeAccount()
  .accounts({
    feeAccount,
    mint: outputMint,
    payer: platformWallet.publicKey,
    feeOwner,
    tokenProgram: TOKEN_PROGRAM_ID,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId
  })
  .signers([platformWallet])
  .rpc();

  // Fund the program's PDA
const [pda] = PublicKey.findProgramAddressSync(
  [Buffer.from("fee_account_creator")],
  programId
);

// Transfer SOL to PDA
const transferTx = new Transaction().add(
  SystemProgram.transfer({
    fromPubkey: platformWallet.publicKey,
    toPubkey: pda,
    lamports: 1_000_000_000 // 1 SOL
  })
);
await sendAndConfirmTransaction(connection, transferTx, [platformWallet]);
*/