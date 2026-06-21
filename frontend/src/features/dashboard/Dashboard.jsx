import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router";
import { useAuth } from "../auth/context/AuthContext";
import { useChat } from "../hooks/useChat";
import logo from "../../assets/logo.png";
import fav from "../../../public/fav.png";
const getChatId = (chat) => chat?._id || chat?.id;

const createLocalMessage = (role, content) => ({
  _id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  role,
  content,
});

const sidebarNavItems = [
  {
    label: "Home",
    shortLabel: "H",
    to: "/",
  },
];

const SUGGESTED_PROMPTS = [
  {
    title: "Explain Quantum Physics",
    desc: "Explain quantum computing in simple terms for a beginner",
    prompt: "Explain quantum computing in simple terms for a beginner",
  },
  {
    title: "Write React Component",
    desc: "Write a React component with Tailwind CSS for a hero section",
    prompt: "Write a React component with Tailwind CSS for a hero section",
  },
  {
    title: "Draft Copy",
    desc: "Draft a professional email asking for a project deadline extension",
    prompt:
      "Draft a professional email asking for a project deadline extension",
  },
  {
    title: "Brainstorm SaaS Ideas",
    desc: "List 5 unique marketing ideas for a micro-SaaS platform",
    prompt: "List 5 unique marketing ideas for a micro-SaaS platform",
  },
];

const readStoredDashboardState = (storageKey) => {
  try {
    const savedState = JSON.parse(localStorage.getItem(storageKey) || "{}");

    return {
      chats: Array.isArray(savedState.chats) ? savedState.chats : [],
      messagesByChat: savedState.messagesByChat || {},
      activeChatId: savedState.activeChatId || null,
    };
  } catch (err) {
    console.error("Failed to load dashboard state:", err);
    return {
      chats: [],
      messagesByChat: {},
      activeChatId: null,
    };
  }
};

const Dashboard = () => {
  const chat = useChat();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const storageKey = useMemo(() => {
    const userKey = user?._id || user?.id || user?.email || "guest";
    return `perplex-dashboard:${userKey}`;
  }, [user]);
  const initialDashboardState = useMemo(
    () => readStoredDashboardState(storageKey),
    [storageKey],
  );
  const [chats, setChats] = useState(() => initialDashboardState.chats);
  const [activeChatId, setActiveChatId] = useState(
    () => initialDashboardState.activeChatId,
  );
  const [messagesByChat, setMessagesByChat] = useState(
    () => initialDashboardState.messagesByChat,
  );
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState("");

  // Responsive UI States
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const activeMessages = activeChatId
    ? messagesByChat[activeChatId] || []
    : messagesByChat["pending-chat"] || [];

  useEffect(() => {
    const socket = chat.initialiseSocketConnection();
    return () => socket?.disconnect();
  }, [chat]);

  useEffect(() => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({ chats, messagesByChat, activeChatId }),
    );
  }, [activeChatId, chats, messagesByChat, storageKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages.length, isSending]);

  const hydrateChatMessages = async (chatId) => {
    if (!chatId || messagesByChat[chatId]?.length) return;

    setIsLoadingMessages(true);
    setError("");

    try {
      const response = await fetch(`/api/messages/${chatId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load this chat.");
      }

      setMessagesByChat((current) => ({
        ...current,
        [chatId]: data.messages || [],
      }));
    } catch (err) {
      setError(err.message || "Unable to load this chat.");
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId);
    hydrateChatMessages(chatId);
  };

  const handleNewChat = () => {
    setActiveChatId(null);
    setDraft("");
    setError("");
    setMessagesByChat((current) => {
      const next = { ...current };
      delete next["pending-chat"];
      return next;
    });
  };

  const handleDeleteChat = (chatId) => {
    setChats((current) => current.filter((item) => getChatId(item) !== chatId));
    setMessagesByChat((current) => {
      const next = { ...current };
      delete next[chatId];
      return next;
    });
    if (activeChatId === chatId) {
      setActiveChatId(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const message = draft.trim();
    if (!message || isSending) return;

    const pendingChatId = activeChatId || "pending-chat";
    const localUserMessage = createLocalMessage("user", message);

    setDraft("");
    setError("");
    setIsSending(true);
    setMessagesByChat((current) => ({
      ...current,
      [pendingChatId]: [...(current[pendingChatId] || []), localUserMessage],
    }));

    try {
      const response = await fetch("/api/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          ...(activeChatId ? { chat: activeChatId } : {}),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "The chat request failed.");
      }

      const serverChatId = getChatId(data.chat);
      const nextMessages = [
        data.humanMessage || localUserMessage,
        data.aiMessage || createLocalMessage("ai", data.response || ""),
      ].filter((item) => item?.content);

      setActiveChatId(serverChatId);
      setMessagesByChat((current) => {
        const cleaned = { ...current };
        const existingMessages = activeChatId
          ? current[activeChatId] || []
          : [];

        delete cleaned["pending-chat"];

        return {
          ...cleaned,
          [serverChatId]: activeChatId
            ? [
                ...existingMessages.filter(
                  (item) => item._id !== localUserMessage._id,
                ),
                ...nextMessages,
              ]
            : nextMessages,
        };
      });

      setChats((current) => {
        const existing = current.filter(
          (item) => getChatId(item) !== serverChatId,
        );
        const chatTitle =
          data.chat?.title || data.title || message.slice(0, 48);

        return [
          {
            ...data.chat,
            _id: serverChatId,
            title: chatTitle,
            updatedAt: new Date().toISOString(),
            preview: data.response || message,
          },
          ...existing,
        ];
      });
    } catch (err) {
      setError(
        err.message || "Something went wrong while sending the message.",
      );
      setMessagesByChat((current) => ({
        ...current,
        [pendingChatId]: (current[pendingChatId] || []).filter(
          (item) => item._id !== localUserMessage._id,
        ),
      }));
    } finally {
      setIsSending(false);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        console.error("Logout request failed");
      }
    } catch (err) {
      console.error("Error during logout:", err);
    } finally {
      logout();
      navigate("/login");
    }
  };

  // Reusable Sidebar Content Component
  const renderSidebarContent = (isMobile = false) => {
    return (
      <div className="flex h-full flex-col bg-white">
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 shrink-0">
          <img src={logo} alt="Perplex" className="h-9 w-auto object-contain" />
          {isMobile ? (
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 md:hidden"
              title="Close sidebar"
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => setIsSidebarCollapsed(true)}
              className="hidden md:inline-flex p-1.5 rounded-lg text-slate-400 hover:text-slate-650 hover:bg-slate-100"
              title="Collapse sidebar"
            >
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
                  d="M15.75 19.5L8.25 12l7.5-7.5"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Sidebar Scroll Container */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          <nav className="space-y-1" aria-label="Primary navigation">
            {sidebarNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                title={item.label}
                className={({ isActive }) =>
                  `flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-cyan-50 text-cyan-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`
                }
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold">
                  {item.shortLabel}
                </span>
                <span className="truncate">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="space-y-1">
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Chat history
            </p>

            {chats.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-4 text-xs text-slate-400 text-center leading-normal">
                Saved chats appear here after you ask a question.
              </div>
            ) : (
              <div className="space-y-1.5">
                {chats.map((item) => {
                  const chatId = getChatId(item);
                  const isActive = chatId === activeChatId;

                  return (
                    <div key={chatId} className="group relative">
                      <button
                        onClick={() => {
                          handleSelectChat(chatId);
                          if (isMobile) setIsMobileSidebarOpen(false);
                        }}
                        title={item.title || "New chat"}
                        className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-250 ${
                          isActive
                            ? "bg-slate-900 text-white shadow-sm"
                            : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                      >
                        <div className="min-w-0 flex-1 pr-6">
                          <span
                            className={`block truncate text-sm font-semibold ${isActive ? "text-white" : "text-slate-800"}`}
                          >
                            {item.title || "New chat"}
                          </span>
                          <span
                            className={`mt-0.5 block truncate text-xs ${isActive ? "text-slate-300" : "text-slate-450"}`}
                          >
                            {item.preview || "Open conversation"}
                          </span>
                        </div>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChat(chatId);
                        }}
                        title="Delete chat"
                        className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 transition-all duration-150 ${
                          isActive
                            ? "text-slate-400 hover:text-red-200 hover:bg-slate-800"
                            : "text-slate-400"
                        }`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.8}
                          stroke="currentColor"
                          className="w-3.5 h-3.5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                          />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="border-t border-slate-200 p-4 shrink-0">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-100 text-sm font-bold text-cyan-700 shadow-inner">
              {user?.username ? user.username.slice(0, 2).toUpperCase() : "U"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">
                {user?.username || "User"}
              </p>
              <p className="truncate text-xs text-slate-400">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition-all duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
              />
            </svg>
            Sign out
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-screen bg-slate-50 font-sans text-slate-900 overflow-hidden flex relative">
      {/* 1. Mobile Sidebar Drawer Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* 2. Mobile Sidebar Drawer Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transform ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out md:hidden`}
      >
        {renderSidebarContent(true)}
      </aside>

      {/* 3. Desktop/Tablet Sidebar (Collapsible) */}
      <aside
        className={`hidden md:flex flex-col border-r border-slate-200 bg-white h-screen shrink-0 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? "w-0 overflow-hidden border-r-0" : "w-72"
        }`}
      >
        {!isSidebarCollapsed && renderSidebarContent(false)}
      </aside>

      {/* 4. Main Panel */}
      <div className="flex flex-1 flex-col h-screen overflow-hidden min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/85 backdrop-blur-md px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-3">
            {/* Hamburger Toggle (Mobile Only) */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg md:hidden"
              title="Open menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </button>

            {/* Sidebar Toggle (Desktop/Tablet Only) */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden md:inline-flex items-center justify-center p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-lg"
              title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
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
                  d="M9 4.5v15m6-15v15m-12-15h18a2.25 2.25 0 012.25 2.25v13.5a2.25 2.25 0 01-2.25 2.25h-18A2.25 2.25 0 011.5 18V6.75A2.25 2.25 0 013.75 4.5z"
                />
              </svg>
            </button>

            <div>
              <h1 className="text-sm font-bold text-slate-800 md:text-base truncate max-w-[180px] sm:max-w-[300px] md:max-w-md">
                {activeChatId
                  ? chats.find((c) => getChatId(c) === activeChatId)?.title ||
                    "Chat"
                  : `Welcome back, ${user?.username || "there"}`}
              </h1>
            </div>
          </div>

          <button
            onClick={handleNewChat}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            <span className="hidden sm:inline">New chat</span>
          </button>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden relative bg-slate-50">
          {/* Scrollable Message viewport */}
          <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 pb-36">
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-xs flex items-start gap-2 animate-fade-in">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {isLoadingMessages && (
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-xs flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4 text-cyan-600"
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
                  <span>Loading chat history...</span>
                </div>
              )}

              {activeMessages.length === 0 && !isLoadingMessages ? (
                /* Empty state screen */
                <div className="flex min-h-[50vh] flex-col items-center justify-center text-center px-4 py-12">
                  <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl md:text-5xl">
                    What should we explore?
                  </h2>
                  <p className="mt-4 max-w-lg text-sm sm:text-base leading-relaxed text-slate-505 text-slate-500">
                    Ask a question or select a topic below to start a
                    conversation.
                  </p>

                  {/* Suggested Prompts Grid */}
                  <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
                    {SUGGESTED_PROMPTS.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setDraft(item.prompt);
                        }}
                        className="flex flex-col items-start rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-cyan-500 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer"
                      >
                        <span className="text-sm font-bold text-slate-800 group-hover:text-cyan-600 transition-colors">
                          {item.title}
                        </span>
                        <span className="mt-1 text-xs text-slate-400 line-clamp-1">
                          {item.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Message List */
                <div className="space-y-6">
                  {activeMessages.map((message) => {
                    const isUser = message.role === "user";

                    return (
                      <div
                        key={message._id}
                        className={`flex ${isUser ? "justify-end" : "justify-start"} w-full`}
                      >
                        {isUser ? (
                          <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl bg-slate-900 text-white px-4 py-3 text-sm leading-relaxed shadow-sm">
                            {message.content}
                          </div>
                        ) : (
                          <div className="flex gap-4 w-full items-start">
                            <div className="flex h-8 w-15 shrink-0 select-none items-center justify-center rounded-lg">
                              <img src={fav} alt="" srcset="" />
                            </div>
                            <div className="flex-1 min-w-0 text-slate-800 text-sm leading-relaxed pt-1 whitespace-pre-wrap">
                              {message.content}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {isSending && (
                <div className="flex justify-start w-full">
                  <div className="flex gap-4 w-full items-start">
                    <div className="flex h-8 w-15 shrink-0 select-none items-center justify-center rounded-lg">
                      <img src={fav} alt="" srcset="" />
                    </div>
                    <div className="flex items-center gap-1.5 pt-3">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]"></span>
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]"></span>
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"></span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Panel pinned at the bottom */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent pt-12 pb-6 px-4 md:px-8 shrink-0">
            <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
              <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-md focus-within:border-cyan-500 focus-within:ring-4 focus-within:ring-cyan-50 transition-all duration-200">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleSubmit(event);
                    }
                  }}
                  rows={1}
                  placeholder="Ask Perplex anything..."
                  className="max-h-36 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || isSending}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-600 text-white transition-all hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 shadow-sm"
                >
                  {isSending ? (
                    <svg
                      className="animate-spin h-5 w-5"
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
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.2}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
