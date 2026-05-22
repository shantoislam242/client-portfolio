export function cldUrl(
  url: string | null | undefined,
  opts?: { width?: number },
): string {
  if (!url) return "";
  if (!url.includes("res.cloudinary.com")) return url;
  // Skip if already transformed (e.g. URL already has /upload/f_auto,q_auto/...)
  if (/\/upload\/[^/]*[a-z]_[a-z0-9]+/i.test(url)) return url;
  const transform = ["f_auto", "q_auto"];
  if (opts?.width) transform.push(`w_${opts.width}`);
  return url.replace(/\/upload\//, `/upload/${transform.join(",")}/`);
}
