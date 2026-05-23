import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { FloatingNav } from "@/components/layout/floating-nav";
import { Footer } from "@/components/layout/footer";
import { FAQ } from "@/components/sections/faq";
import { PageTransition } from "@/components/motion/page-transition";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>

      <FloatingNav />

      <div className="mx-auto max-w-shell px-4 sm:px-6 md:px-10 pt-24 md:pt-32">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-20">
          <Sidebar />
          <main id="main" className="min-w-0 flex-1 lg:max-w-content">
            <PageTransition>{children}</PageTransition>
            <FAQ />
          </main>
        </div>
        <Footer />
      </div>
    </>
  );
}
