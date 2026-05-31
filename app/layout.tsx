import type { Metadata } from "next";
import { Outfit, Poppins, Inter } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
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
        <NextTopLoader
          color="#8b5cf6"
          height={2}
          showSpinner={false}
          shadow="0 0 8px #8b5cf6"
        />
        <TooltipProvider delayDuration={150}>
          {children}
          <Toaster theme="dark" position="bottom-center" />
        </TooltipProvider>
      </body>
    </html>
  );
}
