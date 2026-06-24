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
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface LoginCardSectionProps {
  onLogin: () => void;
  onTryNewCompany?: () => void;
}

export default function LoginCardSection({ onLogin, onTryNewCompany }: LoginCardSectionProps) {
  const [showPassword, setShowPassword] = useState(false);
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
      <header className="absolute left-0 right-0 top-0 flex items-center justify-between px-6 py-4 border-b border-border/40 bg-card/65 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <img src="/avarent-logo.png" alt="Avarent" className="h-[84px] w-auto" />
        </div>
        {onTryNewCompany && (
          <Button
            variant="outline"
            onClick={onTryNewCompany}
            className="h-8 rounded-lg border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground font-mono text-[0.7rem] uppercase tracking-wider transition-colors"
          >
            <span className="mr-2">Demo Request</span>
            <ArrowRight className="h-3.5 w-3.5" />
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
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Access Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  data-testid="password-input"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
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

            <Button type="submit" disabled={loading} data-testid="login-submit" className="w-full">
              {loading ? "Authorizing..." : mode === "signin" ? "Sign In" : "Register Control Account"}
            </Button>

            <Separator />

            <div className="text-center bg-muted rounded-lg p-2.5">
              <p className="text-[10px] text-muted-foreground font-mono">
                System requires secure WorkOS / Supabase credentials.
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
