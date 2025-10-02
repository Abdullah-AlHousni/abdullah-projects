import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation, useNavigate, type Location } from "react-router-dom";
import { login, signup, type LoginPayload, type SignupPayload } from "../api/auth";
import { useAuth } from "../hooks/useAuth";

const initialSignup: SignupPayload = {
  email: "",
  username: "",
  password: "",
  bio: "",
};

const initialLogin: LoginPayload = {
  emailOrUsername: "",
  password: "",
};

const credentialGuidelines = [
  "Use a valid email address (we'll use it for login).",
  "Pick a unique username between 3 and 24 characters (letters, numbers, underscores).",
  "Password must be at least 6 characters.",
];

const AuthPage = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [signupForm, setSignupForm] = useState(initialSignup);
  const [loginForm, setLoginForm] = useState(initialLogin);
  const { login: storeAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: Location } | null)?.from?.pathname ?? "/";

  const signupMutation = useMutation({
    mutationFn: signup,
    onSuccess: (data) => {
      storeAuth(data.token, data.user);
      navigate(redirectTo, { replace: true });
    },
  });

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      storeAuth(data.token, data.user);
      navigate(redirectTo, { replace: true });
    },
  });

  const handleSignupSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    signupMutation.mutate(signupForm);
  };

  const handleLoginSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    loginMutation.mutate(loginForm);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-slate-100 shadow-xl">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-primary">Chirp</h1>
          <p className="text-sm text-slate-400">
            {mode === "login" ? "Sign in to keep chirping" : "Create an account to start chirping"}
          </p>
        </header>

        {mode === "signup" && (
          <ul className="space-y-1 rounded-md border border-slate-700 bg-slate-900/80 p-3 text-left text-xs text-slate-300">
            {credentialGuidelines.map((tip) => (
              <li key={tip}>• {tip}</li>
            ))}
          </ul>
        )}

        {mode === "signup" ? (
          <form onSubmit={handleSignupSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm text-slate-300" htmlFor="signup-email">
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                required
                value={signupForm.email}
                onChange={(event) => setSignupForm((prev) => ({ ...prev, email: event.target.value }))}
                className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-3 py-2 focus:border-primary focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm text-slate-300" htmlFor="signup-username">
                Username
              </label>
              <input
                id="signup-username"
                required
                minLength={3}
                maxLength={24}
                value={signupForm.username}
                onChange={(event) => setSignupForm((prev) => ({ ...prev, username: event.target.value }))}
                className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-3 py-2 focus:border-primary focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm text-slate-300" htmlFor="signup-password">
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                required
                minLength={6}
                value={signupForm.password}
                onChange={(event) => setSignupForm((prev) => ({ ...prev, password: event.target.value }))}
                className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-3 py-2 focus:border-primary focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm text-slate-300" htmlFor="signup-bio">
                Bio
              </label>
              <textarea
                id="signup-bio"
                value={signupForm.bio}
                onChange={(event) => setSignupForm((prev) => ({ ...prev, bio: event.target.value }))}
                className="h-20 w-full rounded-md border border-slate-700 bg-slate-950/70 px-3 py-2 focus:border-primary focus:outline-none"
              />
            </div>
            {signupMutation.isError && (
              <p className="text-sm text-red-400">Unable to sign up. Please check the requirements and try again.</p>
            )}
            <button
              type="submit"
              className="w-full rounded-md bg-primary px-4 py-2 font-semibold text-white"
              disabled={signupMutation.isPending}
            >
              {signupMutation.isPending ? "Signing up..." : "Create account"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm text-slate-300" htmlFor="login-identifier">
                Email or username
              </label>
              <input
                id="login-identifier"
                required
                value={loginForm.emailOrUsername}
                onChange={(event) => setLoginForm((prev) => ({ ...prev, emailOrUsername: event.target.value }))}
                className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-3 py-2 focus:border-primary focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm text-slate-300" htmlFor="login-password">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                required
                value={loginForm.password}
                onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
                className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-3 py-2 focus:border-primary focus:outline-none"
              />
            </div>
            {loginMutation.isError && <p className="text-sm text-red-400">Invalid credentials</p>}
            <button
              type="submit"
              className="w-full rounded-md bg-primary px-4 py-2 font-semibold text-white"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Signing in..." : "Sign in"}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-slate-400">
          {mode === "login" ? (
            <>
              Need an account?{" "}
              <button type="button" className="text-primary" onClick={() => setMode("signup")}>
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button type="button" className="text-primary" onClick={() => setMode("login")}>
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
