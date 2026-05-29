import type { Metadata } from "next";
import "../src/index.css";
import { Providers } from "./providers";
import ScrollToTop from "@/components/ScrollToTop";

export const metadata: Metadata = {
  title: "Team Titans",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <Providers>
          <ScrollToTop />
          {children}
        </Providers>
      </body>
    </html>
  );
}
