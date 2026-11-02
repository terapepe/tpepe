export default function RippleHero() {
  return (
    <div className="ripple" aria-hidden="true">
      <svg viewBox="0 0 520 520" className="ripple-svg">
        {[0, 1, 2, 3].map((i) => (
          <circle key={i} className="ring wave" cx="260" cy="260" r="70" style={{ animationDelay: `${i * 1.6}s` }} />
        ))}
        <circle className="ring" cx="260" cy="260" r="120" opacity=".5" />
        <circle className="ring" cx="260" cy="260" r="180" opacity=".35" />
        <circle className="ring" cx="260" cy="260" r="240" opacity=".2" />
        {/* sharers sitting on the rings */}
        {[
          [260, 140],
          [378, 300],
          [150, 330],
          [95, 175],
          [430, 150],
          [320, 460],
          [200, 50],
        ].map(([x, y], i) => (
          <circle key={i} className="node" cx={x} cy={y} r={i % 3 === 0 ? 9 : 6} />
        ))}
        <circle cx="260" cy="260" r="62" fill="#4C9A2A" />
        <circle cx="260" cy="260" r="62" fill="none" stroke="#12261B" strokeWidth="3" />
        <path d="M232 238h56M260 238V292" stroke="#F7FAF2" strokeWidth="14" strokeLinecap="round" />
      </svg>
      <span className="tag t1">Link shared</span>
      <span className="tag t2">Reward sent</span>
      <span className="tag t3">Campaign funded</span>
    </div>
  );
}
