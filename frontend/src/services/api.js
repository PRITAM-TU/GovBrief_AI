import axios from 'axios'

const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL
  if (!envUrl) return '/api'
  const clean = envUrl.replace(/\/+$/, '')
  return clean.endsWith('/api') ? clean : `${clean}/api`
}

const API = axios.create({
  baseURL: getBaseURL()
})

// Attach JWT token on every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('govbrief_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auth
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  me: () => API.get('/auth/me'),
  updateProfile: (data) => API.put('/auth/profile', data),
}

// Schemes
export const schemesAPI = {
  list: (params) => API.get('/schemes/list', { params }),
  get: (id) => API.get(`/schemes/${id}`),
  match: (data) => API.post('/schemes/match', data),
  chat: (data) => API.post('/schemes/chat', data),
  categories: () => API.get('/schemes/categories'),
}

// OCR
export const ocrAPI = {
  upload: (formData) => API.post('/ocr/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  list: () => API.get('/ocr/documents'),
  getFields: (docId) => API.get(`/ocr/document/${docId}/fields`),
}

// PDF
export const pdfAPI = {
  summarize: (formData) => API.post('/pdf/summarize', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
}

// Forms
export const formsAPI = {
  templates: () => API.get('/forms/templates'),
  generate: (data) => API.post('/forms/generate', data),
  autoFill: (formType, format) => API.post('/forms/auto-fill', null, { params: { form_type: formType, format } }),
  analyzeRejection: (data) => API.post('/forms/analyze-rejection', data),
}

// TTS
export const ttsAPI = {
  languages: () => API.get('/tts/languages'),
  generate: (text, language) => API.post('/tts/generate', { text, language }),
  schemeAudio: (schemeData, language) => API.post('/tts/scheme-audio', { scheme_data: schemeData, language }),
}

// Vault
export const vaultAPI = {
  upload: (formData) => API.post('/vault/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  list: () => API.get('/vault/list'),
  download: (docId) => API.get(`/vault/download/${docId}`, { responseType: 'blob' }),
  delete: (docId) => API.delete(`/vault/${docId}`),
}

// Alerts
export const alertsAPI = {
  upcoming: (days) => API.get('/alerts/upcoming', { params: { days } }),
  myAlerts: () => API.get('/alerts/my-alerts'),
  markRead: (id) => API.post(`/alerts/mark-read/${id}`),
  stats: () => API.get('/alerts/stats'),
}

// Payouts
export const payoutsAPI = {
  list: (params) => API.get('/payouts/list', { params }),
  submit: (data) => API.post('/payouts/submit', data),
}

// Chatbot
export const chatbotAPI = {
  chat: (data) => API.post('/chatbot/chat', data),
  searchPolicy: (q) => API.get('/chatbot/search-policy', { params: { q } }),
  starterQuestions: () => API.get('/chatbot/starter-questions'),
}

// Applications Tracker
export const applicationsAPI = {
  list: () => API.get('/applications/'),
  create: (data) => API.post('/applications/', data),
  updateStatus: (id, status) => API.put(`/applications/${id}/status`, { status }),
}

// Scheme Journey
export const journeyAPI = {
  generate: (data) => API.post('/journey/generate', data),
  schemes: () => API.get('/journey/schemes'),
  image: (prompt, step_number) => API.post('/journey/image', { prompt, step_number }),
}

// Agent
export const agentAPI = {
  schemes: () => API.get('/agent/schemes'),
  startRun: (scheme_key) => API.post('/agent/run', { scheme_key }),
  getStatus: (run_id) => API.get(`/agent/run/${run_id}`),
  history: () => API.get('/agent/history'),
}

// Admin (password-protected)
export const adminAPI = {
  verify:  (password) => API.post('/admin/verify', { password }),
  scrape:  (admin_password, url) => API.post('/admin/scrape', { admin_password, url }),
  schemes: (admin_password) => API.get('/admin/schemes', { params: { admin_password } }),
  delete:  (admin_password, scheme_id) => API.delete('/admin/scheme', { data: { admin_password, scheme_id } }),
}

export default API

