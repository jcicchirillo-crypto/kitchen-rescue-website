import { Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-neutral-950 border-t border-neutral-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-4">
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
            <p className="text-sm text-neutral-400 mb-4">
              Temporary kitchen solutions for insurance claims across the UK.
            </p>
            <div className="flex gap-3">
              <a href="#" className="bg-neutral-800 p-2 rounded-lg hover:bg-neutral-700 transition-colors">
                <Facebook className="w-5 h-5 text-neutral-400" />
              </a>
              <a href="#" className="bg-neutral-800 p-2 rounded-lg hover:bg-neutral-700 transition-colors">
                <Twitter className="w-5 h-5 text-neutral-400" />
              </a>
              <a href="#" className="bg-neutral-800 p-2 rounded-lg hover:bg-neutral-700 transition-colors">
                <Linkedin className="w-5 h-5 text-neutral-400" />
              </a>
              <a href="#" className="bg-neutral-800 p-2 rounded-lg hover:bg-neutral-700 transition-colors">
                <Instagram className="w-5 h-5 text-neutral-400" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-white font-semibold mb-4">Services</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-neutral-400 hover:text-white transition-colors text-sm">Temporary Kitchens</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white transition-colors text-sm">Insurance Claims</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white transition-colors text-sm">Emergency Deployment</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white transition-colors text-sm">Maintenance Support</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-neutral-400 hover:text-white transition-colors text-sm">About Us</a></li>
              <li><a href="#blog" className="text-neutral-400 hover:text-white transition-colors text-sm">Blog</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white transition-colors text-sm">Careers</a></li>
              <li><a href="#contact" className="text-neutral-400 hover:text-white transition-colors text-sm">Contact</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-neutral-400 hover:text-white transition-colors text-sm">Privacy Policy</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white transition-colors text-sm">Terms of Service</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white transition-colors text-sm">Cookie Policy</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white transition-colors text-sm">GDPR Compliance</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-800 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-neutral-400">
              © {currentYear} Kitchen Rescue Ltd. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#availability" className="text-sm text-neutral-400 hover:text-white transition-colors">Availability</a>
              <a href="#features" className="text-sm text-neutral-400 hover:text-white transition-colors">Features</a>
              <a href="#spec" className="text-sm text-neutral-400 hover:text-white transition-colors">Specifications</a>
              <a href="#faqs" className="text-sm text-neutral-400 hover:text-white transition-colors">FAQs</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
