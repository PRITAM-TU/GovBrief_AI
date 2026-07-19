import { create } from 'zustand'
import { authAPI } from '../services/api'

const useStore = create((set, get) => ({
  // Auth state
  user: null,
  token: localStorage.getItem('govbrief_token') || null,
  isAuthenticated: !!localStorage.getItem('govbrief_token'),

  // UI state
  sidebarOpen: true,
  loading: false,

  // Scheme matcher conversation
  chatHistory: [],
  farmerProfile: {},

  // Actions
  login: async (phone, password) => {
    const res = await authAPI.login({ phone, password })
    const { access_token, user } = res.data
    localStorage.setItem('govbrief_token', access_token)
    set({ token: access_token, user, isAuthenticated: true })
    return user
  },

  register: async (data) => {
    const res = await authAPI.register(data)
    const { access_token, user } = res.data
    localStorage.setItem('govbrief_token', access_token)
    set({ token: access_token, user, isAuthenticated: true })
    return user
  },

  logout: () => {
    localStorage.removeItem('govbrief_token')
    set({ token: null, user: null, isAuthenticated: false, chatHistory: [], farmerProfile: {} })
  },

  fetchMe: async () => {
    try {
      const res = await authAPI.me()
      set({ user: res.data, isAuthenticated: true })
    } catch {
      get().logout()
    }
  },

  updateProfile: async (data) => {
    const res = await authAPI.updateProfile(data)
    set({ user: res.data.user })
  },

  // Chat actions
  addChatMessage: (role, content) => {
    set((state) => ({
      chatHistory: [...state.chatHistory, { role, content, timestamp: new Date().toISOString() }],
    }))
  },
  updateFarmerProfile: (updates) => {
    set((state) => ({ farmerProfile: { ...state.farmerProfile, ...updates } }))
  },
  clearChat: () => set({ chatHistory: [], farmerProfile: {} }),

  // UI actions
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setLoading: (v) => set({ loading: v }),
}))

export default useStore
