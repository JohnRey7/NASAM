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

// Admin methods
export async function getAllTemplates() {
  const response = await axios.get(`${API_URL}/personality-test/template`, { withCredentials: true });
  return response.data;
}

export async function createTemplate(data: any) {
  const response = await axios.post(`${API_URL}/personality-test/template`, data, { withCredentials: true });
  return response.data;
}

export async function updateTemplate(id: string, data: any) {
  const response = await axios.patch(`${API_URL}/personality-test/template/${id}`, data, { withCredentials: true });
  return response.data;
}

export async function deleteTemplate(id: string) {
  const response = await axios.delete(`${API_URL}/personality-test/template/${id}`, { withCredentials: true });
  return response.data;
}

export async function getAllUserPersonalityTests() {
  const response = await axios.get(`${API_URL}/personality-test/all`, { withCredentials: true });
  return response.data;
}

export async function getPersonalityTestByUserId(userId: string) {
  const response = await axios.get(`${API_URL}/personality-test/user/${userId}`, { withCredentials: true });
  return response.data;
} 