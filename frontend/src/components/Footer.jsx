import { Sparkles, Instagram, Twitter, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer data-testid="site-footer" className="mt-24 bg-[#0E0E52] text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 grid md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-[#FF8552] flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <span className="font-display text-xl font-semibold">AnySpot</span>
          </div>
          <p className="mt-4 max-w-md text-white/70 leading-relaxed">
            One pass to the best boutique fitness studios near you. Move with
            intention, anywhere.
          </p>
          <div className="mt-6 flex gap-3">
            {[Instagram, Twitter, Mail].map((Icon, i) => (
              <button
                key={i}
                className="w-10 h-10 rounded-full border border-white/15 hover:bg-[#FF8552] hover:border-[#FF8552] transition-colors flex items-center justify-center"
              >
                <Icon size={16} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="anyspot-pill text-[#CBF3D2]">Product</p>
          <ul className="mt-4 space-y-2 text-white/70 text-sm">
            <li>Explore Studios</li>
            <li>Class Library</li>
            <li>Credit Packs</li>
            <li>Gift Cards</li>
          </ul>
        </div>

        <div>
          <p className="anyspot-pill text-[#CBF3D2]">Company</p>
          <ul className="mt-4 space-y-2 text-white/70 text-sm">
            <li>About</li>
            <li>Partner With Us</li>
            <li>Press</li>
            <li>Careers</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-6 flex flex-col md:flex-row justify-between gap-2 text-xs text-white/50">
          <span>© 2026 AnySpot. Move anywhere.</span>
          <span>Crafted with intention.</span>
        </div>
      </div>
    </footer>
  );
}
