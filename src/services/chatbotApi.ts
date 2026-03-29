type AskResponse = {
  answer: string;
  category: string;
  model: string;
  chatId?: string;
  saved?: boolean;
  saveError?: string;
};

type ChatRecord = {
  question: string;
  answers: string;
  category?: string;
  model?: string;
  createdAt?: string;
  updatedAt?: string;
};

type ChatsResponse = {
  count: number;
  chats: ChatRecord[];
};

const CHATBOT_API_URL = process.env.REACT_APP_CHATBOT_URL || "http://localhost:3001";

function resolveStoredFirmID(): string | undefined {
  try {
    const storageMode = localStorage.getItem("auth_storage_mode");
    const preferredStorage = storageMode === "session" ? sessionStorage : localStorage;
    const fallbackStorage = preferredStorage === localStorage ? sessionStorage : localStorage;

    const parseFirmID = (rawUser: string | null): string | undefined => {
      if (!rawUser) return undefined;
      const parsed = JSON.parse(rawUser);
      const firmID = String(parsed?.firmID || parsed?.firmId || parsed?.firm_id || "").trim();
      return firmID || undefined;
    };

    return parseFirmID(preferredStorage.getItem("user")) || parseFirmID(fallbackStorage.getItem("user"));
  } catch {
    return undefined;
  }
}

export async function askChatbot(question: string, firmID?: string): Promise<AskResponse> {
  const resolvedFirmID = firmID || resolveStoredFirmID();

  const res = await fetch(`${CHATBOT_API_URL}/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(resolvedFirmID ? { "X-User-FirmID": resolvedFirmID } : {})
    },
    body: JSON.stringify({ question, ...(resolvedFirmID ? { firmID: resolvedFirmID } : {}) })
  });

  if (!res.ok) {
    const errorPayload = await res.json().catch(() => ({}));
    throw new Error(errorPayload.error || "Chatbot request failed.");
  }

  return res.json();
}

export async function fetchChats(limit = 100, firmID?: string): Promise<ChatsResponse> {
  const resolvedFirmID = firmID || resolveStoredFirmID();
  const params = new URLSearchParams({ limit: String(limit) });
  if (resolvedFirmID) {
    params.set("firmID", resolvedFirmID);
  }

  const res = await fetch(`${CHATBOT_API_URL}/chats?${params.toString()}`, {
    headers: {
      ...(resolvedFirmID ? { "X-User-FirmID": resolvedFirmID } : {})
    }
  });

  if (!res.ok) {
    const errorPayload = await res.json().catch(() => ({}));
    throw new Error(errorPayload.error || "Failed to fetch chat history.");
  }

  return res.json();
}
