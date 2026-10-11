"use client";

import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown, FaTimes } from 'react-icons/fa';

export default function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = "Select an option",
  disabled = false,
  required = false,
  className = "",
  name = "",
  // Compact variant — matches the small text-xs inputs used in the order-edit
  // panels (thank-you / My Orders) so the dropdowns don't tower over the form.
  compact = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get display value
  const displayValue = value && value !== 'other' ? value : '';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle option selection
  const handleSelect = (option) => {
    onChange({ target: { name, value: option } });
    setIsOpen(false);
    setSearchTerm('');
  };

  // Clear selection
  const handleClear = (e) => {
    e.stopPropagation();
    onChange({ target: { name, value: '' } });
    setSearchTerm('');
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Main display button */}
      <button
        type="button"
        onClick={toggleDropdown}
        disabled={disabled}
        className={`w-full border border-gray-300 text-left focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none bg-white flex items-center justify-between ${
          compact ? 'px-2.5 py-1.5 rounded-lg text-xs' : 'px-4 py-3 rounded-xl'
        } ${
          disabled ? 'bg-gray-100 cursor-not-allowed text-gray-400' : 'cursor-pointer hover:border-gray-300'
        }`}
      >
        <span className={`truncate ${displayValue ? 'text-gray-900' : 'text-gray-400'}`}>
          {displayValue || placeholder}
        </span>
        <div className="flex items-center gap-2 shrink-0 pl-1.5">
          {displayValue && !disabled && (
            <FaTimes
              className="text-gray-400 hover:text-gray-600 w-3 h-3"
              onClick={handleClear}
            />
          )}
          <FaChevronDown
            className={`text-gray-400 transition-transform ${compact ? 'w-2.5 h-2.5' : ''} ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Dropdown menu */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Type to search..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none text-sm"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Options list */}
          <div className="overflow-y-auto max-h-48">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors ${
                    value === option ? 'bg-gray-100 text-[#1D1D1F] font-medium' : 'text-gray-700'
                  }`}
                >
                  {option}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No results found
              </div>
            )}

            {/* "Other" option */}
            {options.length > 0 && (
              <button
                type="button"
                onClick={() => handleSelect('other')}
                className={`w-full px-4 py-2 text-left border-t border-gray-100 hover:bg-gray-100 transition-colors ${
                  value === 'other' ? 'bg-gray-100 text-[#1D1D1F] font-medium' : 'text-gray-700'
                }`}
              >
                Other (Type your own)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
