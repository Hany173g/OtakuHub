import axios from 'axios'

// Base API configuration  
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000'

// Global toast function (will be set by App component)
let globalToast = null
export const setGlobalToast = (toastFn) => {
  globalToast = toastFn
}

export const storage = {
  get token() { return localStorage.getItem('token') },
  set token(val) { if (val) localStorage.setItem('token', val); else localStorage.removeItem('token') },
  get user() { 
    const userData = localStorage.getItem('user')
    return userData ? JSON.parse(userData) : null
  },
  set user(val) { 
    if (val) localStorage.setItem('user', JSON.stringify(val))
    else localStorage.removeItem('user')
  },
  // Clear all auth data
  clearAuth() {
    this.token = null
    this.user = null
  }
}

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true // Enable cookies for refresh token
})

// Track refresh token promise to avoid multiple simultaneous refresh attempts
let refreshTokenPromise = null
let lastLoginTime = null

// Helper function to decode JWT token (for debugging)
const decodeToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const now = Date.now()
    const expTime = payload.exp * 1000
    const timeUntilExpiry = Math.max(0, expTime - now)
    
    // Token analysis removed for clean console
    
    return {
      ...payload,
      isExpired: now >= expTime,
      expiresAt: new Date(expTime).toISOString(),
      timeUntilExpiry
    }
  } catch (error) {
    return null
  }
}

api.interceptors.request.use((config) => {
  const token = storage.token
  if (token) {
    // backend expects raw token (no Bearer prefix)
    config.headers['Authorization'] = token
  }
  return config
})

// Response interceptor for unified error handling
api.interceptors.response.use(
  (response) => {
    // Success responses (2xx)
    return response
  },
  async (error) => {
    const currentToken = storage.token
    const tokenInfo = currentToken ? decodeToken(currentToken) : null
    
    // Silent handling for all API responses - no console logging
    
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response
      
      // Extract error message from response
      const message = data?.message || 'حدث خطأ غير متوقع'
      
      // Handle specific status codes
      switch (status) {
        case 401:
          // Handle like/dislike/comment actions for guests - FIRST PRIORITY
          if (error.config.url?.includes('/addLikeBlog') || 
              error.config.url?.includes('/addDislikeBlog') || 
              error.config.url?.includes('/addLikeComment') || 
              error.config.url?.includes('/adddisLikeComment') || 
              error.config.url?.includes('/removelike') || 
              error.config.url?.includes('/removeDislike') || 
              error.config.url?.includes('/addComment') || 
              error.config.url?.includes('/addFavorite') || 
              error.config.url?.includes('/removeFavorite')) {
            
            console.log('🚫 Guest interaction blocked')
            
            // Show message
            if (globalToast) {
              globalToast('يجب تسجيل الدخول أولاً للتفاعل مع المنشورات', 'warning', 4000)
            } else {
              alert('يجب تسجيل الدخول أولاً للتفاعل مع المنشورات')
            }
            
            // STOP EVERYTHING - don't continue to any other logic
            const stopError = new Error('Guest action blocked')
            stopError.isGuestBlocked = true
            return Promise.reject(stopError)
          }
          
          // Handle auth requests silently
          if (error.config.url?.includes('/auth/') || error.config.url?.includes('/api/isAuth')) {
            break
          }
          
          // Unauthorized - try refresh token first (only for protected routes)
          if (!error.config._retry && storage.token) {
            error.config._retry = true
            
            // If user just logged in (within last 2 seconds), don't refresh immediately
            // But allow refresh if token is actually expired or invalid
            if (lastLoginTime && (Date.now() - lastLoginTime) < 2000 && !tokenInfo?.isExpired) {
              // Skip refresh - user just logged in
              break
            }
            
            // If there's already a refresh in progress, wait for it
            if (refreshTokenPromise) {
              // Wait for existing refresh token request
              try {
                await refreshTokenPromise
                // Retry with the new token
                error.config.headers['Authorization'] = storage.token
                return api(error.config)
              } catch (refreshError) {
                return Promise.reject(refreshError)
              }
            }
            
            // Start new refresh token request
            refreshTokenPromise = axios.post(`${API_BASE}/api/auth/refreshToken`, {}, {
              withCredentials: true,
              timeout: 15000 // 15 second timeout
            })
            
            try {
              const refreshResponse = await refreshTokenPromise
              
              // Update the access token
              const newAccessToken = refreshResponse.data.acessToken
              if (!newAccessToken) {
                throw new Error('No access token in refresh response')
              }
              
              storage.token = newAccessToken
              
              // Clear the promise
              refreshTokenPromise = null
              
              // Retry the original request with new token
              error.config.headers['Authorization'] = newAccessToken
              return api(error.config)
              
            } catch (refreshError) {
              // Clear the promise
              refreshTokenPromise = null
              
              // If refresh token fails, call logout to clear httpOnly cookie
              
              // Call logout API to clear httpOnly cookie
              try {
                await axios.post(`${API_BASE}/api/auth/logout`, {}, {
                  withCredentials: true
                })
              } catch (logoutError) {
                // Silent fail for logout API
              }
              
              // Stop refresh timer
              stopFrontendTokenRefresh()
              
              // Clear client-side auth data
              storage.clearAuth()
              
              // Show user-friendly message
              if (globalToast) {
                globalToast('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى', 'warning', 5000)
              }
              
              // Redirect to login only if not already on auth pages
              if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
                setTimeout(() => {
                  window.location.href = '/login'
                }, 2000) // Give time for toast message
              }
              return Promise.reject(refreshError)
            }
          } else {
            // If no token available, call logout to clear any remaining cookies
            
            // Call logout API to clear httpOnly cookie
            try {
              await axios.post(`${API_BASE}/api/auth/logout`, {}, {
                withCredentials: true
              })
            } catch (logoutError) {
              // Silent fail for logout API
            }
            
            // Clear client-side auth data
            storage.clearAuth()
            
            // Redirect to login only if not already on auth pages
            if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
              window.location.href = '/login'
            }
          }
          break
        case 400:
          // Bad Request - Don't trigger auth logic for isAuth endpoint
          if (error.config.url?.includes('/api/isAuth')) {
            // Silent fail for isAuth - no logging needed
            break
          }
          // 400 errors are validation messages - no logging needed
          break
        case 403:
          // Forbidden - could be ban message
          if (message && message.includes('قام المشرف بحظرك')) {
            // Show ban message to user
            if (globalToast) {
              globalToast(`🚫 ${message}`, 'error', 8000) // Show for 8 seconds
            } else {
              alert(`🚫 ${message}`) // Fallback to alert
            }
          }
          break
        case 404:
          // Not found - usually validation message (user not found) - no logging needed
          break
        case 422:
          // Validation error - no logging needed
          break
        case 500:
          // Server error - silent handling
          break
        default:
          // Silent handling for all status codes
      }
      
      // Create standardized error object
      const apiError = new Error(message)
      apiError.status = status
      apiError.data = data
      return Promise.reject(apiError)
    } else if (error.request) {
      // Network error
      const networkError = new Error('فشل في الاتصال بالخادم')
      networkError.status = 0
      networkError.isNetworkError = true
      return Promise.reject(networkError)
    } else {
      // Other error
      return Promise.reject(error)
    }
  }
)

// Auth
export const register = (data) => api.post('/api/auth/register', data)
export const loginUser = async (data) => {
  const response = await api.post('/api/auth/login', data)
  // Update last login time to prevent immediate refresh attempts
  lastLoginTime = Date.now()
  
  // Start automatic token refresh
  startFrontendTokenRefresh()
  
  // Token analysis removed for clean console
  
  return response
}
export const refreshToken = () => api.post('/api/auth/refreshToken')

// Logout function that clears both client and server-side auth
export const logoutUser = async () => {
  try {
    // Stop refresh timer
    stopFrontendTokenRefresh()
    // Call backend logout to clear refresh token cookie
    await api.post('/api/auth/logout')
  } catch (error) {
    // Silent fail for logout API
  } finally {
    // Always clear client-side auth data
    storage.clearAuth()
    // Redirect to login page
    window.location.href = '/login'
  }
}
// Check if user is authenticated - this is for UI state only, not for auth logic
export const isAuth = () => api.get('/api/isAuth')

// Password reset
export const requestReset = (data) => api.post('/api/auth/forget-password/', data)
export const resetPassword = (data) => api.post('/api/auth/forget-password/resetPassword', data)

// Search user blogs
export const searchUserBlogs = (username, value) => api.post('/api/searchUserBlogs', { username, value })

// Proactive token refresh for frontend
let frontendRefreshInterval = null

export const startFrontendTokenRefresh = () => {
  if (frontendRefreshInterval) clearInterval(frontendRefreshInterval)
  
  // Only start if user is logged in
  if (!storage.token) return
  
  // Start immediately with a small delay
  setTimeout(async () => {
    if (storage.token) {
      try {
        await axios.post(`${API_BASE}/api/auth/refreshToken`, {}, {
          withCredentials: true,
          timeout: 15000
        }).then(response => {
          if (response.data.acessToken) {
            storage.token = response.data.acessToken
            console.log('✅ Frontend token refreshed proactively')
          }
        })
      } catch (error) {
        console.log('❌ Frontend proactive refresh failed:', error.message)
      }
    }
  }, 10000) // 10 seconds after login
  
  frontendRefreshInterval = setInterval(async () => {
    if (storage.token) {
      try {
        const response = await axios.post(`${API_BASE}/api/auth/refreshToken`, {}, {
          withCredentials: true,
          timeout: 15000
        })
        
        if (response.data.acessToken) {
          storage.token = response.data.acessToken
          console.log('✅ Frontend token refreshed automatically')
        }
      } catch (error) {
        console.log('❌ Frontend auto refresh failed:', error.message)
        clearInterval(frontendRefreshInterval)
        frontendRefreshInterval = null
      }
    } else {
      clearInterval(frontendRefreshInterval)
      frontendRefreshInterval = null
    }
  }, 25 * 60 * 1000) // 25 minutes
}

export const stopFrontendTokenRefresh = () => {
  if (frontendRefreshInterval) {
    clearInterval(frontendRefreshInterval)
    frontendRefreshInterval = null
  }
}

// Blogs
export const getBlogs = (lastNumber = 0) => api.post('/api/getBlogs', { lastNumber })

export const createBlog = (payload) => {
  const form = new FormData()
  form.append('title', payload.title)
  form.append('content', payload.content)
  if (payload.photo) form.append('photo', payload.photo)
  return api.post('/api/createBlog', form, { headers: { 'Content-Type': 'multipart/form-data' }})
}

export const addComment = (blogId, content) => api.post(`/api/addComment/${blogId}`, { content })

// Reactions with ID in path
export const reactAction = ({ action, service, id }) => {
  if (service === 'comments') {
    // Special handling for comments due to backend route naming
    const endpoint = action === 'like' ? '/api/addLikeComment/' : '/api/adddisLikeComment/'
    // Backend expects 'comment' not 'comments'
    return api.post(endpoint, { action, service: 'comment', id })
  } else {
    // For blogs
    const prefix = action === 'like' ? 'addLike' : 'addDislike'
    const target = 'Blog'
    return api.post(`/api/${prefix}${target}/`, { action, service, id })
  }
}

export const removeLike = (blogId) => api.post(`/api/removelike/${blogId}`)
export const removeDislike = (blogId) => api.post(`/api/removeDislike/${blogId}`)

// Delete functions
export const deleteBlog = (blogId) => api.post('/api/deleteBlog', { blogId })
export const deleteComment = (commentId) => api.post('/api/deleteComment', { commentId })

// Profile functions
export const getProfile = (username, lastNumber = 0) => api.post(`/api/getProfile/${username}`, { lastNumber })
export const updateProfile = (data) => api.post('/api/updateProfile/', data, { headers: { 'Content-Type': 'multipart/form-data' }})

// Notifications functions
export const getFriendsRequest = () => api.get('/api/getFriendsRequest/')

// Friend request functions
export const acceptFriendRequest = (username) => api.post('/api/acceptRequest', { username })
export const rejectFriendRequest = (username, service) => api.post('/api/rejectRequest', { username, service })
export const cancelFriend = (username) => api.post('/api/cancelFriend', { username })

// Chat functions
export const getChat = (username) => api.post('/api/getChat', { username })

// Groups functions
export const createGroup = (formData) => api.post('/api/groups/create', formData, { 
  headers: { 'Content-Type': 'multipart/form-data' }
})
export const getAllGroups = () => api.get('/api/groups')
export const getGroup = (groupName) => api.post('/api/getGroup', { groupName })
export const joinGroup = (groupName) => api.post('/api/joinGroup', { groupName })
export const leaveGroup = (groupName) => api.post('/api/leaveGroup', { groupName })
export const getGroupLogger = (groupName, status) => api.post(`/api/group/getGroupLogger/${status}`, { groupName })
export const getHistoryDelete = (groupName, service) => api.post(`/api/group/getHistoryDelete/${service}`, { groupName })
export const getGroupReports = (groupName, service = 'blog') => api.post('/api/group/getReports', { groupName, service })
export const reportService = (service, serviceId, content) => api.post('/api/reportService', { service, serviceId, content })
export const getPendingBlogs = (groupName) => api.post('/api/group/getBlogsPenning', { groupName })
export const acceptPendingBlog = (groupName, blogId) => api.post('/api/group/acceptBlogPenned', { groupName, blogId })
export const cancelPendingBlog = (groupName, blogId) => api.post('/api/group/cancelBlogPenned', { groupName, blogId })
export const updateGroupSettings = (groupName, publish, allowReports, warringNumbers) => api.post('/api/group/updateGroupSettings', { groupName, publish, allowReports, warringNumbers })
export const cancelJoinGroup = (groupName) => api.post('/api/cancelJoinGroup', { groupName })
export const getPendingUsers = (groupName) => api.get('/api/getPendingUsers', { params: { groupName } })
export const acceptUser = (groupName, id) => api.post('/api/group/acceptUser', { groupName, id })
export const cancelUser = (groupName, id) => api.post('/api/group/cancelUser', { groupName, id })
export const checkGroupAccess = (groupName) => api.get('/api/group/isAcess', { params: { groupName } })
export const addGroupPost = (formData) => api.post('/api/addPost', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
export const searchMembers = (groupName, username) => api.post('/api/group/searchMembers', { groupName, username })
export const changeRole = (groupName, username, newRole) => api.post('/api/group/changeRole', { groupName, username, newRole })
export const kickUser = (groupName, username) => api.post('/api/group/kickUser', { groupName, username })
export const updateGroupData = (formData) => api.post('/api/group/updateGroupData', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
export const deleteGroup = (groupName) => api.post('/api/group/deleteGroup', { groupName })
export const changeOwner = (groupName, newOwner) => api.post('/api/group/changeOwner', { groupName, newOwner })

// Group search functions
export const searchLogger = (groupName, username, status) => api.post('/api/group/searchUserLogger', { groupName, username, status })
export const searchHistoryDelete = (groupName, username, service) => api.post('/api/group/searchHistoryDelete', { groupName, username, service })
export const searchReports = (groupName, username, service) => api.post('/api/group/searchUserReports', { groupName, username, service })

// Warning system functions
export const addWarning = (groupName, userId, message) => api.post('/api/group/addNewWarring', { groupName, userId, message })

// Banned users functions  
// Note: Backend route is GET but controller expects req.body - trying query params
export const getBannedUsers = (groupName) => api.get('/api/group/getBannedUser', {
  params: { groupName }
})
export const removeBannedUser = (groupName, id) => api.post('/api/group/removeBannedUser', { groupName, id })
export const searchBannedUser = (groupName, username) => api.post('/api/group/searchUserBan', { groupName, username })

// Favorites functions
export const addFavorite = (blogId) => api.post('/api/addFavorite', { blogId })
export const removeFavorite = (blogId) => api.post('/api/removeFavorite', { blogId })
export const getFavorites = () => api.get('/api/getFavorite')

export const blockUser = (username) => api.post(`/api/profile/${username}/blockUser`)
export const getBlockedUsers = () => api.get('/api/profile/getBlocks')
export const unblockUser = (username) => api.post(`/api/profile/${username}/cancelBlock`)
export const getNotifications = () => api.get('/api/getNotication')
export const markNotificationsAsRead = (ids) => api.post('/api/markNotfcsRead', { ids })
export const getBroadcastNotifications = () => api.post('/api/getBroadCastNotfcs')
export const markBroadcastNotificationsAsRead = (ids) => api.post('/api/markBroadCastNotfcsRead', { ids })
export const search = (value, lastNumber = 0) => api.post('/api/search', { value, lastNumber })

// Visitor tracking
export const addVisitorData = async (url) => {
  try {
    await api.post('/api/addUserData', { url })
  } catch (error) {
    // Silent fail for visitor tracking
  }
}

// Last seen tracking
export const addLastSeen = async () => {
  try {
    console.log('🕒 Recording last seen...')
    const response = await api.post('/api/addLastSeen')
    console.log('✅ Last seen recorded successfully:', response.data)
  } catch (error) {
    console.error('❌ Failed to record last seen:', error.response?.data || error.message)
  }
}

// Export API_BASE for components that need it
export { API_BASE }
