import { useState, useEffect, useCallback } from 'react'
import { Box, Stack, Typography, Button, CircularProgress } from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import { getBlogs, addComment } from '../lib/api'
import { storage } from '../lib/api'
import BlogCard from '../components/BlogCard'
import CreateBlogDialog from '../components/CreateBlogDialog'

export default function Feed() {
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [lastNumber, setLastNumber] = useState(0)
  const [open, setOpen] = useState(false)
  const isAuthed = !!storage.token

  const load = async (reset = false) => {
    try {
      const currentLastNumber = reset ? 0 : lastNumber
      reset ? setLoading(true) : setLoadingMore(true)
      
      console.log('🚀 Calling getBlogs with lastNumber:', currentLastNumber)
      const response = await getBlogs(currentLastNumber)
      console.log('📥 Response:', response)
      
      const normalized = normalizeBlogs(response.data)
      console.log('✅ Normalized blogs:', normalized)
      
      if (reset) {
        setBlogs(normalized)
        setLastNumber(normalized.length)
      } else {
        setBlogs(prev => [...prev, ...normalized])
        setLastNumber(prev => prev + normalized.length)
      }
      
      // إذا جاء أقل من 10 منشورات، يبقى مفيش أكتر
      setHasMore(normalized.length === 10)
      
    } catch (err) {
      console.error('❌ getBlogs failed:', err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      load(false)
    }
  }, [loadingMore, hasMore, load])

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    // Check if user scrolled near bottom (within 100px)
    const scrollTop = document.documentElement.scrollTop
    const windowHeight = window.innerHeight
    const docHeight = document.documentElement.offsetHeight
    
    if (scrollTop + windowHeight >= docHeight - 100 && !loadingMore && hasMore) {
      loadMore()
    }
  }, [loadMore, loadingMore, hasMore])

  useEffect(() => {
    load(true)
  }, [])

  // Add scroll listener with throttling
  useEffect(() => {
    let timeoutId = null
    
    const throttledScroll = () => {
      if (timeoutId) return
      
      timeoutId = setTimeout(() => {
        handleScroll()
        timeoutId = null
      }, 200) // Throttle to 200ms
    }
    
    window.addEventListener('scroll', throttledScroll)
    return () => {
      window.removeEventListener('scroll', throttledScroll)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [handleScroll])

  const handleUpdateBlog = (updatedBlog) => {
    setBlogs(prev => prev.map(blog => 
      blog.id === updatedBlog.id ? updatedBlog : blog
    ))
  }

  const handleDeleteBlog = (blogId) => {
    setBlogs(prev => prev.filter(blog => blog.id !== blogId))
  }

  const handleAddComment = async (blogId, content) => {
    try {
      const { data } = await addComment(blogId, content)
      
      const newComment = {
        ...data.newComment,
        isLike: false,
        isDislike: false,
        isOwnerComment: true, // أي تعليق جديد = owner دائماً
        commentStats: data.newComment?.commentStats ?? null,
        userData: {
          username: data.username || 'مستخدم',
          id: data.newComment.userId
        }
      }
      
      setBlogs(prev => prev.map(b => {
        if (b.id !== blogId) return b
        const stats = b.blogStats || b.blogStat || {}
        const newStats = { ...stats, commentsNumber: (stats.commentsNumber ?? 0) + 1 }
        return { ...b, commentsBlogs: [newComment, ...(b.commentsBlogs || [])], blogStats: newStats }
      }))
      
      // Return the data for CommentsDialog
      return { data }
    } catch (err) {
      throw err
    }
  }

  const normalizeBlogs = (data) => {
    // Backend بقى يرجع array مباشرة مش wrapped في allBlogs
    const src = Array.isArray(data) ? data : data?.allBlogs
    if (!Array.isArray(src)) return []
    const maybeInner = src[0]
    const arr = Array.isArray(maybeInner) ? maybeInner : src
    return arr
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={600} sx={{ color: 'text.primary' }}>
          آخر التدوينات
        </Typography>
        {isAuthed && (
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            onClick={() => setOpen(true)}
            sx={{ borderRadius: 0, px: 3, py: 1.5, fontWeight: 600 }}
          >
            تدوينة جديدة
          </Button>
        )}
      </Stack>

      {loading ? (
        <Stack spacing={2}>
          {[...Array(3)].map((_, i) => (
            <Box key={i} sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 0, border: '1px solid', borderColor: 'divider', borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#e0e0e0' }} />
                  <Stack sx={{ flex: 1 }}>
                    <div style={{ width: '60%', height: 20, backgroundColor: '#e0e0e0', borderRadius: 0 }} />
                    <div style={{ width: '40%', height: 16, backgroundColor: '#e0e0e0', borderRadius: 0, marginTop: 4 }} />
                  </Stack>
                </Stack>
                <div style={{ width: '100%', height: 200, backgroundColor: '#e0e0e0', borderRadius: 0 }} />
                <div style={{ width: '100%', height: 20, backgroundColor: '#e0e0e0', borderRadius: 0 }} />
                <div style={{ width: '80%', height: 16, backgroundColor: '#e0e0e0', borderRadius: 0 }} />
              </Stack>
            </Box>
          ))}
        </Stack>
      ) : (
        <Stack spacing={0}>
          {blogs.map((b, idx) => (
            <BlogCard 
              key={b.id ?? `b-${idx}`} 
              blog={b} 
              isAuthed={isAuthed} 
              onUpdateBlog={handleUpdateBlog} 
              onAddComment={handleAddComment}
              onDeleteBlog={handleDeleteBlog}
            />
          ))}
          
          {/* Loading indicator at bottom */}
          {loadingMore && (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <CircularProgress size={30} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                جاري تحميل المزيد...
              </Typography>
            </Box>
          )}
          
          {/* End of content indicator */}
          {!hasMore && blogs.length > 0 && !loading && (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="body2" color="text.secondary">
                🎉 وصلت لآخر المنشورات
              </Typography>
            </Box>
          )}
          
          {blogs.length === 0 && !loading && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                لا توجد تدوينات بعد
              </Typography>
            </Box>
          )}
        </Stack>
      )}

      <CreateBlogDialog 
        open={open} 
        onClose={() => setOpen(false)} 
        onCreated={(newBlog) => {
          // Add new blog to the beginning of the list without refresh
          if (newBlog) {
            setBlogs(prev => [newBlog, ...prev])
          }
        }} 
      />
    </Box>
  )
}
