import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api";

async function loginUser(email, password) {
  try {
    const response = await axios.post(`${API_URL}/login`, {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    return null;
  }
}
