
"use client";

import { useLanguage } from '@/context/LanguageContext';
import { PageHeader } from '@/components/PageHeader';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
    { q: "What is your return policy?", a: "We offer a 30-day return policy for most items. The item must be in its original condition and packaging. Please visit our Shipping & Returns page for more details." },
    { q: "How do I track my order?", a: "Once your order is shipped, you will receive an email with a tracking number and a link to the carrier's website." },
    { q: "Do you ship internationally?", a: "Currently, we only ship within India. We are working on expanding our shipping options to more countries in the near future." },
    { q: "What payment methods do you accept?", a: "We accept Cash on Delivery (COD), and will be adding support for all major credit/debit cards and UPI payments soon." },
    { q: "How is my data protected?", a: "We take your privacy seriously. All personal information is encrypted and stored securely. We use industry-standard security protocols to protect your data." },
];

export default function FaqPage() {
  const { t } = useLanguage();

  return (
    <div className="animate-card-enter">
      <PageHeader
        title={t('faqTitle')}
        subtitle={t('faqSubtitle')}
      />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, i) => (
                     <AccordionItem key={i} value={`item-${i}`}>
                        <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
                        <AccordionContent>
                           {faq.a}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
      </main>
    </div>
  );
}
