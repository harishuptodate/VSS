// lib/links.ts
import crypto from "crypto";

export function generateToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

export function expiryFromPreset(preset: "1h"|"12h"|"1d"|"30d"|"forever"): Date | null {
  const now = new Date();
  switch (preset) {
    case "1h": now.setHours(now.getHours() + 1); return now;
    case "12h": now.setHours(now.getHours() + 12); return now;
    case "1d": now.setDate(now.getDate() + 1); return now;
    case "30d": now.setDate(now.getDate() + 30); return now;
    case "forever": return null;
  }
}
