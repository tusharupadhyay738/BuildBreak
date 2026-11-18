import React, { useState } from 'react';
import { ArrowDown, Ticket } from 'lucide-react';
import { HERO_VENUE_IMAGE } from '../data/demoFixtures';
import type { DataSourceMode } from '../types/booking';

interface HeroSectionProps {
  dataSource: DataSourceMode;
  eventCount: number;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ dataSource, eventCount }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <section id="top" className="border-b border-[#E4E4E7] bg-white">
      <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Left editorial proposition */}
          <div className="flex flex-col justify-between gap-6 lg:col-span-6">
            <div>
              <p className="text-xs font-medium tracking-wide text-[#525866]">
                Box Office &amp; Reservations
                <span aria-hidden="true" className="mx-2 text-[#A1A1AA]">
                  ·
                </span>
                {dataSource === 'demo-fixture'
                  ? 'Demo Fixture Preview'
                  : 'Connected to Flask API'}
              </p>

              <h1 className="mt-4 font-display text-[clamp(2.25rem,4vw,3.35rem)] font-bold leading-[1.08] tracking-tight text-[#111315] [text-wrap:balance]">
                Reserve seats for the winter cultural season.
              </h1>

              <p className="mt-5 max-w-[54ch] text-base leading-relaxed text-[#3F4451]">
                Browse {eventCount} curated evening programs, verify live ticket pricing and
                promotional codes before submitting, and keep a reload-safe confirmation pass.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-5 pt-2">
              <a
                href="#events"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#111315] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#27272A] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
              >
                Browse Events
                <ArrowDown className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="#api-contracts"
                className="inline-flex min-h-[44px] items-center text-sm font-medium text-[#3F4451] hover:text-[#111315] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
              >
                Review Flask API Contracts
              </a>
            </div>
          </div>

          {/* Right visual showcase */}
          <div className="lg:col-span-6">
            <div className="relative h-full min-h-[240px] overflow-hidden rounded-xl border border-[#E4E4E7] bg-[#18181B]">
              {!imageError ? (
                <img
                  src={HERO_VENUE_IMAGE}
                  alt="Warmly lit timber and dark slate concert hall before doors open"
                  referrerPolicy="no-referrer"
                  onError={() => setImageError(true)}
                  className="h-full w-full aspect-[16/9] lg:aspect-auto object-cover"
                />
              ) : (
                <div className="flex h-full min-h-[260px] flex-col items-center justify-center bg-gradient-to-br from-[#18181B] via-[#27272A] to-[#111315] p-8 text-center text-white">
                  <Ticket className="h-10 w-10 text-[#93C5FD]" aria-hidden="true" />
                  <p className="mt-3 font-display text-lg font-semibold">
                    SeatPilot Box Office
                  </p>
                  <p className="mt-1 text-sm text-[#A1A1AA]">
                    Meridian Hall · Astor Conservatory · Foundry Pavilion
                  </p>
                </div>
              )}

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-5 py-4 text-white">
                <p className="text-xs font-medium text-white/90">
                  Winter 2026–2027 Program
                  <span aria-hidden="true" className="mx-2 text-white/60">
                    ·
                  </span>
                  Chicago, Seattle &amp; Boston
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
