import axios from 'axios'

// Base API configuration  
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // Important for httpOnly cookies
  timeout: 10000,
})

// Token storage key
const TOKEN_KEY = 'dashboard_access_token'

// Get access token from localStorage
const getStoredToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch (error) {
    return null
  }
}

// Initialize token from localStorage
let accessToken = getStoredToken()

// Set initial authorization header if token exists
if (accessToken) {
  api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
}

// Set access token
export const setAccessToken = (token) => {
  accessToken = token
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    localStorage.removeItem(TOKEN_KEY)
    delete api.defaults.headers.common['Authorization']
  }
}

// Get access token
export const getAccessToken = () => accessToken || getStoredToken()

// Clear tokens
export const clearTokens = () => {
  accessToken = null
  localStorage.removeItem(TOKEN_KEY)
  delete api.defaults.headers.common['Authorization']
}

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = token // Backend expects token directly without "Bearer " prefix
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for token refresh
let isRefreshing = false
let refreshSubscribers = []

const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb)
}

const onRefreshed = (token) => {
  refreshSubscribers.map(cb => cb(token))
  refreshSubscribers = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error
    
    // Don't try to refresh token for login, logout, refresh token requests
    const isAuthRequest = config.url?.includes('/login') || 
                         config.url?.includes('/logout') || 
                         config.url?.includes('/refreshToken')
    
    // Handle auth errors properly
    const message = response?.data?.message || ''
    const isValidationError = message.includes('البينات') || 
                             message.includes('يمكنك حظر') || 
                             message.includes('ليست صحيحه') ||
                             message.includes('محظور بالفعل') ||
                             message.includes('غير محظور')
    
    // Only try refresh for 401 errors, not 400 validation errors
    const shouldTryRefresh = response?.status === 401 && !isValidationError
    
    // Don't try refresh if it's already a refresh token request that failed
    const isRefreshTokenRequest = config.url?.includes('/refreshToken')
    const isUnauthorized = shouldTryRefresh && !isRefreshTokenRequest
    
    if (isUnauthorized && !config._retry && !isAuthRequest) {
      if (isRefreshing) {
        // If already refreshing, wait for the new token
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            if (token) {
              config.headers.Authorization = token // Backend expects token directly
              resolve(api(config))
            } else {
              window.location.href = '/login'
            }
          })
        })
      }

      config._retry = true
      isRefreshing = true

      try {
        // Try to refresh token
        const { data } = await axios.post(`${API_BASE}/api/dashboard/refreshToken`, {}, {
          withCredentials: true,
          timeout: 10000
        })
        
        const newToken = data.acessToken // Note: backend returns 'acessToken' (typo)
        
        if (!newToken) {
          throw new Error('No access token received from refresh endpoint')
        }
        
        setAccessToken(newToken)
        onRefreshed(newToken)
        
        // Retry original request with new token
        config.headers.Authorization = newToken // Backend expects token directly
        return api(config)
      } catch (refreshError) {
        // Refresh failed - could be expired refresh token or network error
        console.log('Refresh token failed, logging out:', refreshError.message)
        onRefreshed(null)
        clearTokens()
        
        // Show user-friendly message
        alert('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى')
        
        // Only redirect if we're not already on login page
        if (!window.location.pathname.includes('/login')) {
          setTimeout(() => {
            window.location.href = '/login'
          }, 1000)
        }
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// Auth API functions
export const loginUser = async (email, password) => {
  const { data } = await api.post('/api/dashboard/login', { email, password })
  // Backend returns 'token' for login and 'acessToken' for refresh
  setAccessToken(data.token || data.acessToken)
  return data
}

export const logoutUser = async () => {
  try {
    await api.post('/api/dashboard/logout')
  } catch (error) {
    // Silent fail - just clear tokens
  } finally {
    clearTokens()
  }
}

export const refreshToken = async () => {
  const { data } = await api.post('/api/dashboard/refreshToken')
  setAccessToken(data.acessToken) // Note: backend returns 'acessToken' (typo)
  return data
}

// Dashboard API functions
export const getDashboardHome = async (filters = {}) => {
  // Set default values for the parameters backend expects
  const requestBody = {
    blogDay: filters.blogDay || 0,
    userDay: filters.userDay || 0,
    vistorDay: filters.vistorDay || 0,
    analtyicsDay: filters.analtyicsDay || 1
  }
  const { data } = await api.post('/api/dashboard/getHome', requestBody)
  return data
}

// User Management API functions
export const searchUser = async (username) => {
  const { data } = await api.post('/api/dashboard/searchUser', { username })
  return data
}

export const getUserLastSeen = async (username) => {
  const { data } = await api.post('/api/dashboard/getLastSeensUser', { username })
  return data
}

export const banUser = async (username, days) => {
  const { data } = await api.post('/api/dashboard/addBan', { username, days })
  return data
}

export const unbanUser = async (username) => {
  const { data } = await api.post('/api/dashboard/removeBan', { username })
  return data
}

export const getUserProfile = async (id) => {
  const { data } = await api.post('/api/dashboard/getUserProfile', { id })
  return data
}

export const deleteUser = async (id) => {
  const { data } = await api.post('/api/dashboard/deleteUser', { id })
  return data
}

export const updateProfileStatus = async (id, followers, UserFollows, likes) => {
  const { data } = await api.post('/api/dashboard/updateProfileStatus', { 
    id, 
    followers, 
    UserFollows, 
    likes 
  })
  return data
}

export const updateUserData = async (id, username, email, password) => {
  const { data } = await api.post('/api/dashboard/updateUser', { 
    id, 
    username, 
    email, 
    password 
  })
  return data
}

export const verifyUser = async (username) => {
  const { data } = await api.post('/api/dashboard/verifyUser', { username })
  return data
}

export const removeVerifyUser = async (username) => {
  console.log('🔍 API: Calling removeVerifUser with username:', username)
  const { data } = await api.post('/api/dashboard/removeVerifUser', { username })
  console.log('✅ API: removeVerifUser response:', data)
  return data
}

export const getFavUser = async (username) => {
  const { data } = await api.post('/api/dashboard/getFavUser', { username })
  return data
}

export const getUserBlocks = async (username) => {
  const { data } = await api.post('/api/dashboard/getBlocks', { username })
  return data
}

export const createBlogUser = async (username, blogData) => {
  const formData = new FormData()
  formData.append('username', username)
  formData.append('title', blogData.title)
  formData.append('content', blogData.content)
  
  if (blogData.photo) {
    formData.append('photo', blogData.photo)
  }
  
  const { data } = await api.post('/api/dashboard/createBlogUser', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return data
}

export const searchUserBlogs = async (username, searchValue) => {
  const { data } = await api.post('/api/searchUserBlogs', { 
    username, 
    value: searchValue 
  })
  return data
}

export const getUserSecurityLogs = async (username) => {
  const { data } = await api.post('/api/dashboard/getUserSecuirtyLogs', { username })
  return data
}

export const sendBroadcastNotification = async (type, content) => {
  const { data } = await api.post('/api/dashboard/sendBroadNotfcs', { type, content })
  return data
}

// Proactive token refresh - call this periodically to avoid token expiry
export const refreshTokenProactively = async () => {
  try {
    // Only try refresh if we have a current token
    if (!getAccessToken()) {
      console.log('❌ No access token available for proactive refresh')
      return false
    }

    const { data } = await axios.post(`${API_BASE}/api/dashboard/refreshToken`, {}, {
      withCredentials: true,
      timeout: 10000
    })
    
    const newToken = data.acessToken
    if (newToken) {
      setAccessToken(newToken)
      console.log('✅ Token refreshed proactively')
      return true
    }
    return false
  } catch (error) {
    // Don't log 401 errors as they're expected when refresh token expires
    if (error.response?.status !== 401) {
      console.log('❌ Proactive refresh failed:', error.message)
    }
    return false
  }
}

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!getAccessToken()
}

// Start periodic token refresh (every 25 minutes)
let refreshInterval = null
export const startTokenRefreshTimer = () => {
  if (refreshInterval) clearInterval(refreshInterval)
  
  // Start immediately with a small delay
  setTimeout(async () => {
    if (isAuthenticated()) {
      await refreshTokenProactively()
    }
  }, 5000) // 5 seconds after login
  
  refreshInterval = setInterval(async () => {
    if (isAuthenticated()) {
      const success = await refreshTokenProactively()
      if (!success) {
        console.log('❌ Refresh timer stopped - authentication failed')
        clearInterval(refreshInterval)
        refreshInterval = null
      }
    } else {
      console.log('❌ Refresh timer stopped - user not authenticated')
      clearInterval(refreshInterval)
      refreshInterval = null
    }
  }, 25 * 60 * 1000) // 25 minutes
}

export const stopTokenRefreshTimer = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
}

export { API_BASE }
export default api
