"use client";

import { useState } from "react";
import { ArrowRight, Home } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function SignInPage() {
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    await signIn("google", { callbackUrl: "/groups" });
  };

  const handleHomeClick = () => {
    router.push("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-white p-4 dark:from-gray-900 dark:to-gray-950">
      <div className="w-full max-w-sm">
        {/* Logo/Brand */}
        <div className="mb-12 text-center">
          <div className="mb-4 flex items-center justify-center">
            <Image src="/file.svg" alt="DxtrSplit" width={100} height={100} />
          </div>
          <h1 className="text-2xl font-light text-gray-900 dark:text-gray-100">
            Welcome to DxtrSplit
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Sign in to continue
          </p>
        </div>

        {/* Sign In Form */}
        <div className="space-y-4">
          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            disabled={isLoading}
            className={`flex h-12 w-full items-center justify-center rounded-lg border border-gray-200 bg-white transition-all duration-200 ease-out dark:border-gray-700 dark:bg-gray-800 ${isHovered && !isLoading ? "-translate-y-0.5 transform border-gray-300 shadow-md dark:border-gray-600" : ""} ${isLoading ? "cursor-not-allowed opacity-50" : "hover:shadow-sm"} focus:ring-opacity-5 focus:ring-2 focus:ring-black focus:outline-none dark:focus:ring-white`}
          >
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600 dark:border-gray-600 dark:border-t-gray-300"></div>
            ) : (
              <>
                <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  Continue with Google
                </span>
                <ArrowRight
                  className={`ml-3 h-4 w-4 transition-transform duration-200 ${isHovered ? "translate-x-0.5" : ""}`}
                />
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative my-6 flex items-center">
            <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
            <span className="bg-white px-4 text-xs text-gray-400 dark:bg-gray-900 dark:text-gray-500">
              or
            </span>
            <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
          </div>

          {/* Home Button */}
          <button
            onClick={handleHomeClick}
            className="flex h-12 w-full items-center justify-center rounded-lg border border-gray-200 bg-gray-50 transition-all duration-200 ease-out hover:border-gray-300 hover:bg-gray-100 focus:ring-2 focus:ring-gray-200 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-700"
          >
            <Home className="mr-2 h-4 w-4 text-gray-600 dark:text-gray-300" />
            <span className="font-medium text-gray-600 dark:text-gray-300">
              Back to home
            </span>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            By continuing, you agree to our{" "}
            <a
              href="#"
              className="text-gray-600 underline hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="#"
              className="text-gray-600 underline hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
