import React from 'react';

// reuseable sort dropdown used across product listing pages
export const SORT_OPTIONS = [
  { value: 'position', label: 'Default' },
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'nameAsc', label: 'Name A to Z' },
  { value: 'nameDesc', label: 'Name Z to A' },
  { value: 'priceHigh', label: 'Price High to Low' },
  { value: 'priceLow', label: 'Price Low to High' },
];

export default function SortDropdown({ value, onChange, options = SORT_OPTIONS, className = '' }) {
  return (
    <div className={`inline-block relative ${className}`}>      
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="block appearance-none w-full bg-white border border-gray-200 hover:border-[#1D1D1F] px-4 py-2 pr-9 rounded-full leading-tight text-xs sm:text-sm text-[#1F2937] shadow-sm focus:outline-none focus:ring-1 focus:ring-[#1D1D1F] transition-colors cursor-pointer"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {/* chevron icon */}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#1D1D1F]">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M5.516 7.548L10 12.032l4.484-4.484 1.032 1.032L10 14.096 4.484 8.58z"/>
        </svg>
      </div>
    </div>
  );
}
