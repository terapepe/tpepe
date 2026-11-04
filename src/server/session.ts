import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { env } from "./env";

const COOKIE = "tp_session";
const DEVICE = "tp_dev";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function sign(payload: string) {
  return createHmac("sha256", env.sessionSecret).update(payload).digest("base64url");
}

export async function setSession(address: string) {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const payload = Buffer.from(JSON.stringify({ a: address.toLowerCase(), exp })).toString("base64url");
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: MAX_AGE,
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

/** Lower-cased wallet address of the signed-in user, or null. */
export async function getSession(): Promise<string | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const [payload, mac] = raw.split(".");
  if (!payload || !mac) return null;
  const a = Buffer.from(sign(payload));
  const b = Buffer.from(mac);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const { a: address, exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof address !== "string" || typeof exp !== "number" || exp < Date.now() / 1000) return null;
    return address;
  } catch {
    return null;
  }
}

/** Stable random id for this browser, kept in an httpOnly cookie. */
export async function deviceId(): Promise<string> {
  const jar = await cookies();
  let id = jar.get(DEVICE)?.value;
  if (!id || !/^[A-Za-z0-9_-]{22}$/.test(id)) {
    id = randomBytes(16).toString("base64url");
    jar.set(DEVICE, id, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
  }
  return id;
}

export function hashWithSalt(value: string) {
  return createHmac("sha256", env.ipSalt).update(value).digest("hex");
}
