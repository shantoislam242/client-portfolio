import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getSiteSettings } from "@/lib/db/site-settings";
import { listFaqs } from "@/lib/db/faqs";
import { FadeIn } from "@/components/motion/fade-in";

type Props = {
  mode?: "home" | "page";
};

export async function FAQ({ mode = "home" }: Props) {
  const [s, allFaqs] = await Promise.all([getSiteSettings(), listFaqs()]);

  const faqs = allFaqs.filter((f) => f.visible);

  const headingWords = s.faqHeading.split(" ");
  const headingAccent = headingWords[headingWords.length - 1];
  const headingPrefix = headingWords.slice(0, -1).join(" ");

  return (
    <section className="py-16 md:py-24">
      <FadeIn>
        <h2 className="font-outfit font-bold text-4xl md:text-5xl text-text-primary leading-tight">
          {headingPrefix}
          <br />
          <span className="text-accent-purple">{headingAccent}</span>
        </h2>
      </FadeIn>

      <FadeIn delay={0.1} className="mt-10">
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((item, i) => (
            <AccordionItem
              key={item.question}
              value={`item-${i}`}
              className="border border-border-subtle bg-bg-card rounded-xl px-5 data-[state=open]:bg-bg-card-hover"
            >
              <AccordionTrigger className="font-poppins text-base text-text-primary hover:no-underline py-4">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="font-poppins text-sm text-text-secondary pb-4">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </FadeIn>
    </section>
  );
}
