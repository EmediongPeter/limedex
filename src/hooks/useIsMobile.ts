'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to detect if the current device is a mobile device
 * Uses both screen size and user agent detection
 */
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    // Function to check if the current device is mobile
    const checkMobile = () => {
      // Consider device mobile if width < 768px or if userAgent indicates mobile device
      const mobileBySize = window.innerWidth < 768;
      const mobileByAgent = typeof navigator !== 'undefined' && 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      setIsMobile(mobileBySize || mobileByAgent);
    };
    
    // Check immediately
    checkMobile();
    
    // Recheck on window resize
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
};

/**
 * Hook to detect if the device is in portrait or landscape orientation
 */
export const useOrientation = () => {
  const [isPortrait, setIsPortrait] = useState(true);
  
  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);
  
  return { isPortrait, isLandscape: !isPortrait };
};
