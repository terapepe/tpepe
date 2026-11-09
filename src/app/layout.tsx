import type { Metadata, Viewport } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import Providers from "@/lib/Providers";
import Shell from "@/components/Shell";
import { IS_SINGLE, PRIMARY } from "@/lib/chains";

export const metadata: Metadata = {
  metadataBase: new URL("https://terapepe.xyz"),
  title: { default: "TeraPepe ($TPEPE) — make every new memecoin ripple", template: "%s | TeraPepe" },
  description:
    "TeraPepe is the share-to-earn platform for new memecoins. Projects open campaigns with TPEPE, the community earns TPEPE for sharing.",
  openGraph: { title: "TeraPepe ($TPEPE)", description: "Share new memecoins. Earn TPEPE.", url: "https://terapepe.xyz", type: "website", images: [{ url: "/og-avatar.png", width: 512, height: 512 }] },
  twitter: { card: "summary", site: "@TeraPepe_", images: ["/og-avatar.png"] },
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any" }, { url: "/icon-192.png", type: "image/png", sizes: "192x192" }],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = { themeColor: "#04060d" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* single mode: accent follows the network color */}
      <body style={IS_SINGLE ? ({ ["--chain" as string]: PRIMARY.color } as React.CSSProperties) : undefined}>
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
