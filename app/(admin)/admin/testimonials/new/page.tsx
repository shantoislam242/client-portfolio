import { createTestimonial } from "@/actions/testimonials";
import { TestimonialForm } from "../testimonial-form";

export const metadata = { title: "New testimonial" };

export default function NewTestimonialPage() {
  return <TestimonialForm action={createTestimonial} submitLabel="Create testimonial" />;
}
