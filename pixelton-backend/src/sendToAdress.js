export const sendToAddress = async (
  toAddress,
  amountField,
  publicKey,
  secretKey
) => {
  const WalletClass = tonweb.wallet.all[walletVersion];

  const wallet = new WalletClass(tonweb.provider, {
    publicKey: TonWeb.utils.hexToBytes(publicKey),
  });

  const seqno = (await wallet.methods.seqno().call()) || 0;
  console.log({
    seqno: seqno,
    toAddress,
    amountField,
    publicKey,
    secretKey,
    amount: TonWeb.utils.toNano(amountField),
  });

  const transfer = wallet.methods.transfer({
    secretKey: TonWeb.utils.hexToBytes(secretKey),
    toAddress,
    amount: TonWeb.utils.toNano(amountField), // 0.01 TON
    seqno,
    // payload: 'Test',
    sendMode: 3,
  });

  const transferFee = await transfer.estimateFee(); // get estimate fee of transfer

  const transferSended = await transfer.send(); // send transfer query to blockchain

  // const transferQuery = await transfer.getQuery(); // get transfer query Cell

  return { transferFee, transferSended };
};
