import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <p className="text-muted-foreground text-sm">
          © {new Date().getFullYear()} DxtrSplit. All rights reserved.
        </p>

        <div className="flex items-center gap-6">
          <Link
            href="/privacy"
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
