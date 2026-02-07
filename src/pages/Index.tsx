import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import yanguLogo from "@/assets/yangu-logo.png";

const Index = () => {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (error) {
        toast.error("Failed to sign in with Google");
        console.error("Google OAuth error:", error);
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
      console.error("Google OAuth error:", err);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 sm:p-10 md:pt-12 md:pb-10 md:px-10 overflow-hidden">
        {/* Top gradient accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500" />

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img
            src={yanguLogo}
            alt="YANGU Logo"
            className="h-20 w-20 sm:h-24 sm:w-24 rounded-full shadow-lg ring-4 ring-white/50 object-cover"
          />
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Welcome to YANGU
          </h1>
          <p className="text-slate-500 text-sm sm:text-base font-medium mt-2">
            Sign in to continue
          </p>
        </div>

        {/* Social Buttons */}
        <div className="space-y-3 mb-6">
          {/* Google */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-auto py-3.5 px-5 rounded-xl border border-slate-200 bg-white text-slate-700 text-[16px] font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
          >
            <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {isGoogleLoading ? "Signing in..." : "Continue with Google"}
          </Button>

          {/* Microsoft */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-auto py-3.5 px-5 rounded-xl border border-slate-200 bg-white text-slate-700 text-[16px] font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors"
            asChild
          >
            <Link to="/login">
              <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
                <path fill="#F25022" d="M1 1h10v10H1z" />
                <path fill="#00A4EF" d="M1 13h10v10H1z" />
                <path fill="#7FBA00" d="M13 1h10v10H13z" />
                <path fill="#FFB900" d="M13 13h10v10H13z" />
              </svg>
              Continue with Microsoft
            </Link>
          </Button>

          {/* Facebook */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-auto py-3.5 px-5 rounded-xl border border-slate-200 bg-white text-slate-700 text-[16px] font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors"
            asChild
          >
            <Link to="/login">
              <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="#1877F2"
                  d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                />
              </svg>
              Continue with Facebook
            </Link>
          </Button>
        </div>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-4 text-xs uppercase text-slate-400 font-medium tracking-wider">
              OR
            </span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium text-slate-700">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 sm:h-12 pl-10 pr-4 bg-slate-50/50 border border-slate-200 rounded-xl placeholder:text-slate-400 focus:border-slate-300 focus:ring-slate-300"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-medium text-slate-700">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 sm:h-12 pl-10 pr-4 bg-slate-50/50 border border-slate-200 rounded-xl placeholder:text-slate-400 focus:border-slate-300 focus:ring-slate-300"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-11 sm:h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl transition-colors"
            asChild
          >
            <Link to="/login">Sign In</Link>
          </Button>
        </form>

        {/* Footer Links */}
        <div className="mt-6 text-center text-sm text-slate-500 space-y-2">
          <div>
            <Link
              to="/reset-password"
              className="text-slate-700 hover:text-slate-900 font-medium transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div>
            Need an account?{" "}
            <Link
              to="/signup"
              className="text-slate-700 hover:text-slate-900 font-medium transition-colors"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
