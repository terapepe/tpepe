import CopyChip from "./CopyChip";
import { CA_GROUPS, explorerOf } from "@/lib/chains";
import { TOKEN } from "@/lib/config";

/** One Copy-CA chip per CA group (networks sharing a CA are merged). */
export default function CAChips({ prefix = `$${TOKEN.ticker} ` }: { prefix?: string }) {
  return (
    <>
      {CA_GROUPS.map((g) => (
        <CopyChip key={g.id} value={g.ca} label={`${prefix}${g.tag}`} color={g.nets.length === 1 ? g.nets[0].color : undefined} href={explorerOf(g.nets[0])} />
      ))}
    </>
  );
}
