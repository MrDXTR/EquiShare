"use client";

import { motion } from "framer-motion";

export function LoadingScreen() {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Loading content, please wait…</span>

      <motion.div
        className="flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        aria-hidden="true"
      >
        <div className="relative flex h-10 w-10 items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-border/50" />
          <motion.div
            className="absolute inset-0 rounded-full border border-transparent border-t-foreground/70"
            animate={{ rotate: 360 }}
            transition={{
              duration: 0.9,
              ease: "linear",
              repeat: Infinity,
            }}
          />
        </div>
      </motion.div>

      <motion.p
        className="mt-6 font-mono text-[13px] text-muted-foreground tabular-nums"
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        aria-hidden="true"
      >
        Loading…
      </motion.p>
    </div>
  );
}
