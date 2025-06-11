"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { motion } from "framer-motion";

export function Header() {
  const { data: session } = useSession();

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 border-b backdrop-blur supports-[backdrop-filter]:bg-background/80"
    >
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <span className="text-xl font-bold tracking-tight">DxtrSplit</span>
        </Link>

        <nav className="flex items-center gap-6">
          {session ? (
            <div className="flex items-center gap-4">
              <Link href="/groups">
                <Button variant="ghost" className="font-medium">
                  Groups
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => void signOut()}
                className="font-medium"
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <Button onClick={() => void signIn()} className="font-medium">
              Sign In
            </Button>
          )}
        </nav>
      </div>
    </motion.header>
  );
}