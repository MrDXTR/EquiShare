"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { cn } from "~/lib/utils";

interface MorphingTextProps {
  className?: string;
  texts: string[];
}

export const MorphingText: React.FC<MorphingTextProps> = ({
  texts,
  className,
}) => {
  const [index, setIndex] = useState(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (texts.length < 2) return;
    const interval = window.setInterval(
      () => setIndex((current) => (current + 1) % texts.length),
      4200
    );
    return () => window.clearInterval(interval);
  }, [texts.length]);

  return (
    <div
      className={cn(
        "relative mx-auto h-16 w-full max-w-3xl text-center font-sans text-[40pt] leading-none font-bold md:h-24 lg:text-[6rem]",
        className
      )}
      aria-live="polite"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={texts[index]}
          className="absolute inset-x-0 top-0 m-auto inline-block w-full"
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
          transition={{ duration: reducedMotion ? 0 : 0.28, ease: "easeOut" }}
        >
          {texts[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};
