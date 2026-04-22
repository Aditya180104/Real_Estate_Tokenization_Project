import { Building2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-gold-500 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">PropToken</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              The future of real estate investment. Own fractional shares of premium properties worldwide through blockchain technology.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-4">Platform</h4>
            <ul className="space-y-2">
              {["Properties", "How It Works", "About Us"].map((item) => (
                <li key={item}>
                  <Link to="/properties" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-4">Legal</h4>
            <ul className="space-y-2">
              {["Privacy Policy", "Terms of Service", "Risk Disclosure"].map((item) => (
                <li key={item}>
                  <span className="text-slate-500 text-sm cursor-pointer hover:text-slate-300 transition-colors">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-slate-800 text-center text-slate-600 text-sm">
          © {new Date().getFullYear()} PropToken. All rights reserved. Built on Ethereum.
        </div>
      </div>
    </footer>
  );
}
