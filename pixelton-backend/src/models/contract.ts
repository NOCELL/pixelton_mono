import mongoose from "mongoose";

export interface ContractDB {
  owner: string;
  address: string;
  balanceA: string; // A's initial balance in Toncoins. Next A will need to make a top-up for this amount
  balanceB: string; // B's initial balance in Toncoins. Next B will need to make a top-up for this amount
  seqnoA: string; // initially 0
  seqnoB: string;
  channelId: string;
  publicKeyA: number[];
  publicKeyB: number[];
  isA: boolean;
  inited: boolean;
}

const contractSchema = new mongoose.Schema<ContractDB>({
  owner: { type: String, index: false, required: false },
  address: { type: String, unique: true, index: true, required: true },

  balanceA: { type: String, required: true }, // A's initial balance in Toncoins. Next A will need to make a top-up for this amount
  balanceB: { type: String, required: true }, // B's initial balance in Toncoins. Next B will need to make a top-up for this amount
  seqnoA: { type: String, required: true }, // initially 0
  seqnoB: { type: String, required: true },
  channelId: { type: String, index: false, required: true },
  publicKeyA: [Number],
  publicKeyB: [Number],
  isA: { type: Boolean, required: true },
  inited: { type: Boolean, required: false, default: false },
});

const ContractsCollection = mongoose.model("contracts", contractSchema);

export { ContractsCollection };
