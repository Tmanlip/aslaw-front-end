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

type AskStreamEvent =
  | { event: "meta"; data: { sessionId?: string } }
  | { event: "chunk"; data: { text?: string } }
  | { event: "done"; data: AskResponse }
  | { event: "error"; data: { message?: string } };

const categoryOptions: RoleCategory[] = ["general", "civil", "corporate", "criminal"];

const parseSseEvents = (buffer: string): { events: AskStreamEvent[]; remainder: string } => {
  const rawFrames = buffer.split("\n\n");
  const remainder = rawFrames.pop() ?? "";
  const events: AskStreamEvent[] = [];

  for (const frame of rawFrames) {
    const lines = frame.split("\n");
    let eventName = "message";
    const dataLines: string[] = [];

    for (const line of lines) {
      if (line.startsWith("event:")) {
        eventName = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        dataLines.push(line.slice(5).trim());
      }
    }

    if (dataLines.length === 0) {
      continue;
    }

    try {
      const payload = JSON.parse(dataLines.join("\n"));
      if (eventName === "meta" || eventName === "chunk" || eventName === "done" || eventName === "error") {
        events.push({ event: eventName, data: payload } as AskStreamEvent);
      }
    } catch {
      // Ignore malformed event chunks and continue stream parsing.
    }
  }

  return { events, remainder };
};

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
      text: "Hello. I am ASALAW chatbot. Ask your legal question and I will route to the right domain.",
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

    const assistantMessageId = `a-${Date.now()}`;

    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setLoading(true);
    setError("");

    setMessages((prev) => [
      ...prev,
      {
        id: assistantMessageId,
        role: "assistant",
        text: "",
      },
    ]);

    try {
      const response = await fetch(`${apiBaseUrl}/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          question: trimmed,
          category,
          language: "auto",
          sessionId: sessionId || undefined,
          persist: true,
        }),
      });

      if (!response.ok || !response.body) {
        const rawBody = await response.text();
        throw new Error(rawBody || `Chatbot request failed with status ${response.status}.`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = "";
      let finalPayload: AskResponse | null = null;
      let streamError = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        sseBuffer += decoder.decode(value, { stream: true });
        const parsed = parseSseEvents(sseBuffer);
        sseBuffer = parsed.remainder;

        for (const event of parsed.events) {
          if (event.event === "meta") {
            if (event.data?.sessionId && !sessionId) {
              setSessionId(event.data.sessionId);
            }
            continue;
          }

          if (event.event === "chunk") {
            const piece = event.data?.text || "";
            if (piece) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? {
                        ...msg,
                        text: `${msg.text}${piece}`,
                      }
                    : msg
                )
              );
            }
            continue;
          }

          if (event.event === "done") {
            finalPayload = event.data;
            continue;
          }

          if (event.event === "error") {
            streamError = event.data?.message || "Chatbot stream failed.";
          }
        }
      }

      if (streamError) {
        throw new Error(streamError);
      }

      if (!finalPayload || !finalPayload.answer) {
        throw new Error("Chatbot stream ended without a final answer.");
      }

      if (finalPayload.sessionId && !sessionId) {
        setSessionId(finalPayload.sessionId);
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                text: finalPayload?.answer || msg.text,
                suggestedCategory: finalPayload?.suggestedCategory ?? undefined,
                domainMismatch: Boolean(finalPayload?.domainMismatch),
              }
            : msg
        )
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Chatbot request failed.";
      setError(message);
      setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot-page">
      <div className={`chatbot-layout ${showIntroPanel ? "with-intro" : "intro-collapsed"}`}>
        <div className="chatbot-shell">
          <div className="chatbot-header">
            <h1>ASALAW Chatbot</h1>
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
