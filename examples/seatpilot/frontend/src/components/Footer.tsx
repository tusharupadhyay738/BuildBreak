import React from 'react';
import type { DataSourceMode } from '../types/booking';

interface FooterProps {
  dataSource: DataSourceMode;
}

export const Footer: React.FC<FooterProps> = ({ dataSource }) => {
  return (
    <footer className="border-t border-[#E4E4E7] bg-[#F7F7F5] py-8">
      <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-4 px-4 text-xs text-[#525866] sm:flex-row sm:items-center sm:px-6 lg:px-8">
        <div>
          <span className="font-display font-semibold text-[#111315]">SeatPilot</span>
          <span aria-hidden="true" className="mx-2 text-[#A1A1AA]">
            ·
          </span>
          <span>
            Fictional Event Ticketing Preview (
            {dataSource === 'demo-fixture'
              ? 'Explicit Demo Fixtures Active'
              : 'Connected to Flask Backend'}
            )
          </span>
        </div>

        <div className="flex items-center gap-6">
          <a href="#events" className="hover:text-[#111315] transition-colors">
            Events
          </a>
          <a href="#checkout" className="hover:text-[#111315] transition-colors">
            Reserve
          </a>
          <a href="#api-contracts" className="hover:text-[#111315] transition-colors">
            API Contracts
          </a>
        </div>
      </div>
    </footer>
  );
};
