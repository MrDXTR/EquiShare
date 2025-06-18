"use client";

import { motion } from "framer-motion";

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-50 dark:bg-gray-950/80">
      <motion.div 
        className="flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="relative">
          {/* Outer circle */}
          <motion.div 
            className="h-16 w-16 rounded-full border-2 border-blue-200 dark:border-gray-700"
            animate={{ rotate: 360 }}
            transition={{ 
              duration: 2,
              ease: "linear",
              repeat: Infinity
            }}
          />
          
          {/* Inner spinning gradient circle */}
          <motion.div 
            className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500"
            animate={{ 
              rotate: 360,
              scale: [0.8, 1, 0.8]
            }}
            transition={{ 
              rotate: {
                duration: 1.5,
                ease: "linear",
                repeat: Infinity
              },
              scale: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
          />
          
          {/* Center white circle for contrast */}
          <div className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white dark:bg-gray-900" />
        </div>
      </motion.div>
      
      <motion.p 
        className="mt-6 text-sm font-medium text-gray-600 dark:text-gray-300"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        Loading...
      </motion.p>
    </div>
  );
}