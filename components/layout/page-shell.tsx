import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { FloatingNav } from "@/components/layout/floating-nav";
import { Footer } from "@/components/layout/footer";
import { FAQ } from "@/components/sections/faq";
import { CollaborateCTA } from "@/components/sections/collaborate-cta";

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

      <div className="mx-auto max-w-shell px-6 md:px-10 pt-28 md:pt-32">
        <div className="flex gap-10 lg:gap-20">
          <Sidebar />
          <main id="main" className="min-w-0 flex-1 max-w-content">
            {children}
            <FAQ />
            <CollaborateCTA />
          </main>
        </div>
        <Footer />
      </div>
    </>
  );
}
