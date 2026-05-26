"use client";

import { motion } from "framer-motion";

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
      <motion.div
        className="flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="relative">
          {/* Outer circle */}
          <motion.div
            className="h-16 w-16 rounded-full border-2 border-border/60"
            animate={{ rotate: 360 }}
            transition={{
              duration: 2,
              ease: "linear",
              repeat: Infinity,
            }}
          />

          {/* Inner spinning gradient circle */}
          <motion.div
            className="absolute top-1/2 left-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500"
            animate={{
              rotate: 360,
              scale: [0.8, 1, 0.8],
            }}
            transition={{
              rotate: {
                duration: 1.5,
                ease: "linear",
                repeat: Infinity,
              },
              scale: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }}
          />

          {/* Center white circle for contrast */}
          <div className="absolute top-1/2 left-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background" />
        </div>
      </motion.div>

      <motion.p
        className="mt-6 text-sm font-medium text-muted-foreground"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        Loading...
      </motion.p>
    </div>
  );
}
