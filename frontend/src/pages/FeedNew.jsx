import { useState, useEffect } from 'react'
import { Box, Stack, Typography, Button } from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import { getBlogs, addComment } from '../lib/api'
import { storage } from '../lib/api'
import BlogCard from '../components/BlogCard'
import CreateBlogDialog from '../components/CreateBlogDialog'

export default function Feed() {
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const isAuthed = !!storage.token

  const load = async () => {
    try {
      setLoading(true)
      const { data } = await getBlogs()
      const normalized = normalizeBlogs(data)
      setBlogs(normalized)
    } catch (err) {
      console.error('getBlogs failed:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

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
    const src = data?.allBlogs
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
          {blogs.length === 0 && (
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
