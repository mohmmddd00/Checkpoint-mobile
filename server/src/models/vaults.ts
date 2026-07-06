import mongoose, { Schema, Document } from "mongoose";

export interface IVaultGame {
  gameId: number;
  title: string;
  coverImage: string | null;
  releasedDate: string | null;
}

export interface IVault extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  description: string;
  games: IVaultGame[];
  editedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const VaultGameSchema = new Schema<IVaultGame>(
  {
    gameId: { type: Number, required: true },
    title: { type: String, required: true },
    coverImage: { type: String, default: null },
    releasedDate: { type: String, default: null },
  },
  { _id: false }
);

const VaultSchema = new Schema<IVault>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    games: { type: [VaultGameSchema], default: [] },
    editedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Vault = mongoose.model<IVault>("Vault", VaultSchema);