import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router";
import { useAuth } from "../auth/context/AuthContext";
import { useChat } from "../hooks/useChat";
import logo from "../../assets/logo.png";

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
    const userKey = user?._id || user?.email || "guest";
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
        const existingMessages = activeChatId ? current[activeChatId] || [] : [];

        delete cleaned["pending-chat"];

        return {
          ...cleaned,
          [serverChatId]: activeChatId
            ? [
                ...existingMessages.filter((item) => item._id !== localUserMessage._id),
                ...nextMessages,
              ]
            : nextMessages,
        };
      });

      setChats((current) => {
        const existing = current.filter((item) => getChatId(item) !== serverChatId);
        const chatTitle = data.chat?.title || data.title || message.slice(0, 48);

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
      setError(err.message || "Something went wrong while sending the message.");
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

  return (
    <div className="min-h-screen w-screen bg-slate-50 font-sans text-slate-900 lg:flex">
      <aside className="flex w-full flex-col border-r border-slate-200 bg-white lg:fixed lg:inset-y-0 lg:left-0 lg:w-72">
        <div className="flex h-16 items-center justify-between gap-2 border-b border-slate-200 px-4">
          <img
            src={logo}
            alt="Perplex"
            className="h-10 w-auto object-contain"
          />
          <button
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            onClick={handleNewChat}
          >
            New
          </button>
        </div>

        <div className="max-h-72 flex-1 overflow-y-auto p-3 lg:max-h-none">
          <nav className="mb-4 space-y-1" aria-label="Primary navigation">
            {sidebarNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                title={item.label}
                className={({ isActive }) =>
                  `flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-cyan-50 text-cyan-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`
                }
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold">
                  {item.shortLabel}
                </span>
                <span className="truncate">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Chat history
          </p>

          {chats.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              Your saved chats will appear here after you ask your first question.
            </div>
          ) : (
            <div className="space-y-1">
              {chats.map((item) => {
                const chatId = getChatId(item);
                const isActive = chatId === activeChatId;

                return (
                  <button
                    key={chatId}
                    onClick={() => handleSelectChat(chatId)}
                    title={item.title || "New chat"}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition ${
                      isActive
                        ? "bg-slate-900 text-white"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">
                        {item.title || "New chat"}
                      </span>
                      <span
                        className={`mt-1 block truncate text-xs ${
                          isActive ? "text-slate-300" : "text-slate-400"
                        }`}
                      >
                        {item.preview || "Open conversation"}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-100 text-sm font-bold text-cyan-700">
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
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col lg:pl-72">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-base font-bold text-slate-900 md:text-lg">
                {activeChatId ? "Chat" : `Welcome back, ${user?.username || "there"}`}
              </h1>
              <p className="text-xs text-slate-500">
                Ask a question and the answer will be saved to your chat history.
              </p>
            </div>
          </div>
          <button
            onClick={handleNewChat}
            className="hidden rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 md:inline-flex"
          >
            New chat
          </button>
        </header>

        <main className="flex flex-1 flex-col overflow-hidden">
          <section className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {isLoadingMessages && (
                <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                  Loading this chat...
                </div>
              )}

              {activeMessages.length === 0 && !isLoadingMessages ? (
                <div className="flex min-h-[52vh] flex-col items-center justify-center text-center">
                  <h2 className="text-3xl font-extrabold text-slate-900 md:text-4xl">
                    What should we explore?
                  </h2>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 md:text-base">
                    Start a fresh question below. Once the AI responds, this conversation moves into the sidebar automatically.
                  </p>
                </div>
              ) : (
                activeMessages.map((message) => {
                  const isUser = message.role === "user";

                  return (
                    <div
                      key={message._id}
                      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[88%] whitespace-pre-wrap rounded-lg px-4 py-3 text-sm leading-6 shadow-sm md:max-w-[76%] ${
                          isUser
                            ? "bg-slate-900 text-white"
                            : "border border-slate-200 bg-white text-slate-800"
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  );
                })
              )}

              {isSending && (
                <div className="flex justify-start">
                  <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                    Thinking...
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </section>

          <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white p-4 md:p-5">
            <div className="mx-auto flex max-w-4xl items-end gap-3 rounded-lg border border-slate-200 bg-slate-50 p-2 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-100">
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
                className="max-h-36 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={!draft.trim() || isSending}
                className="h-11 rounded-lg bg-cyan-600 px-5 text-sm font-bold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isSending ? "Sending" : "Ask"}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
