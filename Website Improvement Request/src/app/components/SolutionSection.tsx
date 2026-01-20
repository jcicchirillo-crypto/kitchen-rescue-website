import { Check } from 'lucide-react';

export function SolutionSection() {
  const features = [
    'Fully equipped temporary kitchen unit',
    'Professional delivery and installation',
    'Fridge, oven, electric induction hob, sink',
    'Washing machine and dishwasher included',
    'Compliant with health and safety standards',
    'Insurance claim approved solution',
    'Flexible rental periods',
    'Keep your pets at home with you',
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-950">
      <div className="mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block bg-red-600/10 border border-red-600/20 text-red-500 px-4 py-2 rounded-full text-sm mb-6">
              Our Solution
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              What Kitchen Rescue provides
            </h2>
            <p className="text-lg text-neutral-400 mb-8 leading-relaxed">
              We deliver fully-equipped temporary kitchens directly to the policyholder's property within 48 hours. Our solution allows families to maintain their daily routines and stay in their homes during reinstatement works.
            </p>

            <div className="space-y-4 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="bg-red-600 rounded-full p-1 mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-neutral-300">{feature}</span>
                </div>
              ))}
            </div>

            <a
              href="#features"
              className="inline-flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors"
            >
              Learn more about our kitchens
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-red-600/20 to-transparent rounded-2xl blur-2xl" />
            <img
              src="https://images.unsplash.com/photo-1610177534644-34d881503b83?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBraXRjaGVuJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzY4NzM3ODM1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Modern temporary kitchen"
              className="relative rounded-2xl shadow-2xl w-full h-[500px] object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}