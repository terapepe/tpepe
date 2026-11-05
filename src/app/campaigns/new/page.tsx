import type { Metadata } from "next";
import CreateCampaignForm from "./CreateCampaignForm";

export const metadata: Metadata = { title: "Create a campaign" };

export default function Page() {
  return (
    <>
      <section className="page-head">
        <span className="status">Robinhood Chain</span>
        <h1>Create a campaign</h1>
        <p className="lede">
          Deposit TPEPE and set what each referral visit and each buy-link click pays. Sharers get their own link, and
          the TPEPE nobody earned comes back to you when the campaign ends.
        </p>
      </section>
      <section className="block">
        <CreateCampaignForm />
      </section>
    </>
  );
}
