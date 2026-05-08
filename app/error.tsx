"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="py-24 text-center">
      <h1 className="font-outfit font-bold text-5xl md:text-6xl text-text-primary">
        Something <span className="text-accent">went wrong</span>
      </h1>
      <p className="mt-4 font-poppins text-text-secondary">
        An unexpected error occurred. Please try again.
      </p>
      <div className="mt-8 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-xl bg-accent px-6 py-3 font-poppins text-sm font-medium text-white hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Try again
        </button>
        <Link
          href="/"
          className="font-poppins text-sm text-text-primary hover:text-accent"
        >
          Back to Home
        </Link>
      </div>
    </section>
  );
}
