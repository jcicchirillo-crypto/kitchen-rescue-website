import { Star, Quote } from 'lucide-react';

export function TestimonialSection() {
  const testimonials = [
    {
      quote: "Kitchen Rescue transformed our claims process. Customer satisfaction scores increased by 45% and we've seen a significant reduction in alternative accommodation costs.",
      author: 'Sarah Mitchell',
      role: 'Claims Director',
      company: 'Major UK Insurer',
      rating: 5,
    },
    {
      quote: "The speed and professionalism is outstanding. Units are delivered within 48 hours and our policyholders can continue living normally during kitchen repairs.",
      author: 'James Thompson',
      role: 'Head of Property Claims',
      company: 'National Insurance Provider',
      rating: 5,
    },
    {
      quote: "We've reduced complaints by over 60% since partnering with Kitchen Rescue. The service is reliable, cost-effective, and genuinely improves customer outcomes.",
      author: 'Emma Richardson',
      role: 'Customer Experience Manager',
      company: 'Regional Insurer',
      rating: 5,
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-950">
      <div className="mx-auto max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-block bg-red-600/10 border border-red-600/20 text-red-500 px-4 py-2 rounded-full text-sm mb-6">
            Testimonials
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Trusted by leading insurers
          </h2>
          <p className="text-lg text-neutral-400">
            See what insurance professionals say about our service
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-neutral-900 rounded-xl p-8 border border-neutral-800 hover:border-red-600/30 transition-all group relative">
              <Quote className="absolute top-6 right-6 w-12 h-12 text-red-600/10 group-hover:text-red-600/20 transition-colors" />
              
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-red-600 text-red-600" />
                ))}
              </div>

              <blockquote className="text-neutral-300 mb-6 leading-relaxed relative z-10">
                "{testimonial.quote}"
              </blockquote>

              <div className="border-t border-neutral-800 pt-4">
                <div className="font-semibold text-white">{testimonial.author}</div>
                <div className="text-sm text-neutral-400">{testimonial.role}</div>
                <div className="text-sm text-red-500">{testimonial.company}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
