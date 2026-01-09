import { useEffect, useRef } from 'react'
import axios from 'axios'
import { storage, API_BASE } from '../lib/api'

/**
 * Hook to track blog views
 * Records a view after user stays on blog for 10 seconds
 * Sends all viewed blog IDs to backend when user closes the page
 */
export const useBlogViewTracker = () => {
  const viewedBlogsRef = useRef(new Set())
  const activeTimersRef = useRef(new Map())

  // Send views to backend (for manual testing)
  const sendViewsToBackend = () => {
    const blogIds = Array.from(viewedBlogsRef.current)
    
    if (blogIds.length === 0 || !storage.token) {
      console.log('⏭️ Nothing to send')
      return
    }

    console.log('📤 Sending:', blogIds)

    const url = `${API_BASE}/api/addViewsBlogs`
    
    try {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', url, false)
      xhr.setRequestHeader('Content-Type', 'application/json')
      xhr.setRequestHeader('Authorization', storage.token)
      xhr.send(JSON.stringify({ ids: blogIds })) // Backend expects 'ids'
      console.log('✅ Sent! Status:', xhr.status)
    } catch (err) {
      console.error('❌ Error:', err)
    }
  }

  // Track a blog view (after 10 seconds)
  const trackBlogView = (blogId) => {
    if (!blogId || !storage.token) return

    // Don't track if already viewed
    if (viewedBlogsRef.current.has(blogId)) {
      return
    }

    // Clear existing timer for this blog if any
    if (activeTimersRef.current.has(blogId)) {
      clearTimeout(activeTimersRef.current.get(blogId))
    }

    // Start 10 second timer
    const timer = setTimeout(() => {
      viewedBlogsRef.current.add(blogId)
      activeTimersRef.current.delete(blogId)
    }, 10000) // 10 seconds

    activeTimersRef.current.set(blogId, timer)
  }

  // Stop tracking a blog (when user leaves)
  const stopTrackingBlog = (blogId) => {
    if (activeTimersRef.current.has(blogId)) {
      clearTimeout(activeTimersRef.current.get(blogId))
      activeTimersRef.current.delete(blogId)
    }
  }

  // Setup auto-send every 30 seconds + beforeunload
  useEffect(() => {
    
    // Store refs in window for debugging
    window.__viewedBlogs = viewedBlogsRef
    window.__testSend = () => {
      const ids = Array.from(viewedBlogsRef.current)
      console.log('🧪 Manual test - IDs:', ids)
      if (ids.length === 0) {
        alert('لا توجد منشورات مشاهدة!')
        return
      }
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${API_BASE}/api/addViewsBlogs`, false)
      xhr.setRequestHeader('Content-Type', 'application/json')
      xhr.setRequestHeader('Authorization', storage.token)
      xhr.send(JSON.stringify({ ids }))
      console.log('Response:', xhr.status, xhr.responseText)
      alert(`Sent ${ids.length} IDs! Check backend console.`)
    }
    
    // Auto-send every 30 seconds
    const interval = setInterval(async () => {
      const ids = Array.from(viewedBlogsRef.current)
      if (ids.length > 0 && storage.token) {
        try {
          const response = await fetch(`${API_BASE}/api/addViewsBlogs`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': storage.token
            },
            body: JSON.stringify({ ids })
          })
          // Clear after sending
          viewedBlogsRef.current.clear()
        } catch (err) {
          // Silent fail
        }
      }
    }, 15000) // 15 seconds for testing
    
    const handleBeforeUnload = (e) => {
      const blogIds = Array.from(viewedBlogsRef.current)
      
      if (blogIds.length === 0 || !storage.token) {
        return
      }

      const url = `${API_BASE}/api/addViewsBlogs`
      
      // Use Synchronous XHR to send ids
      try {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', url, false) // Synchronous - important for beforeunload
        xhr.setRequestHeader('Content-Type', 'application/json')
        xhr.setRequestHeader('Authorization', storage.token)
        const payload = JSON.stringify({ ids: blogIds })
        xhr.send(payload) // Backend expects 'ids'
      } catch (err) {
        // Silent fail
      }
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const blogIds = Array.from(viewedBlogsRef.current)
        if (blogIds.length > 0 && storage.token) {
          handleBeforeUnload()
        }
      }
    }

    // Listen for page close/refresh
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('pagehide', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup
    return () => {
      clearInterval(interval)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('pagehide', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      
      // Clear all timers
      activeTimersRef.current.forEach(timer => clearTimeout(timer))
      activeTimersRef.current.clear()
    }
  }, [])

  return {
    trackBlogView,
    stopTrackingBlog,
    getViewedBlogs: () => Array.from(viewedBlogsRef.current),
    manualSend: sendViewsToBackend // للـ testing
  }
}
