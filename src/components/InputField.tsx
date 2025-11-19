import React, { useState, FocusEvent } from 'react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
}

export const InputField: React.FC<InputFieldProps> = ({ label, id, type = 'text', value, onFocus, onBlur, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value && String(value).length > 0;

  const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  return (
    <div className="relative mt-1">
      <label
        htmlFor={id}
        className={`absolute left-3 top-2.5 origin-left pointer-events-none text-base transition-all duration-150 ${isFocused || hasValue ? 'text-sm text-blue-600 -translate-y-5' : 'text-gray-500'}`}
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        {...props}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="appearance-none block w-full px-3 py-2 border border-gray-300 bg-transparent rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-0 sm:text-sm"
      />
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600" style={{ transform: isFocused ? 'scaleX(1)' : 'scaleX(0)', transition: 'transform 0.25s ease' }} />
    </div>
  );
};