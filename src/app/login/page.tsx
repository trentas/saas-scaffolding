"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { FcGoogle } from "react-icons/fc";

import { Background } from "@/components/background";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error.includes("EmailNotVerified") || result.error.includes("verify your email")) {
          setError("Please verify your email before signing in. Check your inbox for a verification link.");
          setShowResendVerification(true);
        } else if (result.error.includes("AccountLocked") || result.error.includes("locked")) {
          setError("Your account has been temporarily locked due to too many failed login attempts. Please try again later.");
          setShowResendVerification(false);
        } else {
          setError(`Login failed: ${result.error}`);
          setShowResendVerification(false);
        }
      } else if (result?.ok) {
        // Check if user has organizations
        const session = await getSession();
        if (session?.user?.organizations && session.user.organizations.length > 0) {
          // Redirect to first organization dashboard
          const firstOrg = session.user.organizations[0];
          router.push(`/${firstOrg.slug}/dashboard`);
        } else {
          // Redirect to setup page
          router.push("/setup");
        }
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/setup" });
  };

  const handleResendVerification = async () => {
    if (!email) {
      setResendMessage("Please enter your email address first.");
      return;
    }

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setResendMessage("Verification email sent! Please check your inbox.");
        setShowResendVerification(false);
      } else {
        setResendMessage(data.message || "Failed to send verification email.");
      }
    } catch (error) {
      setResendMessage("An error occurred. Please try again.");
    }
  };

  return (
    <Background>
      <section className="py-28 lg:pt-44 lg:pb-32">
        <div className="container">
          <div className="flex flex-col gap-4">
            <Card className="mx-auto w-full max-w-sm">
              <CardHeader className="flex flex-col items-center space-y-0">
                <Image
                  src="/logo.svg"
                  alt="logo"
                  width={94}
                  height={18}
                  className="mb-7 dark:invert"
                />
                <p className="mb-2 text-2xl font-bold">Welcome back</p>
                <p className="text-muted-foreground">
                  Please enter your details.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="grid gap-4">
                  {error && (
                    <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                      {error}
                      {showResendVerification && (
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={handleResendVerification}
                            className="text-sm text-primary hover:underline"
                          >
                            Resend verification email
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  {resendMessage && (
                    <div className="rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
                      {resendMessage}
                    </div>
                  )}
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error || resendMessage) {
                        setError("");
                        setResendMessage("");
                        setShowResendVerification(false);
                      }
                    }}
                    required
                  />
                  <div>
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked === true)}
                        className="border-muted-foreground"
                      />
                      <label
                        htmlFor="remember"
                        className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Remember me
                      </label>
                    </div>
                    <Link href="/auth/forgot-password" className="text-primary text-sm font-medium">
                      Forgot password
                    </Link>
                  </div>
                  <Button type="submit" className="mt-2 w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign in"}
                  </Button>
                  {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleGoogleSignIn}
                      disabled={isLoading}
                    >
                      <FcGoogle className="mr-2 size-5" />
                      Sign in with Google
                    </Button>
                  )}
                </form>
                <div className="text-muted-foreground mx-auto mt-8 flex justify-center gap-1 text-sm">
                  <p>Don&apos;t have an account?</p>
                  <Link href="/signup" className="text-primary font-medium">
                    Sign up
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Background>
  );
};

export default Login;
