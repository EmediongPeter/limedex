use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF");

#[program]
pub mod my_dex_swap {
    use super::*;

    pub fn initialize_swap(ctx: Context<InitializeSwap>, amount_in: u64) -> Result<()> {
        let fee = amount_in * 15 / 10000; // 0.15% fee
        let amount_after_fee = amount_in - fee;

    //     // Transfer fee to the treasury account
    //     // let cpi_accounts_fee = Transfer {
    //     //     from: ctx.accounts.user_token_account.to_account_info(),
    //     //     to: ctx.accounts.fee_account.to_account_info(),
    //     //     authority: ctx.accounts.user.to_account_info(),
    //     // };
    //     // token::transfer(CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts_fee), fee)?;

        // msg!("Final amount sent to user: {:?}", cpi_accounts_fee.authority);
        // Call Jupiter's swap instruction here (handled in frontend)

        msg!(
            "Swap fee: {} \nAmount after fee is deducted: {}",
            fee,
            amount_after_fee
        );
        msg!("user: {:?} \nToken or outputMint I assume info: {:?} \nthe fee treasury account: {:?} and the \nProgram itself: {:?}", ctx.accounts.user.data, ctx.accounts.user_token_account, ctx.accounts.fee_account, ctx.accounts.swap_program.data);

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeSwap<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub fee_account: Account<'info, TokenAccount>,
    // pub token_program: Program<'info, Token>,
    pub swap_program: Program<'info, System>,
}

/*
  instruction is this, receive the amount from the user,
  receive the swap value of the token in which the user will send to the program,
  then I will deduct 0.15% from the money received;
  send the fee to the treasury account of the program;
  send the remaining money to jupiter to swap but I don't know if it is going to be it's swap api or their swap program/send to their smart contract here in my program: IT'S EITHER THE PROGRAM OR THEIR API I WILL USE.
  After the swap, I will send the money to the user

  So the instruction will be to initialize_swap only

  the accounts or struct will contain
    - amount to be swapped
    - the address of the user who will send the money
    - address of the treasury account of the program
    - a
*/

// pub mod counter {
//   use super::*;

// pub fn close(_ctx: Context<CloseCounter>) -> Result<()> {
//   Ok(())
// }

// pub fn decrement(ctx: Context<Update>) -> Result<()> {
//   ctx.accounts.counter.count = ctx.accounts.counter.count.checked_sub(1).unwrap();
//   Ok(())
// }

// pub fn increment(ctx: Context<Update>) -> Result<()> {
//   ctx.accounts.counter.count = ctx.accounts.counter.count.checked_add(1).unwrap();
//   Ok(())
// }

// pub fn initialize(_ctx: Context<InitializeCounter>) -> Result<()> {
//   Ok(())
// }

// pub fn set(ctx: Context<Update>, value: u8) -> Result<()> {
//   ctx.accounts.counter.count = value.clone();
//   Ok(())
// }
// }

// #[derive(Accounts)]
// pub struct InitializeCounter<'info> {
// #[account(mut)]
// pub payer: Signer<'info>,

// #[account(
// init,
// space = 8 + Counter::INIT_SPACE,
// payer = payer
// )]
// pub counter: Account<'info, Counter>,
// pub system_program: Program<'info, System>,
// }
// #[derive(Accounts)]
// pub struct CloseCounter<'info> {
// #[account(mut)]
// pub payer: Signer<'info>,

// #[account(
// mut,
// close = payer, // close account and return lamports to payer
// )]
// pub counter: Account<'info, Counter>,
// }

// #[derive(Accounts)]
// pub struct Update<'info> {
// #[account(mut)]
// pub counter: Account<'info, Counter>,
// }

// #[account]
// #[derive(InitSpace)]
// pub struct Counter {
// count: u8,
// }
