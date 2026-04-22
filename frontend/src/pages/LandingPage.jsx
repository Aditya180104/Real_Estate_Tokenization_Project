import { Link } from "react-router-dom";
import { Building2, Shield, TrendingUp, Zap, Globe, Lock, ArrowRight, CheckCircle } from "lucide-react";

const features = [
  { icon: Building2, title: "Fractional Ownership", desc: "Own a piece of premium real estate starting from just $100 per share." },
  { icon: Shield, title: "Blockchain Security", desc: "All transactions secured by Ethereum smart contracts with full transparency." },
  { icon: TrendingUp, title: "Passive Income", desc: "Earn proportional rental revenue distributed automatically to your wallet." },
  { icon: Globe, title: "Global Properties", desc: "Access premium real estate markets worldwide from a single platform." },
  { icon: Lock, title: "KYC Verified", desc: "All investors and properties are verified for a safe investment environment." },
  { icon: Zap, title: "Instant Liquidity", desc: "Buy and sell shares instantly without the friction of traditional real estate." },
];

const stats = [
  { value: "$50M+", label: "Total Property Value" },
  { value: "1,200+", label: "Active Investors" },
  { value: "48", label: "Tokenized Properties" },
  { value: "8.5%", label: "Avg. Annual Return" },
];

export default function LandingPage() {
  return (
    <div className="bg-slate-950">
      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-32 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 rounded-full px-4 py-1.5 text-sm text-primary-400 mb-8">
            <Zap className="w-3.5 h-3.5" />
            Powered by Ethereum Blockchain
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-100 leading-tight mb-6">
            Invest in Real Estate{" "}
            <span className="gradient-text">Fractionally</span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Own shares of premium properties worldwide. Earn rental income, trade freely, and build wealth through blockchain-powered fractional real estate.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="btn-primary text-base px-8 py-3.5 flex items-center gap-2">
              Start Investing
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/properties" className="btn-secondary text-base px-8 py-3.5">
              Browse Properties
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-slate-500">
            {["No minimum lock-up", "KYC verified", "Smart contract secured", "SEC compliant"].map((item) => (
              <div key={item} className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-slate-800">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-3xl sm:text-4xl font-extrabold gradient-text mb-1">{value}</p>
                <p className="text-slate-500 text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-100 mb-4">
              Why choose <span className="gradient-text">PropToken</span>?
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              We combine the stability of real estate with the efficiency of blockchain technology.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card-hover p-6 group">
                <div className="w-12 h-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mb-4 group-hover:bg-primary-500/20 transition-colors">
                  <Icon className="w-6 h-6 text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4 bg-slate-900/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-100 mb-4">How it works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Create Account & KYC", desc: "Register and complete identity verification to unlock full platform access." },
              { step: "02", title: "Connect MetaMask", desc: "Link your Ethereum wallet to enable on-chain transactions and ownership tracking." },
              { step: "03", title: "Buy & Earn", desc: "Browse verified properties, purchase fractional shares, and earn passive rental income." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-600 to-gold-500 flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
                  {step}
                </div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">{title}</h3>
                <p className="text-slate-400 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-slate-100 mb-4">
            Ready to build your real estate portfolio?
          </h2>
          <p className="text-slate-400 mb-8">
            Join thousands of investors already earning passive income through fractional property ownership.
          </p>
          <Link to="/register" className="btn-gold text-base px-10 py-4 inline-flex items-center gap-2">
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
