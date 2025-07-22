import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export async function startPersonalityTest() {
  const response = await axios.post(`${API_URL}/personality-test/start`, {}, { withCredentials: true });
  return response.data;
}

export async function answerPersonalityTest(answers: { questionId: string; answer: number }[]) {
  const response = await axios.post(`${API_URL}/personality-test/answer`, answers, { withCredentials: true });
  return response.data;
}

export async function stopPersonalityTest() {
  const response = await axios.get(`${API_URL}/personality-test/stop`, { withCredentials: true });
  return response.data;
}

export async function getMyPersonalityTest() {
  const response = await axios.get(`${API_URL}/personality-test/me`, { withCredentials: true });
  return response.data;
} 