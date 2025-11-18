import React, { useState, FocusEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
}

export const InputField: React.FC<InputFieldProps> = ({ label, id, type = 'text', value, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value && String(value).length > 0;

  const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    if (props.onFocus) props.onFocus(e);
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    if (props.onBlur) props.onBlur(e);
  };
  
  const labelVariants = {
    inactive: {
      y: 0,
      scale: 1,
      color: '#6b7280', // text-gray-500
    },
    active: {
      y: -22,
      scale: 0.875, // text-sm
      color: '#0369a1', // text-brand-700
    },
  };

  return (
    <div className="relative mt-1">
      <motion.label
        htmlFor={id}
        className="absolute left-3 top-2.5 origin-left pointer-events-none text-base text-gray-500"
        variants={labelVariants}
        animate={isFocused || hasValue ? 'active' : 'inactive'}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {label}
      </motion.label>
      <input
        id={id}
        type={type}
        value={value}
        {...props}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="appearance-none block w-full px-3 py-2 border border-gray-300 bg-transparent rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-0 sm:text-sm"
      />
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: isFocused ? 1 : 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
    </div>
  );
};