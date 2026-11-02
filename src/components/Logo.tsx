export default function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="22.5" fill="none" stroke="#BFD8A7" strokeWidth="1.5" opacity=".55" />
      <circle cx="24" cy="24" r="17" fill="#4C9A2A" />
      <circle cx="24" cy="24" r="17" fill="none" stroke="#12261B" strokeWidth="1.5" opacity=".25" />
      <path d="M15.5 17.5h17M24 17.5V32" stroke="#F7FAF2" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
