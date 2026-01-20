import { useState } from 'react';
import { Menu, X, Phone } from 'lucide-react';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Availability', href: '#availability' },
    { name: 'Features', href: '#features' },
    { name: 'Spec', href: '#spec' },
    { name: 'Gallery', href: '#gallery' },
    { name: 'Blog', href: '#blog' },
    { name: 'FAQs', href: '#faqs' },
    { name: 'Insurance Claims', href: '#insurance', highlighted: true },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-neutral-950/95 backdrop-blur-sm border-b border-neutral-800">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex items-center gap-2">
              <div className="relative">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 4L8 8V12C8 17.5 11.5 22.5 16 24C20.5 22.5 24 17.5 24 12V8L16 4Z" fill="#DC2626" />
                  <path d="M13 14L15 16L19 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <div className="text-white font-semibold tracking-tight">KITCHEN</div>
                <div className="text-red-600 font-semibold tracking-tight -mt-1">RESCUE</div>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={`px-3 py-2 text-sm transition-colors ${
                  item.highlighted
                    ? 'text-red-600 hover:text-red-500'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                {item.name}
              </a>
            ))}
            <a
              href="#contact"
              className="ml-4 inline-flex items-center gap-2 bg-white text-neutral-900 px-4 py-2 rounded-lg text-sm hover:bg-neutral-100 transition-colors"
            >
              <Phone className="w-4 h-4" />
              Contact
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Open main menu</span>
            {mobileMenuOpen ? (
              <X className="block h-6 w-6" />
            ) : (
              <Menu className="block h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-800">
            <div className="space-y-1 px-2 pb-3 pt-2">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={`block px-3 py-2 rounded-lg text-base transition-colors ${
                    item.highlighted
                      ? 'text-red-600 hover:text-red-500 hover:bg-neutral-900'
                      : 'text-neutral-300 hover:text-white hover:bg-neutral-900'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
              <a
                href="#contact"
                className="flex items-center gap-2 bg-white text-neutral-900 px-3 py-2 rounded-lg text-base hover:bg-neutral-100 transition-colors mt-4"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Phone className="w-4 h-4" />
                Contact
              </a>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
