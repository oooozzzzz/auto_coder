'use client';

import React, { useState, useEffect } from 'react';

interface StepTransitionProps {
  children: React.ReactNode;
  isActive: boolean;
  direction?: 'forward' | 'backward';
  duration?: number;
}

const StepTransition: React.FC<StepTransitionProps> = ({ 
  children, 
  isActive, 
  direction = 'forward',
  duration = 300 
}) => {
  const [isVisible, setIsVisible] = useState(isActive);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isActive) {
      setIsVisible(true);
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), duration);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsAnimating(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isActive, duration]);

  if (!isVisible) {
    return null;
  }

  const getTransitionClasses = () => {
    const baseClasses = "transition-all duration-300 ease-in-out";
    
    if (!isAnimating) {
      return `${baseClasses} opacity-100 transform translate-x-0`;
    }

    if (isActive) {
      // Entering
      const enterFrom = direction === 'forward' ? 'translate-x-full' : '-translate-x-full';
      return `${baseClasses} opacity-0 transform ${enterFrom}`;
    } else {
      // Exiting
      const exitTo = direction === 'forward' ? '-translate-x-full' : 'translate-x-full';
      return `${baseClasses} opacity-0 transform ${exitTo}`;
    }
  };

  return (
    <div className={getTransitionClasses()}>
      {children}
    </div>
  );
};

export default StepTransition;