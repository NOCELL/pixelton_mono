import mongoose from "mongoose";

export interface ContractState {
  address: string;
  balanceA: number;
  balanceB: number;
  seqnoA: number;
  seqnoB: number;
  signatureA: string;
  signatureB: string;
}

const ContractStateScheme = new mongoose.Schema<ContractState>({
  address: { type: String, index: true, required: true },
  balanceA: { type: Number, required: true },
  balanceB: { type: Number, required: true },
  seqnoA: { type: Number, required: true },
  seqnoB: { type: Number, required: true },
  signatureA: { type: String, index: false, required: true },
  signatureB: { type: String, index: false, required: true },
});

const ContractStateCollection = mongoose.model(
  "contract_states",
  ContractStateScheme
);

export { ContractStateCollection };
