import type { Metadata } from "next";
import { Outfit, Poppins, Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PageShell } from "@/components/layout/page-shell";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["100", "400", "700"],
  variable: "--ff-outfit",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--ff-poppins",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--ff-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Arifujjaman — Graphic & Motion Designer",
  description:
    "Crafting visual stories that move people. Brand identity, motion graphics, and video editing by Arifujjaman, a graphic and motion designer based in Dhaka, Bangladesh.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${outfit.variable} ${poppins.variable} ${inter.variable}`}
    >
      <body className="font-poppins bg-bg-primary text-text-primary antialiased">
        <TooltipProvider delayDuration={150}>
          <PageShell>{children}</PageShell>
          <Toaster theme="dark" position="bottom-center" />
        </TooltipProvider>
      </body>
    </html>
  );
}
