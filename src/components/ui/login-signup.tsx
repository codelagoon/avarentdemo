"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Envelope, Key } from "@gravity-ui/icons";
import { Icon, PasswordInput } from "@gravity-ui/uikit";
import { supabase } from "@/lib/supabaseClient";

interface LoginCardSectionProps {
  onLogin: () => void;
  onTryNewCompany?: () => void;
}

export default function LoginCardSection({ onLogin, onTryNewCompany }: LoginCardSectionProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Secret key sequence: type "avarent" to trigger demo onboarding
  useEffect(() => {
    if (!onTryNewCompany) return;
    let buffer = "";
    const target = "avarent";
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      buffer += e.key.toLowerCase();
      if (buffer.length > target.length) buffer = buffer.slice(-target.length);
      if (buffer === target) {
        onTryNewCompany();
        buffer = "";
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onTryNewCompany]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // E2E Test Suite Bypass / Demo Check — triggers onboarding instead of direct login
    if (password === "197704") {
      if (rememberMe) {
        localStorage.setItem("avarent_auth", "demo")
      }
      if (onTryNewCompany) {
        onTryNewCompany();
      } else {
        onLogin();
      }
      return;
    }

    if (!email) {
      setErrorMsg("Please enter an email address.");
      return;
    }
    if (!password) {
      setErrorMsg("Please enter a password.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onLogin();
      } else {
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        if (data.session) {
          onLogin();
        } else {
          setErrorMsg("Account created! Please check your email to verify your address.");
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center" data-testid="login-screen">
      {/* Header */}
      <header className="absolute left-0 right-0 top-0 flex items-center justify-between border-b border-border bg-card px-6 py-4">
        <div className="flex items-center gap-2">
          <img src="/avarent-logo.png" alt="Avarent" className="h-[84px] w-auto" />
        </div>
        {onTryNewCompany && (
          <Button
            variant="outline"
            onClick={onTryNewCompany}
            className="h-8 g-text-caption uppercase tracking-wider"
          >
            <span className="mr-2">Demo Request</span>
            <Icon data={ArrowRight} size={14} />
          </Button>
        )}
      </header>

      <Card className="w-full max-w-sm border-border shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl">
            {mode === "signin" ? "Welcome back" : "Create account"}
          </CardTitle>
          <CardDescription>
            {mode === "signin"
              ? "Sign in to monitor regulatory compliance dashboard"
              : "Register a new credit compliance control account"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onUpdate={setEmail}
                disabled={loading}
                startContent={<Icon data={Envelope} size={16} />}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Access Password</Label>
              <PasswordInput
                id="password"
                data-testid="password-input"
                placeholder="••••••••"
                value={password}
                onUpdate={setPassword}
                disabled={loading}
                startContent={<Icon data={Key} size={16} />}
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-destructive border border-destructive/20 bg-destructive/10 px-3 py-2 rounded-md">
                {errorMsg}
              </p>
            )}

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(v) => setRememberMe(v === true)}
                />
                <Label htmlFor="remember" className="text-muted-foreground cursor-pointer">
                  Keep me signed in
                </Label>
              </div>
              <a href="#" onClick={(e) => e.preventDefault()} className="text-muted-foreground hover:text-foreground hover:underline transition-colors text-xs">
                Forgot password?
              </a>
            </div>

            <Button type="submit" disabled={loading} data-testid="login-submit" className="w-full" loading={loading}>
              {mode === "signin" ? "Sign In" : "Register Control Account"}
            </Button>

            <Separator />

            <div className="text-center bg-muted rounded-lg p-2.5">
              <p className="text-[10px] text-muted-foreground font-mono">
                Demo code: <span className="text-primary font-bold">197704</span>
              </p>
            </div>
          </CardContent>
        </form>
        <CardFooter className="flex justify-center text-xs text-muted-foreground">
          {mode === "signin" ? "New to Meridian?" : "Already configured?"}
          <button
            onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setErrorMsg(null); }}
            className="ml-1 text-primary hover:underline font-bold"
          >
            {mode === "signin" ? "Register" : "Sign In"}
          </button>
        </CardFooter>
      </Card>
    </div>
  );
}
