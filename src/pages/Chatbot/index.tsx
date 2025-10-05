import React, { useState, useRef, useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Paper,
  CircularProgress,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";

// ✅ Define a clear type for messages
type Message = {
  role: "user" | "bot";
  text: string;
};

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "👋 Hello! I'm your assistant. How can I help today?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ✅ Auto-scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ Handle sending message
  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    // Simulate bot reply (you can replace this with an API call later)
    setTimeout(() => {
      const botMessage: Message = {
        role: "bot",
        text: `🤖 I understood: "${userMessage.text}"`,
      };
      setMessages((prev) => [...prev, botMessage]);
      setLoading(false);
    }, 1000);
  };

  return (
    <Container fluid className="vh-100 d-flex flex-column bg-light">
      <Row className="flex-grow-1 justify-content-center">
        <Col md={10} lg={8} xl={6} className="d-flex flex-column py-3">
          {/* Chat container */}
          <Paper
            elevation={3}
            sx={{
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
              p: 2,
              borderRadius: 3,
              backgroundColor: "#fff",
            }}
          >
            {/* Chat messages */}
            <Box
              sx={{
                flexGrow: 1,
                overflowY: "auto",
                mb: 2,
                pr: 1,
              }}
            >
              {messages.map((msg, idx) => (
                <Box
                  key={idx}
                  sx={{
                    display: "flex",
                    justifyContent:
                      msg.role === "user" ? "flex-end" : "flex-start",
                    mb: 1,
                  }}
                >
                  <Box
                    sx={{
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      maxWidth: "75%",
                      backgroundColor:
                        msg.role === "user" ? "#1976d2" : "#f1f1f1",
                      color: msg.role === "user" ? "white" : "black",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    <Typography variant="body1">{msg.text}</Typography>
                  </Box>
                </Box>
              ))}

              {/* Loading bubble */}
              {loading && (
                <Box display="flex" justifyContent="flex-start" mb={1}>
                  <Box
                    sx={{
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      backgroundColor: "#f1f1f1",
                    }}
                  >
                    <CircularProgress size={16} />
                  </Box>
                </Box>
              )}
              <div ref={chatEndRef} />
            </Box>

            {/* Input area */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <IconButton color="primary" onClick={handleSend}>
                <SendIcon />
              </IconButton>
            </Box>
          </Paper>
        </Col>
      </Row>
    </Container>
  );
};

export default Chatbot;