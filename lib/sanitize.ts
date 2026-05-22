import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "p", "br", "strong", "em", "s", "code", "pre",
  "h2", "h3", "h4",
  "ul", "ol", "li",
  "blockquote", "hr",
  "a", "img",
];

const ALLOWED_ATTR = ["href", "target", "rel", "src", "alt", "class"];

export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ADD_ATTR: ["target"],
  });
}
