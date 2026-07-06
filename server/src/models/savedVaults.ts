import mongoose, { Schema, Document } from "mongoose";

export interface ISavedVault extends Document {
  user: mongoose.Types.ObjectId;
  vault: mongoose.Types.ObjectId;
  savedAt: Date;
}

const SavedVaultSchema = new Schema<ISavedVault>({
  user:    { type: Schema.Types.ObjectId, ref: "User",  required: true },
  vault:   { type: Schema.Types.ObjectId, ref: "Vault", required: true },
  savedAt: { type: Date, default: Date.now },
});

// Prevent a user from saving the same vault twice
SavedVaultSchema.index({ user: 1, vault: 1 }, { unique: true });

export const SavedVault = mongoose.model<ISavedVault>("SavedVault", SavedVaultSchema);