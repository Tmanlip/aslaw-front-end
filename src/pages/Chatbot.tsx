import React, { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { resolveApiBaseUrl } from "../api/resolveApiBaseUrl";
import PATH from "../constant/paths";
import "./chatbot.css";

type RoleCategory = "civil" | "corporate" | "criminal" | "general";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  suggestedCategory?: RoleCategory;
  domainMismatch?: boolean;
};

type AskResponse = {
  sessionId: string;
  question: string;
  answer: string;
  category: RoleCategory;
  model: string;
  domainMismatch?: boolean;
  currentCategory?: RoleCategory | null;
  suggestedCategory?: RoleCategory | null;
};

const categoryOptions: RoleCategory[] = ["general", "civil", "corporate", "criminal"];

const ChatbotPage: React.FC = () => {
  const navigate = useNavigate();
  const apiBaseUrl = useMemo(() => resolveApiBaseUrl(), []);

  const [category, setCategory] = useState<RoleCategory>("general");
  const [question, setQuestion] = useState("");
  const [sessionId, setSessionId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hello. I am ASLAW chatbot. Ask your legal question and I will route to the right domain.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showIntroPanel, setShowIntroPanel] = useState(true);

  const sendQuestion = async (event: FormEvent) => {
    event.preventDefault();

    const trimmed = question.trim();
    if (!trimmed || loading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${apiBaseUrl}/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: trimmed,
          category,
          language: "auto",
          sessionId: sessionId || undefined,
          persist: true,
        }),
      });

      const rawBody = await response.text();
      let data: (Partial<AskResponse> & { error?: string }) | null = null;

      try {
        data = rawBody ? (JSON.parse(rawBody) as Partial<AskResponse> & { error?: string }) : null;
      } catch {
        data = null;
      }

      const answer = data?.answer;

      if (!response.ok || !answer) {
        if (!response.ok) {
          const messageFromJson = data?.error || "";
          const messageFromBody = rawBody ? rawBody.trim() : "";
          throw new Error(
            messageFromJson ||
              messageFromBody ||
              `Chatbot request failed with status ${response.status}.`
          );
        }

        throw new Error(data?.error || "Failed to get chatbot answer.");
      }

      if (data?.sessionId && !sessionId) {
        setSessionId(data.sessionId);
      }

      const assistantMessage: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        text: answer,
        suggestedCategory: data?.suggestedCategory ?? undefined,
        domainMismatch: Boolean(data?.domainMismatch),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Chatbot request failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot-page">
      <div className={`chatbot-layout ${showIntroPanel ? "with-intro" : "intro-collapsed"}`}>
        <div className="chatbot-shell">
          <div className="chatbot-header">
            <h1>ASLAW Chatbot</h1>
            <div className="chatbot-actions">
              <button type="button" className="secondary" onClick={() => navigate(PATH.AUTH.LOGIN)}>
                Login
              </button>
            </div>
          </div>

          <div className="chatbot-controls">
            <label htmlFor="category">Domain</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as RoleCategory)}
            >
              {categoryOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            {sessionId ? <span className="session-id">Session: {sessionId}</span> : null}
          </div>

          <div className="chatbot-messages">
            {messages.map((message) => (
              <div key={message.id} className={`bubble ${message.role}`}>
                {message.text}
                {message.role === "assistant" && message.domainMismatch && message.suggestedCategory ? (
                  <div className="chatbot-domain-switch-wrap">
                    <button
                      type="button"
                      className="chatbot-domain-switch-btn"
                      onClick={() => setCategory(message.suggestedCategory as RoleCategory)}
                    >
                      Switch to {message.suggestedCategory}
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
            {loading ? <div className="bubble assistant">Thinking...</div> : null}
          </div>

          <form className="chatbot-form" onSubmit={sendQuestion}>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a legal question in English or Bahasa Melayu"
              rows={3}
            />
            <button type="submit" disabled={loading || !question.trim()}>
              Send
            </button>
          </form>

          {error ? <p className="chatbot-error">{error}</p> : null}
        </div>

        <aside className={`chatbot-intro-panel ${showIntroPanel ? "expanded" : "collapsed"}`} aria-label="Chatbot domain guide">
          <button
            type="button"
            className="chatbot-intro-toggle"
            onClick={() => setShowIntroPanel((prev) => !prev)}
            aria-expanded={showIntroPanel}
            aria-controls="chatbot-intro-content"
          >
            {showIntroPanel ? "Collapse guide" : "Expand guide"}
          </button>

          {showIntroPanel ? (
            <div id="chatbot-intro-content" className="chatbot-intro" aria-label="Chatbot introduction">
              <p className="chatbot-intro-title">Choose the right legal domain before asking</p>
              <p className="chatbot-intro-text">
                Pick a category below so the chatbot can route your question to the most suitable legal context.
              </p>
              <ul className="chatbot-intro-list">
                <li>
                  <strong>Civil:</strong> Personal and private disputes such as contracts, tenancy, debt, negligence, and family-related matters.
                </li>
                <li>
                  <strong>Corporate:</strong> Business and company matters such as incorporation, governance, compliance, shareholders, and commercial agreements.
                </li>
                <li>
                  <strong>Criminal:</strong> Offences, investigations, arrest or charge procedures, bail, and criminal court process.
                </li>
                <li>
                  <strong>General:</strong> Unsure of category or broad legal guidance. The chatbot will classify your question for you.
                </li>
              </ul>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
};

export default ChatbotPage;
