import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if the URL has ?verified=true
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.get("verified") === "true") {
      setSuccess("Email verified successfully! You can now log in to your account.");
    }
  }, [location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(""); // Clear error on edit
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email.trim() || !formData.password) {
      setError("All fields are required");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to log in");
      }

      // If successful, update global auth state and navigate to Dashboard
      login(data.user);
      navigate("/");
    } catch (err) {
      // If error indicates email is not verified, show a helpful custom message
      if (err.message.toLowerCase().includes("verify email") || err.message.toLowerCase().includes("loggin")) {
        setError("Please verify your email before logging in. Check your inbox for the verification link.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-tr from-blue-200 via-indigo-100 to-purple-200 flex items-center justify-center p-4 md:p-10 font-sans relative overflow-hidden">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-blue-300 opacity-40 blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-purple-300 opacity-40 blur-3xl"></div>

      {/* Main Container Card */}
      <div className="relative z-10 w-full max-w-6xl bg-white/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 overflow-hidden flex flex-col md:flex-row min-h-[600px]">

        {/* Left Section: Branding & Info */}
        <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-between text-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/30">
              P
            </div>
            <span className="font-extrabold text-2xl tracking-wider text-slate-900">Perplex</span>
          </div>

          <div className="my-auto py-12 md:py-0">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 leading-tight mb-4">
              Fast, Efficient <br />
              <span className="text-blue-600">and Productive</span>
            </h1>
            <p className="text-slate-600 max-w-md text-base md:text-lg leading-relaxed">
              Ask questions, discover insights, and find the answers you need instantly. Powered by smart semantic search.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200/50 pt-6">

            <div className="flex gap-4 text-xs font-semibold text-blue-600">
              <a href="#" className="hover:underline">Terms</a>
              <a href="#" className="hover:underline">Plans</a>
              <a href="#" className="hover:underline">Contact Us</a>
            </div>
          </div>
        </div>

        {/* Right Section: Form Card */}
        <div className="w-full md:w-1/2 p-4 md:p-8 flex items-center justify-center">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-100 flex flex-col justify-center">

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Sign In</h2>
              <p className="text-slate-400 text-sm mt-1">Access your Perplex account</p>
            </div>

            {/* Success Verification Alert */}
            {success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl mb-4 text-xs font-semibold flex items-start gap-2 leading-normal">
                <span className="text-sm mt-0.5">✅</span>
                <span>{success}</span>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4 text-xs font-semibold flex items-start gap-2 leading-normal">
                <span className="text-sm mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. user@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white text-sm transition-all"
                  required
                />
              </div>

              {/* Password Field */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white text-sm transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.815 7.815L21 21m-3.95-3.95-3.686-3.686m0-3.686a3 3 0 0 0-4.299 4.299M9 9l3 3" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-center shadow-lg shadow-blue-500/20 transition-all hover:translate-y-[-1px] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed pt-2"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>

            <div className="text-center mt-8 text-sm text-slate-500">
              Don't have an account?{" "}
              <Link to="/signup" className="text-blue-600 font-semibold hover:underline">
                Sign Up
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;