"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";
import Image from "next/image";
import { AnimatedThemeToggler } from "~/components/ui/animated-theme-toggler";

export function Header() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/85 backdrop-blur-md transition-colors">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center space-x-2.5 transition-opacity hover:opacity-85 active:scale-[0.98]"
        >
          <Image
            src="/file.svg"
            alt="EquiShare"
            width={28}
            height={28}
            className="size-7"
          />
          <span className="text-xl font-bold tracking-tight text-foreground">
            EquiShare
          </span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4">
          {status === "loading" ? (
            <div className="h-9 w-20 animate-pulse rounded-lg bg-muted" />
          ) : session ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="/groups">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 font-medium active:scale-[0.97] transition-[transform,background-color] duration-150"
                >
                  Groups
                </Button>
              </Link>

              <AnimatedThemeToggler className="size-9 rounded-full border border-border/70 bg-background/80 p-2 shadow-2xs transition-[transform,border-color,background-color] duration-150 hover:border-primary/50 hover:bg-accent active:scale-[0.96]" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="relative size-9.5 cursor-pointer rounded-full outline-none ring-1 ring-border/80 transition-[transform,box-shadow] duration-150 hover:ring-primary/50 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.95]"
                  >
                    <Avatar className="size-full">
                      <AvatarImage
                        src={session.user?.image || ""}
                        alt={session.user?.name || "User"}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                        {session.user?.name?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 p-1.5" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-2">
                    {session.user?.name && (
                      <p className="text-sm font-semibold text-foreground truncate">
                        {session.user.name}
                      </p>
                    )}
                    {session.user?.email && (
                      <p className="text-muted-foreground text-xs truncate">
                        {session.user.email}
                      </p>
                    )}
                  </div>
                  <div className="my-1 border-t border-border/60" />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive dark:focus:bg-destructive/20 rounded-md py-2 text-sm"
                  >
                    <LogOut className="mr-2 size-4 text-destructive" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <AnimatedThemeToggler className="size-9 rounded-full border border-border/70 bg-background/80 p-2 shadow-2xs transition-[transform,border-color,background-color] duration-150 hover:border-primary/50 hover:bg-accent active:scale-[0.96]" />
              <Button
                onClick={() => router.push("/signin")}
                variant="default"
                size="sm"
                className="h-9 font-medium active:scale-[0.97] transition-transform duration-150"
              >
                Sign In
              </Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
