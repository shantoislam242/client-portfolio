import { notFound } from "next/navigation";
import { getFaq } from "@/lib/db/faqs";
import { updateFaq } from "@/actions/faqs";
import { FaqForm } from "../faq-form";

export const metadata = { title: "Edit FAQ" };

export default async function EditFaqPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const faq = await getFaq(id);
  if (!faq) notFound();

  const boundAction = updateFaq.bind(null, faq.id);
  return (
    <FaqForm
      initial={{
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        order: faq.order,
        visible: faq.visible,
      }}
      action={boundAction}
      submitLabel="Save changes"
    />
  );
}
