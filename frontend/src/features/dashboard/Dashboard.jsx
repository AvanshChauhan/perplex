import React from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../auth/context/AuthContext";
import { useChat } from "../hooks/useChat";
import { useEffect } from "react";
const Dashboard = () => {
  const chat =useChat()
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  useEffect(()=>{
    chat.initialiseSocketConnection()
  },[])
  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        logout();
        navigate("/login");
      } else {
        console.error("Logout request failed");
        // Clear local state anyway
        logout();
        navigate("/login");
      }
    } catch (err) {
      console.error("Error during logout:", err);
      logout();
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen w-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Top Navbar */}
      <header className="h-16 px-6 md:px-12 bg-white border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md">
            P
          </div>
          <span className="font-bold text-lg text-slate-900 tracking-wide">Perplex</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-sm font-semibold text-slate-800">{user?.username}</span>
            <span className="text-xs text-slate-400">{user?.email}</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-200">
            {user?.username ? user.username.slice(0, 2).toUpperCase() : "U"}
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Panel Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 max-w-4xl mx-auto w-full pb-20">
        
        {/* Greetings */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight">
            Welcome back, <span className="text-blue-600">{user?.username}</span>!
          </h2>
          <p className="text-slate-500 mt-2 text-sm md:text-base">
            What would you like to search or understand today?
          </p>
        </div>

        {/* AI Search Box Bar */}
        <div className="w-full bg-white rounded-2xl shadow-xl border border-slate-200/80 p-2 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all flex flex-col gap-2">
          <div className="flex items-center gap-3 px-3 py-2">
            <span className="text-slate-400 text-lg">🔍</span>
            <input
              type="text"
              placeholder="Ask Perplex anything..."
              className="flex-1 text-slate-800 placeholder-slate-400 focus:outline-none text-base bg-transparent"
            />
            <button className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors cursor-pointer flex items-center gap-1">
              <span>Ask</span>
              <span>→</span>
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-2 px-3 pb-1 text-xs text-slate-400">
            {/* <div className="flex gap-3">
              <span className="hover:text-slate-600 cursor-pointer">🌐 Focus (All)</span>
              <span className="hover:text-slate-600 cursor-pointer">📎 Attach</span>
            </div>
            <span>Pro is active</span> */}
          </div>
        </div>

        {/* Suggested Queries Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-10">
          {/* <div className="p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-300 transition-all cursor-pointer group">
            <h4 className="font-semibold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">
              Compare React 19 vs React 18 key changes
            </h4>
            <p className="text-xs text-slate-450 mt-1">
              Read summary on Server Components, actions, and compiler upgrades.
            </p>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-300 transition-all cursor-pointer group">
            <h4 className="font-semibold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">
              Explain CSS grid vs flexbox layouts
            </h4>
            <p className="text-xs text-slate-450 mt-1">
              Analyze when to use grid templates and when to stack columns.
            </p>
          </div> */}
        </div>

      </main>
    </div>
  );
};

export default Dashboard;
