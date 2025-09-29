import axios from 'axios'

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

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
  }
}

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const token = storage.token
  if (token) {
    // backend expects raw token (no Bearer prefix)
    config.headers['Authorization'] = token
  }
  return config
})

// Auth
export const register = (data) => api.post('/api/auth/register', data)
export const login = (data) => api.post('/api/auth/login', data)
export const isAuth = () => api.get('/api/isAuth')

// Password reset
export const requestReset = (data) => api.post('/api/auth/forget-password/', data)
export const resetPassword = (data) => api.post('/api/auth/forget-password/resetPassword', data)

// Blogs
export const getBlogs = () => api.get('/api/getBlogs')

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
export const getProfile = (username) => api.get(`/api/getProfile/${username}`)
export const updateProfile = (data) => api.post('/api/updateProfile/', data, { headers: { 'Content-Type': 'multipart/form-data' }})

// Notifications functions
export const getFriendsRequest = () => api.get('/api/getFriendsRequest/')

// Friend request functions
export const acceptFriendRequest = (username) => api.post('/api/acceptRequest', { username })
export const rejectFriendRequest = (username, service) => api.post('/api/rejectRequest', { username, service })
export const cancelFriend = (username) => api.post('/api/cancelFriend', { username })

// Chat functions
export const getChat = (username) => api.post('/api/getChat', { username })
