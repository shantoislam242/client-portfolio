import Link from "next/link";

export default function NotFound() {
  return (
    <section className="py-24 text-center">
      <h1 className="font-outfit font-bold text-4xl sm:text-5xl md:text-6xl text-text-primary">
        Page <span className="text-accent-purple">Not Found</span>
      </h1>
      <p className="mt-4 font-poppins text-text-secondary">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-full bg-accent px-8 py-3 font-poppins text-sm font-medium text-white hover:bg-accent-hover"
      >
        Back to Home
      </Link>
    </section>
  );
}
