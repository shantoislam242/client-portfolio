"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { profile } from "@/lib/data";
import { cn } from "@/lib/utils";

export function MobileProfile() {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden mb-6 rounded-2xl border border-border-subtle bg-bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-3"
      >
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-bg-card-hover">
          <Image
            src={profile.portrait}
            alt={profile.name}
            fill
            sizes="40px"
            className="object-cover"
          />
        </div>
        <div className="flex-1 text-left">
          <div className="font-outfit font-bold text-base text-text-primary">
            {profile.name}
          </div>
          <div className="font-poppins text-xs text-text-secondary">
            {profile.role} · {profile.location}
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-text-secondary transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-center gap-4 px-4 pb-4">
              {profile.socials.map(({ label, href, icon: Icon }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="rounded-md p-1 text-text-secondary transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <Icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
