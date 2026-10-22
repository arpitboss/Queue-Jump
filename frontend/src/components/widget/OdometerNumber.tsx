"use client";

import { motion, AnimatePresence } from "framer-motion";

interface OdometerNumberProps {
  value: number;
  prefix?: string;
  className?: string;
}

export function OdometerNumber({ value, prefix = "#", className = "" }: OdometerNumberProps) {
  const digits = value.toString().split("");

  return (
    <div className={`inline-flex items-center font-mono font-extrabold tracking-tight ${className}`}>
      {prefix && <span>{prefix}</span>}
      <div className="inline-flex overflow-hidden h-[1.15em] leading-[1.15em]">
        <AnimatePresence mode="popLayout" initial={false}>
          {digits.map((digit, index) => (
            <motion.span
              key={`${index}-${digit}`}
              initial={{ y: 24, opacity: 0, filter: "blur(2px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              exit={{ y: -24, opacity: 0, filter: "blur(2px)" }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
              }}
              className="inline-block"
            >
              {digit}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}