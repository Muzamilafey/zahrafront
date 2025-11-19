import React from 'react';

// Lightweight animated page wrapper without framer-motion dependency.
// Uses CSS transition for a simple fade/slide effect when mounted.
const AnimatedPage = ({ children }) => {
  return (
    <div className="transition-transform duration-300 ease-out transform-gpu" style={{ willChange: 'transform, opacity' }}>
      {children}
    </div>
  );
};

export default AnimatedPage;
