import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Alert from "react-bootstrap/Alert";
import { Box, Button, CircularProgress, IconButton, Paper, TextField, Typography } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import NavBarAdmin from "../../shared/Navbar/NavBar Admin/new";
import NavBarClient from "../../shared/Navbar/NavBar Client/new";
import NavBarLawyer from "../../shared/Navbar/NavBar Lawyer/new";
import AuthMemory from "../../data/authMemory";
import { useAuth } from "../../context/AuthContext";
import { askChatbot, fetchChats } from "../../services/chatbotApi";
import "./internalChatbot.css";

type Message = {
  role: "user" | "bot";
  text: string;
  category?: string;
  createdAt?: string;
};

type InternalChatbotProps = {
  userTypeLabel?: string;
};

const InternalChatbot: React.FC<InternalChatbotProps> = ({ userTypeLabel = "Internal User" }) => {
  const { role, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const successMessage = location.state?.successMessage || null;
  const effectiveRole = ((role || String(user?.role || "").toLowerCase()) as
    | "admin"
    | "client"
    | "lawyer"
    | "") || "";
  const currentFirmID = String(
    user?.firmID || user?.firmId || user?.firm_id || ""
  ).trim();

  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "Internal ASLAW assistant is ready.", category: "general" }
  ]);
  const [history, setHistory] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAlert, setShowAlert] = useState(!!successMessage);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!AuthMemory.isLoggedIn() || !effectiveRole) {
      navigate("/", { replace: true });
    }
  }, [effectiveRole, navigate]);

  useEffect(() => {
    if (successMessage) {
      setShowAlert(true);
      const timer = setTimeout(() => setShowAlert(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setError("");
    try {
      const response = await fetchChats(100, currentFirmID || undefined);
      const mapped = response.chats.flatMap((c) => {
        const items: Message[] = [];
        if (c.question) items.push({ role: "user", text: c.question, createdAt: c.createdAt, category: c.category });
        if (c.answers) items.push({ role: "bot", text: c.answers, createdAt: c.createdAt, category: c.category });
        return items;
      });
      setHistory(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load chat history.");
    } finally {
      setHistoryLoading(false);
    }
  }, [currentFirmID]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const stats = useMemo(() => {
    const botMessages = history.filter((h) => h.role === "bot");
    const categoryCounts = botMessages.reduce<Record<string, number>>((acc, item) => {
      const key = item.category || "general";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    return {
      totalChats: botMessages.length,
      uniqueCategories: Object.keys(categoryCounts).length,
      topCategory,
      categoryCounts
    };
  }, [history]);

  const handleSend = async () => {
    const question = input.trim();
    if (!question || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const response = await askChatbot(question, currentFirmID || undefined);
      setMessages((prev) => [...prev, { role: "bot", text: response.answer, category: response.category }]);
      await loadHistory();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Server connection error.";
      setMessages((prev) => [...prev, { role: "bot", text: msg, category: "error" }]);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const renderNavbar = () => {
    if (effectiveRole === "admin") return <NavBarAdmin />;
    if (effectiveRole === "client") return <NavBarClient />;
    if (effectiveRole === "lawyer") return <NavBarLawyer />;
    return null;
  };

  return (
    <>
      {renderNavbar()}

      {showAlert && successMessage && (
        <div className="internal-chatbot-alert-wrap">
          <Alert
            variant="success"
            onClose={() => setShowAlert(false)}
            dismissible
          >
            {successMessage}
          </Alert>
        </div>
      )}

      <div className="internal-chatbot-page">
        <div className="internal-chatbot-header">
          <h1>ASLAW Internal Chatbot</h1>
          <p>{userTypeLabel} dashboard connected to chatbot API</p>
        </div>

        <div className="internal-chatbot-layout">
          <Paper sx={{ p: 2, borderRadius: 2, height: "78vh", display: "flex", flexDirection: "column" }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
              Live Chat
            </Typography>

            <Box sx={{ flexGrow: 1, overflowY: "auto", pr: 0.5 }}>
              {messages.map((msg, idx) => (
                <Box key={idx} sx={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", mb: 1.2 }}>
                  <Box
                    sx={{
                      maxWidth: "78%",
                      px: 2,
                      py: 1.1,
                      borderRadius: 2,
                      bgcolor: msg.role === "user" ? "#1e40af" : "#eef2ff",
                      color: msg.role === "user" ? "#fff" : "#111827",
                      whiteSpace: "pre-wrap"
                    }}
                  >
                    {msg.category && msg.role === "bot" && (
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8", mb: 0.4 }}>
                        Category: {msg.category}
                      </Typography>
                    )}
                    <Typography variant="body2">{msg.text}</Typography>
                  </Box>
                </Box>
              ))}

              {loading && (
                <Box display="flex" justifyContent="flex-start" mb={1}>
                  <Box sx={{ px: 2, py: 1, borderRadius: 2, backgroundColor: "#eef2ff" }}>
                    <CircularProgress size={16} />
                  </Box>
                </Box>
              )}
              <div ref={chatEndRef} />
            </Box>

            <Box sx={{ display: "flex", gap: 1, pt: 1.2, borderTop: "1px solid #e2e8f0" }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Ask a legal question..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <IconButton color="primary" disabled={loading} onClick={handleSend}>
                <SendIcon />
              </IconButton>
            </Box>
            {error && (
              <Typography sx={{ color: "#b91c1c", fontSize: 13, mt: 1 }}>
                {error}
              </Typography>
            )}
          </Paper>

          <div className="internal-chatbot-side-column">
          <Paper sx={{ p: 2, borderRadius: 2, mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>Statistics</Typography>
            <Typography variant="body2" sx={{ mb: 0.7 }}>Total chats: {stats.totalChats}</Typography>
            <Typography variant="body2" sx={{ mb: 0.7 }}>Categories used: {stats.uniqueCategories}</Typography>
            <Typography variant="body2" sx={{ mb: 1.2 }}>Top category: {stats.topCategory}</Typography>
            <Button variant="outlined" size="small" onClick={loadHistory} disabled={historyLoading}>
              Refresh Stats
            </Button>
          </Paper>

          <Paper sx={{ p: 2, borderRadius: 2, height: "52vh", display: "flex", flexDirection: "column" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Recent History</Typography>
              <Button variant="text" size="small" onClick={loadHistory} disabled={historyLoading}>Reload</Button>
            </Box>

            <Box sx={{ overflowY: "auto", pr: 0.5, flexGrow: 1 }}>
              {historyLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", pt: 2 }}>
                  <CircularProgress size={18} />
                </Box>
              ) : history.length === 0 ? (
                <Typography variant="body2" sx={{ color: "#64748b" }}>No history found.</Typography>
              ) : (
                history.slice(0, 20).map((item, idx) => (
                  <Box key={idx} sx={{ py: 0.8, borderBottom: "1px solid #e2e8f0" }}>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a" }}>
                      {item.role === "user" ? "User" : "Bot"}
                    </Typography>
                    <Typography sx={{ fontSize: 12.5, color: "#334155", whiteSpace: "pre-wrap" }}>
                      {item.text.length > 130 ? `${item.text.slice(0, 130)}...` : item.text}
                    </Typography>
                    {item.category && (
                      <Typography sx={{ fontSize: 11.5, color: "#475569" }}>Category: {item.category}</Typography>
                    )}
                  </Box>
                ))
              )}
            </Box>
          </Paper>
          </div>
        </div>
      </div>
    </>
  );
};

export default InternalChatbot;
