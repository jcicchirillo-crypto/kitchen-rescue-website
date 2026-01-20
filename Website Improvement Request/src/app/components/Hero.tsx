import { ArrowRight } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950" />
      
      {/* Red accent glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-red-600/10 rounded-full blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-red-600/10 border border-red-600/20 text-red-500 px-4 py-2 rounded-full text-sm mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
            </span>
            Available 24/7 for Emergency Claims
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Temporary kitchen solutions for{' '}
            <span className="text-red-600">insurance claims</span>
          </h1>

          <p className="text-lg sm:text-xl text-neutral-400 mb-10 max-w-3xl mx-auto leading-relaxed">
            Help policyholders remain in their home during kitchen reinstatement works — reducing disruption, complaints, and reliance on alternative accommodation.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="#contact"
              className="inline-flex items-center gap-2 bg-red-600 text-white px-8 py-4 rounded-lg text-base hover:bg-red-700 transition-all hover:scale-105 shadow-lg shadow-red-600/25"
            >
              Request claim support
              <ArrowRight className="w-5 h-5" />
            </a>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg text-base hover:bg-white hover:text-neutral-900 transition-all"
            >
              Speak to us
            </a>
          </div>

          {/* Trust indicators */}
          <div className="mt-16 pt-8 border-t border-neutral-800 grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <div className="text-3xl font-bold text-white mb-1">24/7</div>
              <div className="text-sm text-neutral-500">Emergency Support</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-1">48hr</div>
              <div className="text-sm text-neutral-500">Delivery Time</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-1">UK</div>
              <div className="text-sm text-neutral-500">Nationwide Coverage</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}