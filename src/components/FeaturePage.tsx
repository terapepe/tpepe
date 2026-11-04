import Link from "next/link";
import type { ReactNode } from "react";
import { SOCIAL } from "@/lib/config";
import Icon from "@/components/Icon";
import Scene from "@/components/Scene";
import type { SceneKey } from "@/lib/config";

export type Feature = {
  title: string;
  lede: string;
  status: string;
  forWho: { who: string; text: string }[];
  steps: { title: string; text: string }[];
  stepsTitle: string;
  note?: ReactNode;
  scene?: SceneKey;
};

export default function FeaturePage({ f }: { f: Feature }) {
  return (
    <>
      <section className={`page-head ${f.scene ? "with-scene" : ""}`}>
        <div>
          <span className="status">{f.status}</span>
          <h1>{f.title}</h1>
          <p className="lede">{f.lede}</p>
        </div>
        {f.scene && <Scene name={f.scene} />}
      </section>

      <section className="block two">
        <h2>{f.stepsTitle}</h2>
        <ol className="steps">
          {f.steps.map((s) => (
            <li key={s.title}>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="block">
        <div className="who">
          {f.forWho.map((w) => (
            <div key={w.who} className="who-item">
              <h3>{w.who}</h3>
              <p>{w.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="block callout">
        <div>
          <h2>This part is still being built</h2>
          <p>{f.note ?? "The tools for this page are not live yet. Follow @" + SOCIAL.x.handle + " to hear when they open."}</p>
        </div>
        <div className="callout-actions">
          <a className="btn primary" href={SOCIAL.x.url} target="_blank" rel="noopener noreferrer">
            Follow on X
          </a>
          <Link className="btn ghost" href="/roadmap">
            See the roadmap <Icon name="arrow" size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}
