export default function RippleHero() {
  return (
    <div className="ripple" role="img" aria-label="TeraPepe holding the TPEPE coin">
      <svg viewBox="0 0 520 520" className="ripple-svg">
        {[0, 1, 2, 3].map((i) => (
          <circle key={i} className="ring wave" cx="260" cy="260" r="130" style={{ animationDelay: `${i * 1.6}s` }} />
        ))}
        <circle className="ring" cx="260" cy="260" r="160" opacity=".5" />
        <circle className="ring" cx="260" cy="260" r="205" opacity=".35" />
        <circle className="ring" cx="260" cy="260" r="248" opacity=".2" />
        {/* sharers sitting on the rings */}
        {[
          [160, -60], [205, 20], [248, 110], [160, 150], [205, 200], [248, 260], [205, 300],
        ].map(([r, a], i) => (
          <circle key={i} className="node" cx={260 + r * Math.cos((a * Math.PI) / 180)} cy={260 + r * Math.sin((a * Math.PI) / 180)} r={i % 3 === 0 ? 9 : 6} />
        ))}
        <defs>
          <clipPath id="hero-avatar"><circle cx="260" cy="260" r="135" /></clipPath>
        </defs>
        <image href="/avatar-hero.webp" x="125" y="125" width="270" height="270" clipPath="url(#hero-avatar)" />
        <circle className="avatar-ring" cx="260" cy="260" r="135" fill="none" strokeWidth="4" />
      </svg>
      <span className="tag t1">Link shared</span>
      <span className="tag t2">Reward sent</span>
      <span className="tag t3">Campaign funded</span>
    </div>
  );
}
