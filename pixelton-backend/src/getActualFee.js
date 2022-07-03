const TonWeb = require("tonweb");
const fs = require("fs");
const path = require("path");
const BN = require("bn.js");

const secretKey = Buffer.from(
  fs.readFileSync(path.resolve(__dirname, "./secretKey.txt"), "utf8"),
  "hex"
);
const YOUR_MAINNET_TONCENTER_API_KEY =
  "b39d7358a9ad0e43ad2f01c7eafd14d3a14407040eb788f61325d2a3fc7a743c";

const tonweb = new TonWeb(
  new TonWeb.HttpProvider("https://toncenter.com/api/v2/jsonRPC", {
    apiKey: YOUR_MAINNET_TONCENTER_API_KEY,
  })
);

(async () => {
  const wallet = tonweb.wallet.create({
    address: "EQBHfeoFPf2mwcBdgkENn3oxO5dsVSRgsWkQaqxW5Da69gEx",
  });

  const address = await wallet.getAddress();
  console.log("address=", address.toString(true, true, true, false));

  const seqno = await wallet.methods.seqno().call(); // call get-method `seqno` of wallet smart contract
  console.log("seqno=", seqno);

  // DEPLOY

  const deploy = wallet.deploy(secretKey); // deploy method

  const deployFee = await deploy.estimateFee(); // get estimate fee of deploy
  console.log(deployFee);

  const { in_fwd_fee, storage_fee, gas_fee, fwd_fee } = deployFee.source_fees;

  const totalFee =
    (in_fwd_fee) +
    (storage_fee) +
    (gas_fee) +
    (fwd_fee);

  console.log("totalFee=", TonWeb.utils.fromNano(totalFee.toString()));
})().catch(console.error);
