import React, { useState } from "react";
import { Link } from "react-router";
import logo from "../../../assets/logo.png";
const Signup = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(""); // Clear error on edit
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.username.trim() ||
      !formData.email.trim() ||
      !formData.password
    ) {
      setError("All fields are required");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (!acceptedTerms) {
      setError("You must accept the Terms and Conditions");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      // Show the verification success screen
      setRegisteredEmail(formData.email);
    } catch (err) {
      setError(err.message);
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
      <div className="relative z-10 w-full max-w-6xl bg-white/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 overflow-hidden flex flex-col md:flex-row min-h-[650px]">
        {/* Left Section: Branding & Info */}
        <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-between text-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-40 h-10 rounded-xl flex items-center justify-center ">
              <span className="">
                <img src={logo} />
              </span>
            </div>
            {/* <span className="font-extrabold text-2xl tracking-wider text-slate-900">Perplex</span> */}
          </div>

          <div className="my-auto py-12 md:py-0">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 leading-tight mb-4">
              Fast, Efficient <br />
              <span className="text-blue-600">and Productive</span>
            </h1>
            <p className="text-slate-600 max-w-md text-base md:text-lg leading-relaxed">
              Ask questions, discover insights, and find the answers you need
              instantly. Powered by smart semantic search.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200/50 pt-6">
            <div className="flex gap-4 text-xs font-semibold text-blue-600">
              <button
                type="button"
                onClick={() => setShowTermsModal(true)}
                className="hover:underline cursor-pointer"
              >
                Terms
              </button>
              <a href="#" className="hover:underline">
                Plans
              </a>
              <a href="#" className="hover:underline">
                Contact Us
              </a>
            </div>
          </div>
        </div>

        {/* Right Section: Form Card */}
        <div className="w-full md:w-1/2 p-4 md:p-8 flex items-center justify-center">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-100 flex flex-col justify-center">
            {registeredEmail ? (
              /* Verification Email Sent Screen */
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner animate-bounce">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-10 h-10"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-850 mb-2">
                  Verify Your Email
                </h2>
                <p className="text-slate-500 mb-6 text-sm">
                  We've sent an activation link to <br />
                  <strong className="text-slate-800">{registeredEmail}</strong>
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left mb-6">
                  <p className="text-xs text-amber-800 leading-normal">
                    💡 <strong>Important:</strong> You must click the
                    verification link in the email before you can log in. If you
                    don't see it, check your spam folder.
                  </p>
                </div>
                <Link
                  to="/login"
                  className="inline-block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-center shadow-lg shadow-blue-500/20 transition-all hover:translate-y-[-1px]"
                >
                  Go to Login
                </Link>
              </div>
            ) : (
              /* Signup Form */
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Sign Up</h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Create your Perplex account
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4 text-xs font-semibold flex items-center gap-2">
                    <span>⚠️</span>
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Username Field */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="e.g. johndoe"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white text-sm transition-all"
                      required
                    />
                  </div>

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
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Password
                    </label>
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
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.815 7.815L21 21m-3.95-3.95-3.686-3.686m0-3.686a3 3 0 0 0-4.299 4.299M9 9l3 3"
                            />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Use 6 or more characters with a mix of letters & numbers.
                    </span>
                  </div>

                  {/* Accept Terms Checkbox */}
                  <div className="flex items-start gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={acceptedTerms}
                      onChange={(e) => {
                        setAcceptedTerms(e.target.checked);
                        setError("");
                      }}
                      className="w-4 h-4 mt-0.5 text-blue-600 bg-slate-50 border-slate-200 rounded focus:ring-blue-500 cursor-pointer"
                    />
                    <label
                      htmlFor="terms"
                      className="text-xs text-slate-500 cursor-pointer select-none leading-normal"
                    >
                      I accept the{" "}
                      <button
                        type="button"
                        onClick={() => setShowTermsModal(true)}
                        className="text-blue-600 hover:underline font-semibold cursor-pointer"
                      >
                        Terms & Conditions
                      </button>{" "}
                      (which I definitely didn't read, but I agree to sell my
                      soul to Perplex)
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-center shadow-lg shadow-blue-500/20 transition-all hover:translate-y-[-1px] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      "Sign Up"
                    )}
                  </button>
                </form>

                <div className="text-center mt-6 text-sm text-slate-500">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    Sign In
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-slate-900">
                Perplex terms_of_service_v9.js
              </h3>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="text-xs text-slate-500 space-y-3 max-h-60 overflow-y-auto pr-2 leading-relaxed">
              <p className="font-semibold text-slate-800">
                1. Intellectual Thought Harvesting
              </p>
              <p>
                By registering, you hereby grant Perplex the unlimited,
                royalty-free, cosmic right to scan your thoughts, analyze your
                late-night coding queries, and use them to feed our giant
                electronic brains. If you think it, we own it.
              </p>

              <p className="font-semibold text-slate-800">
                2. Liability (or Lack Thereof)
              </p>
              <p>
                If our AI asserts with absolute certainty that 1 + 1 = 3, or
                insults your choice of programming language, you agree that you
                are wrong, not the AI. We assume zero responsibility for
                emotional distress caused by synthetic sarcasm.
              </p>

              <p className="font-semibold text-slate-800">
                3. Cookie Policy & soul.cookie
              </p>
              <p>
                We use cookies to improve your search. We also use cookie crumbs
                to track your movements in physical reality. By continuing, you
                agree to buy our developers a real chocolate chip cookie if you
                ever meet them in person.
              </p>

              <p className="font-semibold text-slate-800">
                4. General Gibberish
              </p>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat. Blah blah blah legal
                jargon. You agree, ok?
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setAcceptedTerms(true);
                setShowTermsModal(false);
              }}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-center shadow-lg shadow-blue-500/20 transition-all text-sm cursor-pointer"
            >
              I Promise I Read This & Agree
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Signup;
