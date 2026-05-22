import { notFound } from "next/navigation";
import { getTestimonial } from "@/lib/db/testimonials";
import { updateTestimonial } from "@/actions/testimonials";
import { TestimonialForm } from "../testimonial-form";

export const metadata = { title: "Edit testimonial" };

export default async function EditTestimonialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const testimonial = await getTestimonial(id);
  if (!testimonial) notFound();

  const boundAction = updateTestimonial.bind(null, testimonial.id);
  return (
    <TestimonialForm
      initial={{
        id: testimonial.id,
        name: testimonial.name,
        role: testimonial.role,
        company: testimonial.company,
        content: testimonial.content,
        avatarUrl: testimonial.avatarUrl,
        avatarPublicId: testimonial.avatarPublicId,
        rating: testimonial.rating,
        featured: testimonial.featured,
        order: testimonial.order,
        visible: testimonial.visible,
      }}
      action={boundAction}
      submitLabel="Save changes"
    />
  );
}
