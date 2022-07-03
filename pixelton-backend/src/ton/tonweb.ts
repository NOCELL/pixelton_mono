import TonWeb from "tonweb";

const providerUrl = "https://ton.starhuntapp.com/jsonRPC"; // TON HTTP API url. Use this url for testnet
const apiKey =
  "147867494f6a53d323c0f2559281c44eb4999ad807ca15304d7adadfaea41293"; // Obtain your API key in https://t.me/tontestnetapibot
const tonweb = new TonWeb(new TonWeb.HttpProvider(providerUrl, { apiKey })); // Initialize TON SDK

export { tonweb };
