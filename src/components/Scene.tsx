import { SCENES, type SceneKey } from "@/lib/config";

export default function Scene({ name, round = false }: { name: SceneKey; round?: boolean }) {
  const s = SCENES[name];
  return (
    <figure className={`scene ${round ? "round" : ""}`}>
      <img src={s.src} alt={s.alt} style={{ objectPosition: s.focus }} loading="eager" />
      {!round && <figcaption>{s.caption}</figcaption>}
    </figure>
  );
}
