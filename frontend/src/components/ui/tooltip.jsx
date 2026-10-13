import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Premium glassmorphic tooltip with smooth animations and directional placement.
 * Automatically disabled on mobile/touch screens (<768px or touch pointer).
 * 
 * @param {React.ReactNode} children - Target interactive element
 * @param {string | React.ReactNode} content - Tooltip text or content
 * @param {"top" | "bottom" | "left" | "right"} position - Placement direction
 * @param {number} delay - Hover delay in ms (default: 150ms)
 * @param {string} className - Optional tooltip container classes
 * @param {string} wrapperClassName - Classes for the wrapper container
 * @param {boolean} disabled - Disable showing tooltip
 */
export default function Tooltip({
  children,
  content,
  position = "top",
  delay = 150,
  className = "",
  wrapperClassName = "",
  disabled = false,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef(null);

  const showTooltip = () => {
    if (disabled || !content) return;
    // Strictly disable on mobile/touch screens (<768px)
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      return;
    }
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Position classes (Framer Motion handles translation transforms to avoid CSS overwrite bugs)
  const positionClasses = {
    top: "bottom-full left-1/2 mb-2",
    bottom: "top-full left-1/2 mt-2",
    left: "right-full top-1/2 mr-2",
    right: "left-full top-1/2 ml-2",
  };

  // Motion animation definitions with guaranteed translation centering
  const motionVariants = {
    top: {
      initial: { opacity: 0, scale: 0.95, x: "-50%", y: 4 },
      animate: { opacity: 1, scale: 1, x: "-50%", y: 0 },
      exit: { opacity: 0, scale: 0.95, x: "-50%", y: 2 },
    },
    bottom: {
      initial: { opacity: 0, scale: 0.95, x: "-50%", y: -4 },
      animate: { opacity: 1, scale: 1, x: "-50%", y: 0 },
      exit: { opacity: 0, scale: 0.95, x: "-50%", y: -2 },
    },
    left: {
      initial: { opacity: 0, scale: 0.95, x: 4, y: "-50%" },
      animate: { opacity: 1, scale: 1, x: 0, y: "-50%" },
      exit: { opacity: 0, scale: 0.95, x: 2, y: "-50%" },
    },
    right: {
      initial: { opacity: 0, scale: 0.95, x: -4, y: "-50%" },
      animate: { opacity: 1, scale: 1, x: 0, y: "-50%" },
      exit: { opacity: 0, scale: 0.95, x: -2, y: "-50%" },
    },
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-slate-900/95",
    bottom: "bottom-full left-1/2 -translate-x-1/2 -mb-[1px] border-4 border-transparent border-b-slate-900/95",
    left: "left-full top-1/2 -translate-y-1/2 -ml-[1px] border-4 border-transparent border-l-slate-900/95",
    right: "right-full top-1/2 -translate-y-1/2 -mr-[1px] border-4 border-transparent border-r-slate-900/95",
  };

  const currentVariant = motionVariants[position] || motionVariants.top;

  return (
    <div
      className={`relative inline-flex items-center ${wrapperClassName}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}

      <AnimatePresence>
        {isVisible && content && (
          <motion.div
            role="tooltip"
            initial={currentVariant.initial}
            animate={currentVariant.animate}
            exit={currentVariant.exit}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className={`pointer-events-none absolute z-50 hidden md:block rounded-lg border border-slate-700/60 bg-slate-900/95 px-3 py-1.5 text-[11px] font-medium text-slate-100 shadow-xl backdrop-blur-md select-none w-max max-w-[260px] sm:max-w-[300px] text-center leading-snug whitespace-normal ${positionClasses[position]} ${className}`}
          >
            {content}
            <div className={`absolute h-0 w-0 pointer-events-none ${arrowClasses[position]}`} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
