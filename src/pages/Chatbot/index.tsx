import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Chip, CircularProgress, IconButton, Paper, Stack, TextField, Typography } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { colors } from "../../constant/color";
import CustomButton from "../../components/Button/button";
import logo from "../../assets/pics/logo-landscape.png";
import { askChatbot } from "../../services/chatbotApi";
import "../styles.css";
import "./publicChatbot.css";

type Message = {
  role: "user" | "bot";
  text: string;
  category?: string;
  handoff?: boolean;
  timedOut?: boolean;
  retryQuestion?: string;
};

const CONTACT_MARKER = /booking contact name|phone:|whatsapp:|email:/i;
const ROUTED_CATEGORIES = new Set(["civil", "corporate", "criminal", "general"]);

function formatContactLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

const PublicChatbotPage: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "Hello. Ask me about Malaysian law.", category: "general" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleBackHome = () => {
    navigate("/");
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async () => {
    const question = input.trim();
    if (!question || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setInput("");
    setLoading(true);

    try {
      const categoryHint = [...messages]
        .reverse()
        .find((msg) => msg.role === "bot" && msg.category && ROUTED_CATEGORIES.has(msg.category))?.category;
      const response = await askChatbot(question, undefined, categoryHint);
      if (response.degraded) {
        setMessages((prev) => [
          ...prev,
          { role: "bot", text: response.answer, category: response.category, timedOut: true, retryQuestion: question }
        ]);
      } else {
        const isHandoff = CONTACT_MARKER.test(response.answer);
        setMessages((prev) => [
          ...prev,
          { role: "bot", text: response.answer, category: response.category, handoff: isHandoff }
        ]);
      }
    } catch (error) {
      const rawMsg = error instanceof Error ? error.message : "";
      const friendlyMsg =
        rawMsg.toLowerCase().includes("failed to fetch") || rawMsg.toLowerCase().includes("networkerror")
          ? "Unable to reach the server. Please ensure the backend is running and try again."
          : rawMsg || "Server connection error.";
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: friendlyMsg,
          category: "error"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (question: string) => {
    if (loading) return;
    setLoading(true);
    try {
      const categoryHint = [...messages]
        .reverse()
        .find((msg) => msg.role === "bot" && msg.category && ROUTED_CATEGORIES.has(msg.category) && !msg.timedOut)?.category;
      const response = await askChatbot(question, undefined, categoryHint);
      const replacement: Message = response.degraded
        ? { role: "bot", text: response.answer, category: response.category, timedOut: true, retryQuestion: question }
        : { role: "bot", text: response.answer, category: response.category, handoff: CONTACT_MARKER.test(response.answer) };
      setMessages((prev) => {
        const copy = [...prev];
        const idx = copy.map((m) => m.timedOut).lastIndexOf(true);
        if (idx !== -1) copy[idx] = replacement;
        else copy.push(replacement);
        return copy;
      });
    } catch (error) {
      const rawMsg = error instanceof Error ? error.message : "";
      const friendlyMsg =
        rawMsg.toLowerCase().includes("failed to fetch") || rawMsg.toLowerCase().includes("networkerror")
          ? "Unable to reach the server. Please ensure the backend is running and try again."
          : rawMsg || "Server connection error.";
      setMessages((prev) => [...prev, { role: "bot", text: friendlyMsg, category: "error" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="homepage-container"
      style={{ "--bg-color": colors.gold4 } as React.CSSProperties}
    >
      <div className="public-chatbot-wrapper">
        <div className="public-chatbot-brand">
          <img
            src={logo}
            alt="Adnan Sharida & Associates"
            className="logo-img"
          />
          <h1 className="public-chatbot-title">ASLAW Public Chatbot</h1>
          <p className="public-chatbot-subtitle">Ask legal questions in the same portal style as home page.</p>
        </div>

        <div className="public-chatbot-actions">
          <CustomButton
            customColor="red4"
            size="lg"
            onClick={handleBackHome}
            className="shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 px-4 py-2"
          >
            Back to Home
          </CustomButton>
        </div>

        <div className="public-chatbot-panel">
          <Paper
            elevation={6}
            sx={{
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              borderRadius: 3,
              minHeight: "62vh"
            }}
          >
            <Box sx={{ px: 3, py: 2, color: "white", background: "linear-gradient(135deg, #8B7500 0%, #654321 100%)" }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>ASLAW Chatbot</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>Public Legal Assistant</Typography>
            </Box>

            <Box sx={{ flexGrow: 1, overflowY: "auto", p: 2, background: "#fcfdff" }}>
              {messages.map((msg, idx) => (
                <Box key={idx} sx={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", mb: 1.5 }}>
                  <Box
                    sx={{
                      px: 2,
                      py: 1.2,
                      borderRadius: 2,
                      maxWidth: "78%",
                      bgcolor: msg.role === "user"
                        ? "#8B7500"
                        : msg.timedOut
                          ? "#fff7ed"
                          : msg.handoff
                            ? "#fff8e6"
                            : "#f7f4e8",
                      color: msg.role === "user" ? "white" : "#1f2937",
                      border: msg.timedOut ? "1px solid #fb923c" : msg.handoff ? "1px solid #d4a017" : "1px solid transparent",
                      whiteSpace: "pre-wrap"
                    }}
                  >
                    {msg.category && msg.role === "bot" && (
                      <Stack direction="row" spacing={1} sx={{ mb: 0.75, flexWrap: "wrap" }}>
                        <Chip
                          label={`Category: ${msg.category}`}
                          size="small"
                          sx={{ fontWeight: 700, bgcolor: "rgba(139, 117, 0, 0.12)", color: "#7a6000" }}
                        />
                        {msg.handoff && (
                          <Chip
                            label="Lawyer contact shared"
                            size="small"
                            sx={{ fontWeight: 700, bgcolor: "rgba(212, 160, 23, 0.16)", color: "#7a4b00" }}
                          />
                        )}
                      </Stack>
                    )}
                    {msg.timedOut ? (
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, color: "#b45309" }}>
                          ⏱ Response timed out
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1, color: "#78716c", fontSize: 12 }}>
                          The model took too long. Here's a quick summary in the meantime:
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1.25, whiteSpace: "pre-wrap" }}>{msg.text}</Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={loading}
                          onClick={() => msg.retryQuestion && handleRetry(msg.retryQuestion)}
                          sx={{ fontSize: 12, textTransform: "none", borderColor: "#b45309", color: "#b45309", "&:hover": { borderColor: "#92400e", color: "#92400e" } }}
                        >
                          {loading ? "Generating…" : "Continue generating"}
                        </Button>
                      </Box>
                    ) : msg.handoff ? (
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.75, color: "#7a4b00" }}>
                          The chatbot has reached the lawyer handoff point.
                        </Typography>
                        <Box
                          sx={{
                            borderRadius: 2,
                            p: 1.25,
                            background: "linear-gradient(135deg, rgba(255, 248, 230, 0.95) 0%, rgba(255, 239, 196, 0.95) 100%)",
                            border: "1px solid rgba(212, 160, 23, 0.45)",
                          }}
                        >
                          {formatContactLines(msg.text).map((line, lineIndex) => (
                            <Typography
                              key={lineIndex}
                              variant="body2"
                              sx={{
                                fontWeight: lineIndex === 0 ? 700 : 500,
                                color: lineIndex === 0 ? "#6b4d00" : "#4b5563",
                                mb: lineIndex < formatContactLines(msg.text).length - 1 ? 0.5 : 0,
                              }}
                            >
                              {line}
                            </Typography>
                          ))}
                        </Box>
                      </Box>
                    ) : (
                      <Typography variant="body2">{msg.text}</Typography>
                    )}
                  </Box>
                </Box>
              ))}

              {loading && (
                <Box display="flex" justifyContent="flex-start" mb={1}>
                  <Box sx={{ px: 2, py: 1, borderRadius: 2, backgroundColor: "#eef1f7" }}>
                    <CircularProgress size={16} />
                  </Box>
                </Box>
              )}
              <div ref={chatEndRef} />
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 1.5, borderTop: "1px solid #ece6cf" }}>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                placeholder="Ask a Malaysian law question..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <IconButton color="primary" disabled={loading} onClick={handleSend}>
                <SendIcon />
              </IconButton>
            </Box>
          </Paper>
        </div>
      </div>
    </div>
  );
};

export default PublicChatbotPage;