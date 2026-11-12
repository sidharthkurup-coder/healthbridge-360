import React from 'react';
import Link from 'next/link';
import { Phone, Shield, MapPin, Heart, ExternalLink } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-navy-950 text-slate-300 border-t border-navy-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Col 1: Platform identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-500 text-white flex items-center justify-center font-bold text-base">
                HB
              </div>
              <span className="font-extrabold text-white text-lg tracking-tight">HEALTHBRIDGE 360</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Integrated Community Healthcare and Essential Public Services platform engineered for Kantheru Gram Panchayat, Guntur District, Andhra Pradesh.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-900 border border-navy-800 text-xs text-teal-300">
              <Shield className="w-3.5 h-3.5" />
              <span>Socialthon 2026 • Round 3</span>
            </div>
          </div>

          {/* Col 2: Six Modules */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Service Modules</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/healthcare" className="hover:text-teal-300 transition-colors">
                  1. Healthcare Access & OPD
                </Link>
              </li>
              <li>
                <Link href="/medicines" className="hover:text-teal-300 transition-colors">
                  2. Medicine Inventory & FEFO
                </Link>
              </li>
              <li>
                <Link href="/emergency" className="hover:text-teal-300 transition-colors">
                  3. Emergency Assistance & 108
                </Link>
              </li>
              <li>
                <Link href="/water" className="hover:text-teal-300 transition-colors">
                  4. Water Distribution (5 Sections)
                </Link>
              </li>
              <li>
                <Link href="/sanitation" className="hover:text-teal-300 transition-colors">
                  5. Sanitation & Priority Engine
                </Link>
              </li>
              <li>
                <Link href="/intelligence" className="hover:text-teal-300 transition-colors">
                  6. Community Intelligence
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Emergency & Location */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Official Directory</h4>
            <div className="space-y-2.5 text-xs text-slate-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span>Gram Panchayat Office, Kantheru, Tadikonda Mandal, Guntur Dist, AP - 522501</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>PHC Reception: +91 863 2234101</span>
              </div>
              <div className="flex items-center gap-2 text-rose-400 font-semibold">
                <Phone className="w-4 h-4 shrink-0" />
                <span>Central Ambulance: 108 (Toll Free)</span>
              </div>
            </div>
          </div>

          {/* Col 4: Safety & Medical Disclaimer */}
          <div className="bg-navy-900/60 p-4 rounded-xl border border-navy-800 text-xs space-y-2">
            <h5 className="font-semibold text-white flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-teal-400" />
              Safety & Verification Protocol
            </h5>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              HealthBridge 360 strictly adheres to non-inferential water quality standards and transactional medicine tracking. Web requests do not replace direct emergency phone dispatches in life-threatening scenarios.
            </p>
            <p className="text-[10px] text-slate-500 pt-1 border-t border-navy-800">
              Team: <strong className="text-slate-300">Ctrl Alt Defeat</strong>
            </p>
          </div>
        </div>

        <div className="border-t border-navy-900 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 HEALTHBRIDGE 360. Developed for Kantheru Community Platform. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/login?demo=true" className="text-teal-400 hover:text-teal-300">
              Role Switcher
            </Link>
            <span>•</span>
            <Link href="/intelligence" className="hover:text-slate-400">
              Live Analytics
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
