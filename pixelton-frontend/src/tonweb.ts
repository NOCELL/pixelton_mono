import TonWeb from "tonweb";
import { toNano } from "./utils/toNano";

const providerUrl = "https://testnet.toncenter.com/api/v2/jsonRPC";
const apiKey =
  "147867494f6a53d323c0f2559281c44eb4999ad807ca15304d7adadfaea41293"; // Obtain your API key in https://t.me/tontestnetapibot
const tonweb = new TonWeb(new TonWeb.HttpProvider(providerUrl, { apiKey })); // Initialize TON SDK
const NETWORK_FEE = toNano("0.05");
const PRICE_ONE_PIXEL = toNano("0.001");

export { tonweb, NETWORK_FEE, PRICE_ONE_PIXEL };
