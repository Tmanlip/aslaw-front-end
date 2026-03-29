import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, CircularProgress, IconButton, Paper, TextField, Typography } from "@mui/material";
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
};

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
      const response = await askChatbot(question);
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: response.answer, category: response.category }
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: error instanceof Error ? error.message : "Server connection error.",
          category: "error"
        }
      ]);
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
                      bgcolor: msg.role === "user" ? "#8B7500" : "#f7f4e8",
                      color: msg.role === "user" ? "white" : "#1f2937",
                      whiteSpace: "pre-wrap"
                    }}
                  >
                    {msg.category && msg.role === "bot" && (
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#8B7500", mb: 0.4 }}>
                        Category: {msg.category}
                      </Typography>
                    )}
                    <Typography variant="body2">{msg.text}</Typography>
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