import "server-only";
import { randomBytes } from "node:crypto";
import { db } from "./db";

const ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz"; // no 0/1/i/l/o

function newCode(len = 8) {
  const bytes = randomBytes(len);
  let s = "";
  for (const b of bytes) s += ALPHABET[b % ALPHABET.length];
  return s;
}

/** Returns the wallet's ref code, creating the user on first sign-in. */
export async function ensureUser(address: string): Promise<string> {
  const a = address.toLowerCase();
  const found = await db().from("users").select("ref_code").eq("address", a).maybeSingle();
  if (found.error) throw found.error;
  if (found.data) return found.data.ref_code;
  for (let i = 0; i < 5; i++) {
    const code = newCode();
    const ins = await db().from("users").insert({ address: a, ref_code: code }).select("ref_code").single();
    if (!ins.error) return ins.data.ref_code;
    if (ins.error.code !== "23505") throw ins.error; // unique violation → retry (address raced or code clash)
    const again = await db().from("users").select("ref_code").eq("address", a).maybeSingle();
    if (again.data) return again.data.ref_code;
  }
  throw new Error("Could not create a ref code");
}
