import crypto from "crypto";

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function getTokenExpiry(): Date {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 30);
  return expiry;
}