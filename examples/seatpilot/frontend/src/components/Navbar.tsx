import React from 'react';

interface NavbarProps {
  hasSavedBooking: boolean;
  onPrimaryAction: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ hasSavedBooking, onPrimaryAction }) => {
  return (
    <header className="sticky top-0 z-40 border-b border-[#E4E4E7] bg-[#F7F7F5]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-8 px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Zone 1: Single-element Brand Wordmark */}
        <a
          href="#top"
          className="font-display text-lg font-bold tracking-tight text-[#111315] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1D4ED8]"
        >
          SeatPilot
        </a>

        {/* Zone 2: Concise single-line navigation links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#525866]"
        >
          <a
            href="#events"
            className="hover:text-[#111315] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Events
          </a>
          <a
            href="#checkout"
            className="hover:text-[#111315] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Reserve Seats
          </a>
          <a
            href="#confirmation"
            className="hover:text-[#111315] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Confirmation
          </a>
          <a
            href="#api-contracts"
            className="hover:text-[#111315] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            API Contracts
          </a>
        </nav>

        {/* Zone 3: Single primary action button */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onPrimaryAction}
            className="min-h-[40px] px-4 py-2 text-sm font-medium text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8] cursor-pointer"
          >
            {hasSavedBooking ? 'View Saved Booking' : 'Select Event'}
          </button>
        </div>
      </div>
    </header>
  );
};
