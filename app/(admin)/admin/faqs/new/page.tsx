import { createFaq } from "@/actions/faqs";
import { FaqForm } from "../faq-form";

export const metadata = { title: "New FAQ" };

export default function NewFaqPage() {
  return <FaqForm action={createFaq} submitLabel="Create FAQ" />;
}
