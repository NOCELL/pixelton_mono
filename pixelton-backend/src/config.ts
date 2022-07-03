export interface AppConfig {
  PORT: number;
  DB_URL: string;
  BOT_WALLET_ID: string;
  BOT_SECRET_KEY_TON: string;
}

export const CONFIG = {
  PORT: process.env.PORT || 3000,
  DB_URL: process.env.DB_URL || "mongodb://localhost:27017/ton",
  BOT_WALLET_ID: process.env.BOT_WALLET_ID || "",
  BOT_SECRET_KEY_TON: process.env.BOT_SECRET_KEY_TON || "",
} as AppConfig;
