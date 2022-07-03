import mongoose from "mongoose";

export interface User {
  telegram_id: string;
  last_channel_id: number;
  deposit_in_contract: number;
  current_contract?: string;
  real_balance: number;
  spent_coins: number;
}

const userSchema = new mongoose.Schema<User>({
  telegram_id: { type: String, unique: true, index: true, required: false },
  last_channel_id: { type: Number, required: false, default: 0 },
  deposit_in_contract: { type: Number, required: false, default: 0 },
  current_contract: { type: String, required: false },
  real_balance: { type: Number, required: false, default: 0 },
  spent_coins: { type: Number, required: false, default: 0 },
});

const UsersCollection = mongoose.model("users", userSchema);

export { UsersCollection };
