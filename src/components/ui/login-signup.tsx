"use client";

import { useState, type FormEvent } from "react";
import { BarChart, Code, Key, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isWorkOSClientEnabled } from "@/lib/workos/client";
import { logAuthEvent } from "@/lib/security/auth-events";
import { AvarentLogo } from "@/components/AvarentLogo";

export interface LoginCardSectionProps {
  onLogin: () => void;
  onRegisterComplete?: () => void;
}

export default function LoginCardSection({
  onLogin,
  onRegisterComplete,
}: LoginCardSectionProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("compliance_officer");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const resetErrors = () => setErrorMsg(null);

  const switchMode = (next: "signin" | "signup") => {
    setMode(next);
    resetErrors();
  };

  const workosEnabled = isWorkOSClientEnabled();

  const redirectToWorkOS = (screenHint?: "sign-up") => {
    const url =
      screenHint === "sign-up"
        ? "/api/auth/signin?screen_hint=sign-up"
        : "/api/auth/signin";
    window.location.href = url;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    resetErrors();

    if (workosEnabled) {
      redirectToWorkOS(mode === "signup" ? "sign-up" : undefined);
      return;
    }

    if (!email.trim()) {
      setErrorMsg("Please enter an email address.");
      return;
    }
    if (!password) {
      setErrorMsg("Please enter a password.");
      return;
    }
    if (mode === "signup" && !termsAccepted) {
      setErrorMsg("Please accept the terms and conditions.");
      return;
    }

    setLoading(true);
    const supabase = getSupabaseBrowserClient();

    try {
      if (mode === "signin") {
        const { error, data } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) {
          logAuthEvent({
            type: "auth.sign_in.failure",
            email: email.trim(),
            reason: error.message,
          });
          throw error;
        }
        logAuthEvent({
          type: "auth.sign_in.success",
          userId: data.user?.id,
          email: email.trim(),
        });
        onLogin();
      } else {
        const { error, data } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              first_name: firstName.trim() || undefined,
              last_name: lastName.trim() || undefined,
              username: username.trim() || undefined,
              role,
            },
          },
        });
        if (error) {
          logAuthEvent({
            type: "auth.sign_up.failure",
            email: email.trim(),
            reason: error.message,
          });
          throw error;
        }
        logAuthEvent({
          type: "auth.sign_up.success",
          userId: data.user?.id,
          email: email.trim(),
        });
        if (data.session) {
          onRegisterComplete?.();
        } else {
          setErrorMsg(
            "Account created! Please check your email to verify your address."
          );
        }
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An authentication error occurred.";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background px-4"
      data-testid="login-screen"
    >
      <div className="w-full max-w-md">
        <Card className="border-none pb-0 shadow-lg">
          {mode === "signin" ? (
            <>
              <CardHeader className="mb-2 mt-4 space-y-1 text-center">
                <div className="flex justify-center">
                  <AvarentLogo className="h-12 w-12" title="Avarent" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold">Sign in to Meridian</h2>
                  <p className="text-sm text-muted-foreground">
                    Welcome back! Please enter your details.
                  </p>
                </div>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@organization.com"
                      value={email}
                      onUpdate={setEmail}
                      disabled={loading}
                      autoComplete="email"
                    />
                  </div>
                  {!workosEnabled ? (
                  <div className="space-y-0">
                    <div className="mb-2 flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <button
                        type="button"
                        className="text-sm text-primary hover:underline"
                        onClick={(e) => e.preventDefault()}
                      >
                        Reset password
                      </button>
                    </div>
                    <Input
                      id="password"
                      data-testid="password-input"
                      placeholder="Enter your password"
                      type="password"
                      value={password}
                      onUpdate={setPassword}
                      disabled={loading}
                      autoComplete="current-password"
                    />
                  </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Continue with your work email. We will send a secure sign-in link
                      via WorkOS AuthKit.
                    </p>
                  )}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(v) => setRememberMe(v === true)}
                    />
                    <Label htmlFor="remember" className="text-sm font-normal">
                      Remember me
                    </Label>
                  </div>

                  {errorMsg && (
                    <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                      {errorMsg}
                    </p>
                  )}

                  <div className="space-y-2">
                    <Button
                      className="w-full"
                      type="submit"
                      disabled={loading}
                      data-testid="login-submit"
                      loading={loading}
                    >
                      {workosEnabled ? "Continue with email" : "Sign In"}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      type="button"
                      disabled={!workosEnabled}
                      onClick={() => redirectToWorkOS()}
                    >
                      <Key className="mr-2 h-4 w-4" />
                      {workosEnabled ? "Enterprise SSO" : "Single sign-on (SSO)"}
                    </Button>
                  </div>
                </CardContent>
              </form>
              <CardFooter className="flex justify-center border-t !py-4">
                <p className="text-center text-sm text-muted-foreground">
                  New to Meridian?{" "}
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => switchMode("signup")}
                  >
                    Sign up
                  </button>
                </p>
              </CardFooter>
            </>
          ) : (
            <>
              <CardHeader className="flex flex-col items-center space-y-1.5 pb-4 pt-6">
                <AvarentLogo className="h-12 w-12" title="Avarent" />
                <div className="flex flex-col items-center space-y-0.5">
                  <h2 className="text-2xl font-semibold text-foreground">
                    Create an account
                  </h2>
                  <p className="text-muted-foreground">
                    Welcome! Create an account to get started.
                  </p>
                </div>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6 px-8">
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger
                        id="role"
                        className="[&>span]:flex [&>span]:items-center [&>span]:gap-2 [&>span_svg]:shrink-0"
                      >
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent className="[&_*[role=option]]:ps-2 [&_*[role=option]]:pe-8 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:end-2 [&_*[role=option]>span]:flex [&_*[role=option]>span]:items-center [&_*[role=option]>span]:gap-2 [&_*[role=option]>span>svg]:shrink-0">
                        <SelectItem value="compliance_officer">
                          <User size={16} aria-hidden="true" />
                          <span className="truncate">Compliance Officer</span>
                        </SelectItem>
                        <SelectItem value="risk_analyst">
                          <Code size={16} aria-hidden="true" />
                          <span className="truncate">Risk Analyst</span>
                        </SelectItem>
                        <SelectItem value="program_manager">
                          <BarChart size={16} aria-hidden="true" />
                          <span className="truncate">Program Manager</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First name</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onUpdate={setFirstName}
                        disabled={loading}
                        autoComplete="given-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last name</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onUpdate={setLastName}
                        disabled={loading}
                        autoComplete="family-name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={username}
                      onUpdate={setUsername}
                      disabled={loading}
                      autoComplete="username"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email address</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@organization.com"
                      value={email}
                      onUpdate={setEmail}
                      disabled={loading}
                      autoComplete="email"
                    />
                  </div>

                  {!workosEnabled ? (
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      data-testid="password-input"
                      type="password"
                      value={password}
                      onUpdate={setPassword}
                      disabled={loading}
                      autoComplete="new-password"
                    />
                  </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Create your account with a secure email link. Organization setup
                      follows immediately after verification.
                    </p>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="terms"
                      checked={termsAccepted}
                      onCheckedChange={(v) => setTermsAccepted(v === true)}
                    />
                    <label htmlFor="terms" className="text-sm text-muted-foreground">
                      I agree to the{" "}
                      <button
                        type="button"
                        className="text-primary hover:underline"
                        onClick={(e) => e.preventDefault()}
                      >
                        Terms
                      </button>{" "}
                      and{" "}
                      <button
                        type="button"
                        className="text-primary hover:underline"
                        onClick={(e) => e.preventDefault()}
                      >
                        Conditions
                      </button>
                    </label>
                  </div>

                  {errorMsg && (
                    <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                      {errorMsg}
                    </p>
                  )}

                  <Button
                    className="w-full bg-primary text-primary-foreground"
                    type="submit"
                    disabled={loading}
                    data-testid="login-submit"
                    loading={loading}
                  >
                    {workosEnabled ? "Create account with email" : "Create free account"}
                  </Button>
                </CardContent>
              </form>
              <CardFooter className="flex justify-center border-t !py-4">
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => switchMode("signin")}
                  >
                    Sign in
                  </button>
                </p>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
