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
export const updateGroupSettings = (groupName, publish, allowReports) => api.post('/api/group/updateGroupSettings', { groupName, publish, allowReports })
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
export const blockUser = (username) => api.post(`/api/profile/${username}/blockUser`)
export const getBlockedUsers = () => api.get('/api/profile/getBlocks')
export const unblockUser = (username) => api.post(`/api/profile/${username}/cancelBlock`)
export const getNotifications = () => api.get('/api/getNotication')
export const search = (value, lastNumber = 0) => api.post('/api/search', { value, lastNumber })
