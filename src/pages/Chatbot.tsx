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
};

type AskResponse = {
  sessionId: string;
  question: string;
  answer: string;
  category: RoleCategory;
  model: string;
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
          sessionId: sessionId || undefined,
          persist: true,
        }),
      });

      const data = (await response.json()) as Partial<AskResponse> & { error?: string };

      if (!response.ok || !data.answer) {
        throw new Error(data.error || "Failed to get chatbot answer.");
      }

      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId);
      }

      const assistantMessage: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        text: data.answer,
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
      <div className="chatbot-shell">
        <div className="chatbot-header">
          <h1>ASLAW Chatbot</h1>
          <div className="chatbot-actions">
            <button type="button" className="secondary" onClick={() => navigate(PATH.AUTH.LOGIN)}>
              Login
            </button>
            <button type="button" className="secondary" onClick={() => navigate(PATH.HOME)}>
              Home
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
    </div>
  );
};

export default ChatbotPage;
