import "server-only";

export type CampaignRow = {
  id: number;
  creator: string;
  deposit: string;
  reward_per_visit: string;
  reward_per_click: string;
  starts_at: string;
  ends_at: string;
  content: Record<string, string>;
  earned: string;
  exhausted_at: string | null;
  closed: boolean;
};

// numeric amounts are cast to text so 18-decimal values never pass through a JS number
export const CAMPAIGN_COLUMNS =
  "id, creator, deposit::text, reward_per_visit::text, reward_per_click::text, starts_at, ends_at, content, earned::text, exhausted_at, closed";

/** Public view of a campaign. Amounts stay as raw-unit strings (18 decimals). */
export function publicCampaign(c: CampaignRow) {
  const remaining = (BigInt(c.deposit) - BigInt(c.earned)).toString();
  const now = Date.now();
  const ended = c.closed || now >= Date.parse(c.ends_at);
  return {
    id: c.id,
    creator: c.creator,
    content: c.content,
    deposit: c.deposit,
    remaining,
    rewardPerVisit: c.reward_per_visit,
    rewardPerClick: c.reward_per_click,
    startsAt: c.starts_at,
    endsAt: c.ends_at,
    status: ended ? "ended" : c.exhausted_at ? "exhausted" : "live",
  };
}
