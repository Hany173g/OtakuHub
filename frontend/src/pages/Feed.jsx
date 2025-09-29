import { useState, useEffect } from 'react'
import { Box, Stack, Typography, Button, Grid, Skeleton, Paper, Divider, Avatar, IconButton } from '@mui/material'
import { Add as AddIcon, Home, Group, Bookmark, CalendarToday, Clock } from '@mui/icons-material'
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

  const updateOne = (updated) => {
    setBlogs(prev => prev.map(b => b.id === updated.id ? updated : b))
  }

  const onAddComment = async (blogId, content) => {
    try {
      const { data } = await addComment(blogId, content)
      const newComment = {
        ...data.newComment,
        isLike: false,
        isDislike: false,
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

  const shortcuts = [
    { icon: <Home />, label: 'الرئيسية', active: true },
    { icon: <Group />, label: 'الأصدقاء' },
    { icon: <Bookmark />, label: 'المحفوظات' },
    { icon: <CalendarToday />, label: 'الأحداث' },
    { icon: <Clock />, label: 'الذكريات' },
  ]

  return (
    <Box sx={{ display: 'flex', gap: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Sidebar */}
      <Box sx={{ width: 200, flexShrink: 0 }}>
        <Paper sx={{ p: 2, borderRadius: 2, mb: 2 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: 'text.primary' }}>
            الاختصارات
          </Typography>
          <Stack spacing={1}>
            {shortcuts.map((item, idx) => (
              <Button
                key={idx}
                startIcon={item.icon}
                variant={item.active ? 'contained' : 'text'}
                sx={{
                  justifyContent: 'flex-start',
                  borderRadius: 2,
                  fontSize: '0.9rem',
                  py: 1
                }}
              >
                {item.label}
              </Button>
            ))}
          </Stack>
        </Paper>

        {isAuthed && (
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: 'text.primary' }}>
              الإحصائيات
            </Typography>
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">إجمالي التدوينات:</Typography>
                <Typography variant="body2" fontWeight={600}>{blogs.length}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">التفاعلات:</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {blogs.reduce((sum, b) => sum + ((b.blogStats?.likesNumber ?? 0) + (b.blogStats?.dislikeNumber ?? 0)), 0)}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        )}
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, maxWidth: 600 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h5" fontWeight={700} sx={{ color: 'text.primary' }}>آخر التدوينات</Typography>
          {isAuthed && (
            <Button startIcon={<AddIcon />} variant="contained" onClick={() => setOpen(true)} sx={{ borderRadius: 6, px: 3, fontWeight: 600 }}>
              تدوينة جديدة
            </Button>
          )}
        </Stack>

        {loading ? (
          <Stack spacing={2}>
            {[...Array(4)].map((_, i) => (
              <Box key={i} sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 1 }}>
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Skeleton variant="circular" width={40} height={40} />
                    <Stack sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="60%" height={20} />
                      <Skeleton variant="text" width="40%" height={16} />
                    </Stack>
                  </Stack>
                  <Skeleton variant="rectangular" height={240} sx={{ borderRadius: 2 }} />
                  <Skeleton variant="text" height={20} />
                  <Skeleton variant="text" width="80%" height={16} />
                </Stack>
              </Box>
            ))}
          </Stack>
        ) : (
          <Stack spacing={2}>
            {blogs.map((b, idx) => (
              <BlogCard key={b.id ?? `b-${idx}`} blog={b} isAuthed={isAuthed} onUpdateBlog={updateOne} onAddComment={onAddComment} />
            ))}
            {blogs.length === 0 && (
              <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>لا توجد تدوينات بعد</Typography>
            )}
          </Stack>
        )}
      </Box>

      {/* Right Sidebar */}
      <Box sx={{ width: 300, flexShrink: 0 }}>
        <Paper sx={{ p: 2, borderRadius: 2, mb: 2 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: 'text.primary' }}>
            النشاطات الأخيرة
          </Typography>
          <Stack spacing={1}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>U</Avatar>
              <Box>
                <Typography variant="body2" fontWeight={500}>مرحبا بك في OtakuHub!</Typography>
                <Typography variant="caption" color="text.secondary">ابدأ بإنشاء تدوينتك الأولى</Typography>
              </Box>
            </Box>
          </Stack>
        </Paper>

        <Paper sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: 'text.primary' }}>
            اقتراحات لك
          </Typography>
          <Stack spacing={1}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>O</Avatar>
              <Box>
                <Typography variant="body2" fontWeight={500}>اكتشف المحتوى الجديد</Typography>
                <Typography variant="caption" color="text.secondary">تابع المستخدمين الآخرين</Typography>
              </Box>
            </Box>
          </Stack>
        </Paper>
      </Box>

      <CreateBlogDialog open={open} onClose={() => setOpen(false)} onCreated={load} />
    </Box>
  )
}
