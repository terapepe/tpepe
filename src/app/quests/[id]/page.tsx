import type { Metadata } from "next";
import CampaignLanding from "./CampaignLanding";

type Props = { params: Promise<{ id: string }> };

async function load(id: string) {
  // server-side read for link previews; the page itself loads data in the browser
  try {
    const { backendReady } = await import("@/server/env");
    if (!backendReady()) return undefined;
    const { db } = await import("@/server/db");
    const r = await db().from("campaigns").select("content").eq("id", Number(id)).maybeSingle();
    return r.data?.content as { name: string; ticker: string; description: string } | undefined;
  } catch {
    return undefined;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const c = Number.isSafeInteger(Number(id)) ? await load(id) : undefined;
  if (!c) return { title: "Share quest" };
  const title = `${c.name} ($${c.ticker})`;
  const description = c.description?.slice(0, 180) || `Check out ${c.name} on TeraPepe.`;
  return { title, description, openGraph: { title, description }, twitter: { title, description } };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <CampaignLanding id={Number(id)} />;
}
