import type { IconName } from "@/lib/config";

const paths: Record<IconName | "x" | "copy" | "check" | "menu" | "close" | "wallet" | "arrow", React.ReactNode> = {
  home: <path d="M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10" />,
  megaphone: <path d="M4 10v4h3l7 4V6L7 10H4Zm13-1.5a4.5 4.5 0 0 1 0 7" />,
  ripple: (
    <>
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="12" r="5.5" />
      <circle cx="12" cy="12" r="9" />
    </>
  ),
  gavel: <path d="m14 4 6 6M11 7l6 6M5 21l8-8m-3-4 5 5M3 21h8" />,
  rocket: <path d="M5 19c0-3 1.5-4 3-4m8-11c3 0 4 1 4 4-1 5-5 9-9 11l-3-3C9 7 13 4 16 4ZM15.5 9h.01M4 20l3-1" />,
  coin: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 8.5h6M12 8.5V16" />
    </>
  ),
  route: <path d="M6 5a2 2 0 1 0 0 .01M18 19a2 2 0 1 0 0 .01M8 5h6a3.5 3.5 0 0 1 0 7h-4a3.5 3.5 0 0 0 0 7h6" />,
  x: <path d="M4 4l16 16M20 4 4 20" />,
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V6a2 2 0 0 1 2-2h8" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  wallet: <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3M4 7.5V17a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1H6.5A2.5 2.5 0 0 1 4 7.5ZM16 13.5h.01" />,
  arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
};

export default function Icon({ name, size = 20 }: { name: keyof typeof paths; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
