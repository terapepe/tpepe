import type { Metadata, Viewport } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import Providers from "@/lib/Providers";
import Shell from "@/components/Shell";

export const metadata: Metadata = {
  metadataBase: new URL("https://terapepe.xyz"),
  title: { default: "TeraPepe ($TPEPE) — make every new memecoin ripple", template: "%s | TeraPepe" },
  description:
    "TeraPepe is the share-to-earn platform for new memecoins. Projects hold TPEPE to run campaigns, the community earns TPEPE for sharing.",
  openGraph: { title: "TeraPepe ($TPEPE)", description: "Share new memecoins. Earn TPEPE.", url: "https://terapepe.xyz", type: "website" },
  twitter: { card: "summary_large_image", site: "@TeraPepeXyz" },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#12261B" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
