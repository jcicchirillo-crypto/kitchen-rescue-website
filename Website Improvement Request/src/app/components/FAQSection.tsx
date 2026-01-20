import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'How quickly can a temporary kitchen be delivered?',
      answer: 'We guarantee delivery and installation within 48 hours of claim notification. For urgent cases, we can often deliver same-day or next-day in many locations across the UK.',
    },
    {
      question: 'What areas do you cover?',
      answer: 'We provide coverage across England and Wales. Our regional distribution centers ensure fast delivery times throughout these areas.',
    },
    {
      question: 'How long can a unit be rented for?',
      answer: 'Rental periods are completely flexible based on the claim duration. Most rentals are between 4-12 weeks, but we can accommodate shorter or longer periods as needed.',
    },
    {
      question: 'What happens if an appliance breaks down?',
      answer: 'We provide 24/7 support with a dedicated helpline. If any appliance fails, we will repair or replace it within 24 hours at no additional cost.',
    },
    {
      question: 'Do you handle installation and connection?',
      answer: 'Yes, our professional installation team handles all delivery, setup, and utility connections (water and electric). We also manage collection and cleaning when the rental ends.',
    },
    {
      question: 'How much does it cost?',
      answer: 'Pricing varies based on rental duration and specific requirements. However, our solution is typically 40-60% less expensive than providing alternative accommodation, while delivering better customer outcomes.',
    },
    {
      question: 'Are units suitable for vulnerable policyholders?',
      answer: 'We work closely with insurance teams to ensure vulnerable customers receive appropriate solutions. While our units are not currently wheelchair accessible, please let us know your requirements and we can find a suitable solution.',
    },
    {
      question: 'How do I get started?',
      answer: 'Simply contact our team via phone or the contact form. We\'ll discuss your requirements, set up an account, and provide training for your claims handlers on our notification process.',
    },
  ];

  return (
    <section id="faqs" className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-900">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Frequently asked questions
          </h2>
          <p className="text-lg text-neutral-400">
            Everything you need to know about our temporary kitchen service
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-neutral-800 rounded-xl border border-neutral-700 overflow-hidden hover:border-neutral-600 transition-colors"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left"
              >
                <span className="font-semibold text-white pr-8">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-red-600 flex-shrink-0 transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-6 pb-5">
                  <p className="text-neutral-400 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-neutral-400 mb-4">Still have questions?</p>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors"
          >
            Get in touch with our team
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}