"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "splash-shown";
const DURATION_MS = 1500;

export function SplashClient({ fullName }: { fullName: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    setVisible(true);
    document.body.style.overflow = "hidden";

    const t = setTimeout(() => {
      sessionStorage.setItem(STORAGE_KEY, "1");
      setVisible(false);
      document.body.style.overflow = "";
    }, DURATION_MS);

    return () => {
      clearTimeout(t);
      document.body.style.overflow = "";
    };
  }, []);

  const words = fullName.trim().split(/\s+/);
  const firstWord = words[0] ?? "Hello";
  const restWords = words.slice(1).join(" ");

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-bg-primary"
          aria-hidden="true"
        >
          <div className="flex flex-col items-center gap-5">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="font-outfit font-bold text-4xl sm:text-5xl md:text-6xl text-text-primary leading-none"
            >
              {firstWord}
              {restWords && (
                <span className="text-accent-purple"> {restWords}</span>
              )}
            </motion.div>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "120px" }}
              transition={{ duration: 0.9, ease: "easeInOut", delay: 0.2 }}
              className="h-[2px] bg-accent rounded-full"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
