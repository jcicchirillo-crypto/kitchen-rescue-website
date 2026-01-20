import { Shield, TrendingDown, Heart, Award, Zap, Users } from 'lucide-react';

export function BenefitsSection() {
  const benefits = [
    {
      icon: Heart,
      title: 'Improved customer satisfaction',
      description: 'Policyholders can stay at home with essential facilities, reducing stress and complaints.',
    },
    {
      icon: TrendingDown,
      title: 'Lower claim costs',
      description: 'Eliminate expensive alternative accommodation costs and reduce overall claim duration.',
    },
    {
      icon: Shield,
      title: 'Risk mitigation',
      description: 'Reduce complaints, improve outcomes for vulnerable customers, and meet regulatory expectations.',
    },
    {
      icon: Zap,
      title: 'Fast deployment',
      description: 'Units delivered and installed within 48 hours of claim notification.',
    },
    {
      icon: Award,
      title: 'Fully compliant',
      description: 'All units meet health and safety standards with regular maintenance and inspection.',
    },
    {
      icon: Users,
      title: 'Dedicated support',
      description: '24/7 customer service for policyholders and insurance teams throughout rental period.',
    },
  ];

  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-950">
      <div className="mx-auto max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-block bg-red-600/10 border border-red-600/20 text-red-500 px-4 py-2 rounded-full text-sm mb-6">
            Benefits
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Why insurance providers choose Kitchen Rescue
          </h2>
          <p className="text-lg text-neutral-400">
            Reduce costs, improve satisfaction, and support customers when they need it most
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="group">
              <div className="bg-neutral-900 rounded-xl p-8 h-full border border-neutral-800 hover:border-red-600/50 transition-all hover:shadow-lg hover:shadow-red-600/5">
                <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-lg w-14 h-14 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <benefit.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{benefit.title}</h3>
                <p className="text-neutral-400 leading-relaxed">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
