export function ProcessSection() {
  const steps = [
    {
      number: '01',
      title: 'Claim notification',
      description: 'Your team notifies us of a kitchen claim requiring temporary accommodation support.',
    },
    {
      number: '02',
      title: 'Assessment & planning',
      description: 'We assess requirements and create a delivery plan within 4 hours of notification.',
    },
    {
      number: '03',
      title: 'Delivery & installation',
      description: 'Professional delivery and setup within 48 hours, fully equipped and ready to use.',
    },
    {
      number: '04',
      title: 'Ongoing support',
      description: '24/7 support throughout the rental period with maintenance if needed.',
    },
    {
      number: '05',
      title: 'Collection',
      description: 'Once works complete, we collect and clean the unit at a time that suits the policyholder.',
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-900">
      <div className="mx-auto max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            How it works
          </h2>
          <p className="text-lg text-neutral-400">
            Our streamlined process ensures minimal disruption and maximum support for policyholders
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-red-600 to-transparent" />
              )}
              <div className="bg-neutral-800 rounded-xl p-6 h-full border border-neutral-700 hover:border-red-600/50 transition-all group">
                <div className="text-5xl font-bold text-red-600 mb-4 group-hover:scale-110 transition-transform">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}