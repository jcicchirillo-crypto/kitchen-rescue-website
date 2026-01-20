import { Check } from 'lucide-react';

export function SpecSection() {
  const specifications = {
    'Unit Details': [
      'Dimensions: 3m x 2m weatherproof unit',
      'Self-contained and fully insulated',
      'Complies with all UK building regulations',
      'Not currently wheelchair accessible - contact us for solutions',
    ],
    'Appliances Included': [
      'Full-size refrigerator/freezer',
      'Electric induction hob',
      'Built-in oven and grill',
      'Stainless steel sink with hot/cold water',
      'Washing machine',
      'Dishwasher',
    ],
    'Facilities': [
      'Work surfaces and storage cabinets',
      'LED lighting throughout',
      'Electrical power supply connection',
      'Waste water drainage system',
      'Fire safety equipment installed',
      'Ventilation and extraction',
    ],
    'Service': [
      '48-hour delivery and installation',
      '24/7 emergency support hotline',
      'Regular maintenance checks',
      'Flexible rental periods',
      'Professional cleaning on collection',
      'Full insurance coverage',
    ],
  };

  return (
    <section id="spec" className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-900">
      <div className="mx-auto max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Technical specifications
          </h2>
          <p className="text-lg text-neutral-400">
            Every unit is fully equipped with professional-grade appliances and facilities
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {Object.entries(specifications).map(([category, items]) => (
            <div key={category} className="bg-neutral-800 rounded-xl p-8 border border-neutral-700">
              <h3 className="text-xl font-semibold text-white mb-6 pb-4 border-b border-neutral-700">
                {category}
              </h3>
              <ul className="space-y-3">
                {items.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="bg-red-600 rounded-full p-0.5 mt-1 flex-shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-neutral-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-gradient-to-r from-red-600/10 to-transparent border border-red-600/20 rounded-xl p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Need custom specifications?</h3>
              <p className="text-neutral-400">We can tailor units to meet specific requirements for your policyholders.</p>
            </div>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
            >
              Contact us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}