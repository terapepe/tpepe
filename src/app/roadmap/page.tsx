import type { Metadata } from "next";

export const metadata: Metadata = { title: "Roadmap" };

const stages = [
  {
    when: "Now",
    title: "Foundation",
    items: ["Website and brand at terapepe.xyz", "Wallet sign-in for EVM and Solana", "TPEPE token being built"],
  },
  {
    when: "Next",
    title: "Campaigns and share quests",
    items: ["Projects hold TPEPE to open campaigns", "Users complete share quests", "TPEPE rewards paid to sharers"],
  },
  {
    when: "Then",
    title: "Weekly spotlight auction",
    items: ["Bid in TPEPE for the featured slot", "Winner promoted on official channels", "100 free community shares for the winner"],
  },
  {
    when: "Later",
    title: "Launchpad",
    items: ["Launch tokens on terapepe.xyz", "Optional community share quests at launch", "Rewards from the first minute"],
  },
];

export default function Page() {
  return (
    <>
      <section className="page-head">
        <span className="status">Subject to change</span>
        <h1>Roadmap</h1>
        <p className="lede">We ship in stages, starting with the pieces everything else depends on. Dates are not promised; order is.</p>
      </section>

      <section className="block">
        <ol className="timeline">
          {stages.map((s) => (
            <li key={s.title}>
              <span className="when">{s.when}</span>
              <h3>{s.title}</h3>
              <ul>
                {s.items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
