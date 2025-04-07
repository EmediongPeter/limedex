export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void => {
    let timeoutId: NodeJS.Timeout;
    
    return (...args: Parameters<T>): void => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  // async function initializeAllFeeAccounts() {
  //   const tokenMints = [USDC_MINT, SOL_MINT, /* other tokens you support */];
  //   const feeOwner = new PublicKey("GQqS2...");
  //   const adminKeypair = Keypair.fromSecretKey(/* your platform wallet */);
    
  //   for (const mint of tokenMints) {
  //     const ata = await getAssociatedTokenAddress(mint, feeOwner);
  //     try {
  //       await getAccount(connection, ata);
  //     } catch {
  //       const tx = new Transaction().add(
  //         createAssociatedTokenAccountInstruction(
  //           adminKeypair.publicKey,
  //           ata,
  //           feeOwner,
  //           mint
  //         )
  //       );
  //       await sendAndConfirmTransaction(connection, tx, [adminKeypair]);
  //     }
  //   }
  // }

  // const createFeeAccountIx = createAssociatedTokenAccountInstruction(
  //   wallet.publicKey,
  //   feeAccount,
  //   feeAccountOwner,
  //   outputMint
  // );

//   const combinedTx = new Transaction().add(createFeeAccountIx);
// swapTransaction.message.instructions.forEach(ix => {
//   combinedTx.add(new TransactionInstruction({
//     keys: ix.keys.map(k => ({...k})),
//     programId: ix.programId,
//     data: Buffer.from(ix.data)
//   }));
// });

// async function ensureFeeAccountExists(connection, wallet, mint) {
//   try {
//     // First try with platform wallet
//     await initializeWithPlatformWallet(mint);
//     return feeAccount;
//   } catch (platformError) {
//     console.warn("Platform wallet failed, falling back to user");
//     // Fallback to user-paid creation
//     return initializeWithUserWallet(connection, wallet, mint);
//   }
// }

// const PLATFORM_WALLET = Keypair.fromSecretKey(/* ... */);
// const SUPPORTED_TOKENS = [USDC_MINT, SOL_MINT, /* ... */];

// async function initializePlatform() {
//   for (const mint of SUPPORTED_TOKENS) {
//     await createFeeAccountIfNotExists(PLATFORM_WALLET, mint);
//   }
// }
