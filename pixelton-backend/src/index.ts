import TonWeb from "tonweb";
import { Telegraf } from "telegraf";


const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => ctx.reply("Welcome"));
bot.help((ctx) => ctx.reply("Send me a sticker"));
bot.on("sticker", (ctx) => ctx.reply("👍"));
bot.hears("hi", (ctx) => ctx.reply("Hey there"));

bot.hears("chat", (ctx) => {
  ctx.reply(ctx.message.chat.id.toString());
});
bot.launch();

const YOUR_MAINNET_TONCENTER_API_KEY =
  "b39d7358a9ad0e43ad2f01c7eafd14d3a14407040eb788f61325d2a3fc7a743c";
const MY_WALLET_ADRESS = "EQBDtRqbVFYb_IfrujqQxFY52ZFIWk2rAJ8dGQG7voDlP8di";

const tonweb = new TonWeb(
  new TonWeb.HttpProvider("https://ton.starhuntapp.com/jsonRPC", {
    apiKey: YOUR_MAINNET_TONCENTER_API_KEY,
  })
);

const delayAsync = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const retryAsyncFunction = async (
  fn: () => Promise<any>,
  maxRetries: number
) => {
  let retries = 0;
  while (true) {
    try {
      return await fn();
    } catch (e) {
      if (retries >= maxRetries) {
        throw e;
      }
      retries++;
    }
  }
};


const onIncomingTransaction = async (transaction: any) => {
  try {
    console.log(`Transaction ${transaction.transaction_id.hash} has been sent`);

    const { in_msg } = transaction;
  
    const message = `Getted from ${in_msg.source} coins: ${TonWeb.utils.fromNano(
      in_msg.value
    )}\n${in_msg.message}`;
  
    console.log(message);
    await bot.telegram.sendMessage(process.env.CHAT_ID, message);
  } catch(e) {
    console.log(e);
  }
};


let counter = 0;

(async () => {
  let maxTransactionId: any = null;

  while (true) {
    console.log(
      "Start polling for new transactions, maxTransactionId:",
      maxTransactionId?.hash,
      "counter:",
      counter++
    );
    try {
      const transactions = await retryAsyncFunction(
        () =>
          tonweb.getTransactions(
            MY_WALLET_ADRESS,
            10,
            undefined,
            maxTransactionId?.hash,
            maxTransactionId?.lt
          ),
        5
      );

      for (const transaction of transactions) {
        console.log(transaction);

        const { transaction_id } = transaction;

        if (maxTransactionId === null) {
          maxTransactionId = transaction_id;
        }

        if (transaction_id.lt > maxTransactionId.lt) {
          maxTransactionId = transaction_id;
        }

        try {
          if (transaction?.in_msg?.value) {
            onIncomingTransaction(transaction);
          }
        } catch (e) {
          console.error(e);
        }
      }
    } catch (e) {
      console.error("Error:", e);
    }
    await delayAsync(100);
  }
})();
