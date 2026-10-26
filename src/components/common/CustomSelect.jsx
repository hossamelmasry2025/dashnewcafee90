import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export const CustomSelect = ({
  value,
  onChange,
  options = [],
  placeholder = 'اختر...',
  disabled = false,
  className = '',
  buttonClassName = '',
  menuClassName = '',
  searchable = undefined,
  searchPlaceholder = 'بحث في الخيارات...',
  isRtl = true,
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Normalize options to { value, label, sublabel }
  const normalizedOptions = useMemo(() => {
    return options.map(opt => {
      if (typeof opt === 'string' || typeof opt === 'number') {
        return { value: String(opt), label: String(opt) };
      }
      return {
        value: String(opt.value ?? opt.id ?? ''),
        label: opt.label ?? opt.nameAr ?? opt.name_ar ?? opt.name ?? opt.nameEn ?? opt.name_en ?? String(opt.value ?? ''),
        sublabel: opt.sublabel ?? (opt.nameEn || opt.name_en ? `(${opt.nameEn || opt.name_en})` : '')
      };
    });
  }, [options]);

  // Selected option label
  const selectedOption = useMemo(() => {
    return normalizedOptions.find(opt => String(opt.value) === String(value));
  }, [normalizedOptions, value]);

  // Decide if search should be shown (if > 5 options unless explicitly disabled)
  const shouldShowSearch = searchable !== undefined ? searchable : normalizedOptions.length > 5;

  // Filter options by search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return normalizedOptions;
    const term = searchTerm.trim().toLowerCase();
    return normalizedOptions.filter(opt =>
      (opt.label && opt.label.toLowerCase().includes(term)) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(term))
    );
  }, [normalizedOptions, searchTerm]);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && shouldShowSearch && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, shouldShowSearch]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (val) => {
    onChange?.(val);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(prev => !prev)}
        className={`w-full flex items-center justify-between gap-2 px-3 h-10 text-[13px] font-medium rounded-xl border transition-all text-start cursor-pointer select-none ${
          isOpen
            ? 'bg-white border-gold-400 ring-4 ring-gold-400/15 text-chocolate-950'
            : 'bg-white border-stone-200 text-chocolate-900 hover:border-stone-300 shadow-2xs'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-stone-100' : ''} ${buttonClassName}`}
      >
        <span className="truncate flex-1">
          {selectedOption ? (
            <span className="inline-flex items-center gap-1.5 truncate">
              <span className="font-semibold text-chocolate-950">{selectedOption.label}</span>
              {selectedOption.sublabel && (
                <span className="text-[10px] text-stone-400 font-medium">{selectedOption.sublabel}</span>
              )}
            </span>
          ) : (
            <span className="text-stone-400 font-medium">{placeholder}</span>
          )}
        </span>

        <ChevronDown
          className={`w-3.5 h-3.5 text-stone-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-gold-600' : ''
          }`}
        />
      </button>

      {/* Hidden input for form validation if required */}
      {required && (
        <input
          type="text"
          value={value || ''}
          onChange={() => {}}
          required={required}
          className="opacity-0 pointer-events-none absolute bottom-0 left-0 h-0 w-0"
          tabIndex={-1}
        />
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute z-50 mt-1.5 w-full min-w-[200px] bg-white rounded-xl border border-stone-200/80 shadow-pop overflow-hidden animate-fade-in ${menuClassName}`}
          style={{ maxHeight: '280px' }}
        >
          {/* Search Box if list is long */}
          {shouldShowSearch && (
            <div className="p-2 border-b border-stone-100 bg-[#FAF8F5]/80">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={searchPlaceholder}
                  className={`w-full ${isRtl ? 'pr-8 pl-6' : 'pl-8 pr-6'} py-1.5 text-xs bg-white border border-stone-200 focus:border-gold-500 rounded-lg outline-none font-medium placeholder:text-stone-400 transition-colors`}
                />
                <Search className={`w-3.5 h-3.5 text-stone-400 absolute ${isRtl ? 'right-2.5' : 'left-2.5'} top-1/2 -translate-y-1/2 pointer-events-none`} />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className={`absolute ${isRtl ? 'left-2' : 'right-2'} top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5 rounded cursor-pointer`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options Scrollable List */}
          <div
            className="overflow-y-auto p-1"
            style={{ maxHeight: shouldShowSearch ? '220px' : '260px' }}
          >
            {filteredOptions.length === 0 ? (
              <div className="py-6 px-4 text-center text-xs text-stone-400 font-medium">
                {isRtl ? 'لا توجد نتائج مطابقة' : 'No options found'}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full text-start px-3 py-2 rounded-lg text-[13px] transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-gold-50 text-chocolate-950 font-semibold'
                        : 'text-stone-800 hover:bg-gold-50/70 hover:text-chocolate-950 font-medium'
                    }`}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="truncate">{opt.label}</span>
                      {opt.sublabel && (
                        <span className={`text-[10px] truncate ${isSelected ? 'text-gold-700/80' : 'text-stone-400'}`}>
                          {opt.sublabel}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-gold-600 shrink-0" strokeWidth={2.5} />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
