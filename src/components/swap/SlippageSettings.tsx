import React, { useState, useEffect, useRef } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import useClickOutside from '@/hooks/useClickOutside';

const PRESETS = [
  { label: '0.1%', value: 10 },
  { label: '0.5%', value: 50 },
  { label: '1%', value: 100 },
];

const SlippageSettings: React.FC = () => {
  const { slippage, setSlippage, slippageInput, setSlippageInput } = useSettings();
  const [isCustom, setIsCustom] = useState(!PRESETS.some(preset => preset.value === slippage));
  const [isOpen, setIsOpen] = useState(false);
  const slippageRef = useRef<HTMLDivElement>(null);
  
  // Close slippage settings when clicking outside
  useClickOutside(slippageRef, () => {
    if (isOpen) setIsOpen(false);
  });

  // Update custom input when slippage changes from outside
  useEffect(() => {
    if (isCustom) {
      const valueInPercent = (slippage / 100).toFixed(2);
      if (valueInPercent !== slippageInput) {
        setSlippageInput(valueInPercent);
      }
    }
  }, [slippage, isCustom]);

  const handlePresetClick = (value: number) => {
    setSlippage(value);
    setSlippageInput((value / 100).toFixed(2));
    setIsCustom(false);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Allow empty, decimal numbers with up to 2 decimal places
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setSlippageInput(value);
      
      // Only update slippage if it's a valid number
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0.01 && numValue <= 50) {
        setSlippage(Math.round(numValue * 100));
      }
    }
  };

  const handleCustomBlur = () => {
    // If input is empty, set to default
    if (slippageInput === '') {
      setSlippageInput('0.50');
      setSlippage(50);
      setIsCustom(false);
      return;
    }

    const numValue = parseFloat(slippageInput);
    
    // Validate and clamp the value
    if (isNaN(numValue) || numValue < 0.01) {
      setSlippageInput('0.50');
      setSlippage(50);
      setIsCustom(false);
    } else if (numValue > 50) {
      setSlippageInput('50.00');
      setSlippage(5000);
    } else {
      // Format to 2 decimal places
      setSlippageInput(numValue.toFixed(2));
    }
  };

  const handleCustomFocus = () => {
    setIsCustom(true);
  };

  return (
    <div ref={slippageRef} className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
      >
        <span className="mr-1">Slippage</span>
        <span className="text-gray-700 dark:text-gray-200 font-medium">
          {slippage / 100}%
        </span>
        <svg 
          className={`w-4 h-4 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 z-10 border border-gray-200 dark:border-slate-700">
          <div className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
            Slippage tolerance
          </div>
          <div className="flex items-center space-x-2 mb-3">
            {PRESETS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => handlePresetClick(preset.value)}
                className={`flex-1 py-1.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                  !isCustom && slippage === preset.value
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                    : 'bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <input
              type="text"
              value={slippageInput}
              onChange={handleCustomChange}
              onBlur={handleCustomBlur}
              onFocus={handleCustomFocus}
              className={`w-full p-2 pr-12 rounded-lg border ${
                isCustom 
                  ? 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700'
              } text-right`}
              placeholder="0.50"
              inputMode="decimal"
              pattern="^\d*\.?\d*$"
            />
            <div className="absolute right-3 top-2 text-gray-500 dark:text-gray-400 pointer-events-none">
              %
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {slippage < 50 
              ? 'Your transaction will revert if the price changes unfavorably by more than this percentage.'
              : 'High slippage increases the risk of price impact and potential losses.'}
          </div>
        </div>
      )}
    </div>
  );
};

export default SlippageSettings;
