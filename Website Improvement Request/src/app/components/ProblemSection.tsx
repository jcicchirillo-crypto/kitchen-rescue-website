import { AlertTriangle, Home, Clock, TrendingUp } from 'lucide-react';

export function ProblemSection() {
  const problems = [
    {
      icon: Home,
      title: 'No basic facilities',
      description: 'Policyholders face weeks without essential kitchen facilities and laundry services',
    },
    {
      icon: AlertTriangle,
      title: 'Increased complaints',
      description: 'Leading to higher complaint rates and customer dissatisfaction',
    },
    {
      icon: Clock,
      title: 'Alternative accommodation issues',
      description: 'Pets often not allowed in temporary accommodation, forcing difficult choices for families',
    },
    {
      icon: TrendingUp,
      title: 'Higher costs',
      description: 'Extended claims and poorer outcomes for families and vulnerable households',
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-900">
      <div className="mx-auto max-w-7xl">
        <div className="bg-white rounded-2xl p-8 sm:p-12">
          <div className="max-w-3xl mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              When a kitchen is removed, daily life stops
            </h2>
            <p className="text-lg text-neutral-600 leading-relaxed">
              During insured kitchen reinstatement works, policyholders can face weeks without basic facilities — leading to increased complaints and distress, pressure to provide alternative accommodation, extended claim duration, and poorer outcomes for families and vulnerable households.{' '}
              <span className="font-semibold text-neutral-900">A temporary kitchen removes this pressure point.</span>
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {problems.map((problem, index) => (
              <div key={index} className="group">
                <div className="bg-red-50 rounded-xl p-6 h-full border border-red-100 hover:border-red-200 hover:shadow-md transition-all">
                  <div className="bg-red-600 rounded-lg w-12 h-12 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <problem.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-neutral-900 mb-2">{problem.title}</h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">{problem.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}