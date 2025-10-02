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
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      py: 3
    }}>
      <Box sx={{ 
        display: 'flex', 
        gap: 4, 
        maxWidth: 1400, 
        mx: 'auto',
        px: 3
      }}>
      {/* Sidebar */}
      <Box sx={{ width: 280, flexShrink: 0 }}>
        <Paper sx={{ 
          p: 3, 
          borderRadius: '20px', 
          mb: 3,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <Typography 
            variant="h5" 
            sx={{ 
              mb: 3, 
              fontWeight: 800,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontFamily: '"Cairo", sans-serif'
            }}
          >
            🚀 الاختصارات
          </Typography>
          <Stack spacing={2}>
            {shortcuts.map((item, idx) => (
              <Button
                key={idx}
                startIcon={item.icon}
                variant={item.active ? 'contained' : 'text'}
                sx={{
                  justifyContent: 'flex-start',
                  borderRadius: '15px',
                  fontSize: '1rem',
                  py: 1.5,
                  px: 2,
                  fontWeight: 600,
                  fontFamily: '"Cairo", sans-serif',
                  ...(item.active ? {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)'
                    }
                  } : {
                    color: 'text.secondary',
                    '&:hover': {
                      bgcolor: 'rgba(102, 126, 234, 0.1)',
                      color: '#667eea',
                      transform: 'translateX(5px)'
                    }
                  }),
                  transition: 'all 0.3s ease'
                }}
              >
                {item.label}
              </Button>
            ))}
          </Stack>
        </Paper>

        {isAuthed && (
          <Paper sx={{ 
            p: 3, 
            borderRadius: '20px',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <Typography 
              variant="h5" 
              sx={{ 
                mb: 3, 
                fontWeight: 800,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontFamily: '"Cairo", sans-serif'
              }}
            >
              📊 الإحصائيات
            </Typography>
            <Stack spacing={3}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 2,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
              }}>
                <Typography variant="body1" fontWeight={600} color="text.primary">📝 إجمالي التدوينات</Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 800,
                    color: '#667eea',
                    fontSize: '1.5rem'
                  }}
                >
                  {blogs.length}
                </Typography>
              </Box>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 2,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(255, 87, 34, 0.1) 0%, rgba(255, 152, 0, 0.1) 100%)'
              }}>
                <Typography variant="body1" fontWeight={600} color="text.primary">❤️ التفاعلات</Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 800,
                    color: '#FF5722',
                    fontSize: '1.5rem'
                  }}
                >
                  {blogs.reduce((sum, b) => sum + ((b.blogStats?.likesNumber ?? 0) + (b.blogStats?.dislikeNumber ?? 0)), 0)}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        )}
      </Box>

      {/* Main Content */}
      <Box sx={{ 
        flex: 1, 
        maxWidth: 700,
        mx: 2
      }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 800,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontFamily: '"Cairo", sans-serif',
              letterSpacing: '0.5px'
            }}
          >
            🌟 آخر التدوينات
          </Typography>
          {isAuthed && (
            <Button 
              startIcon={<AddIcon sx={{ fontSize: 24 }} />} 
              variant="contained" 
              onClick={() => setOpen(true)} 
              sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '25px', 
                px: 4, 
                py: 1.5,
                fontWeight: 700,
                fontSize: '1.1rem',
                fontFamily: '"Cairo", sans-serif',
                boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: '0 12px 35px rgba(102, 126, 234, 0.4)',
                  background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
                }
              }}
            >
              ✨ تدوينة جديدة
            </Button>
          )}
        </Stack>

        {loading ? (
          <Stack spacing={3}>
            {[...Array(3)].map((_, i) => (
              <Box key={i} sx={{ 
                p: 4, 
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(20px)',
                borderRadius: '20px', 
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Skeleton variant="circular" width={56} height={56} sx={{ bgcolor: 'rgba(102, 126, 234, 0.1)' }} />
                    <Stack sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="60%" height={24} sx={{ bgcolor: 'rgba(102, 126, 234, 0.1)' }} />
                      <Skeleton variant="text" width="40%" height={18} sx={{ bgcolor: 'rgba(102, 126, 234, 0.1)' }} />
                    </Stack>
                  </Stack>
                  <Skeleton variant="rectangular" height={300} sx={{ borderRadius: '15px', bgcolor: 'rgba(102, 126, 234, 0.1)' }} />
                  <Skeleton variant="text" height={24} sx={{ bgcolor: 'rgba(102, 126, 234, 0.1)' }} />
                  <Skeleton variant="text" width="80%" height={20} sx={{ bgcolor: 'rgba(102, 126, 234, 0.1)' }} />
                  <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <Skeleton variant="rounded" width={120} height={40} sx={{ borderRadius: '15px', bgcolor: 'rgba(102, 126, 234, 0.1)' }} />
                    <Skeleton variant="rounded" width={120} height={40} sx={{ borderRadius: '15px', bgcolor: 'rgba(255, 87, 34, 0.1)' }} />
                    <Skeleton variant="rounded" width={120} height={40} sx={{ borderRadius: '15px', bgcolor: 'rgba(0, 150, 136, 0.1)' }} />
                  </Stack>
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
      <Box sx={{ width: 320, flexShrink: 0 }}>
        <Paper sx={{ 
          p: 3, 
          borderRadius: '20px', 
          mb: 3,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <Typography 
            variant="h5" 
            sx={{ 
              mb: 3, 
              fontWeight: 800,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontFamily: '"Cairo", sans-serif'
            }}
          >
            🔔 النشاطات الأخيرة
          </Typography>
          <Stack spacing={2}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              p: 2,
              borderRadius: '15px',
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(102, 126, 234, 0.2)'
              }
            }}>
              <Avatar sx={{ 
                width: 48, 
                height: 48, 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                fontSize: '1.2rem',
                fontWeight: 700
              }}>
                🎉
              </Avatar>
              <Box>
                <Typography variant="body1" fontWeight={600} sx={{ fontFamily: '"Cairo", sans-serif' }}>
                  مرحبا بك في OtakuHub!
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ابدأ بإنشاء تدوينتك الأولى
                </Typography>
              </Box>
            </Box>
          </Stack>
        </Paper>

        <Paper sx={{ 
          p: 3, 
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <Typography 
            variant="h5" 
            sx={{ 
              mb: 3, 
              fontWeight: 800,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontFamily: '"Cairo", sans-serif'
            }}
          >
            💡 اقتراحات لك
          </Typography>
          <Stack spacing={2}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              p: 2,
              borderRadius: '15px',
              background: 'linear-gradient(135deg, rgba(255, 87, 34, 0.1) 0%, rgba(255, 152, 0, 0.1) 100%)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(255, 87, 34, 0.2)'
              }
            }}>
              <Avatar sx={{ 
                width: 48, 
                height: 48, 
                background: 'linear-gradient(135deg, #FF5722 0%, #FF9800 100%)',
                fontSize: '1.2rem',
                fontWeight: 700
              }}>
                🚀
              </Avatar>
              <Box>
                <Typography variant="body1" fontWeight={600} sx={{ fontFamily: '"Cairo", sans-serif' }}>
                  اكتشف المحتوى الجديد
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  تابع المستخدمين الآخرين
                </Typography>
              </Box>
            </Box>
          </Stack>
        </Paper>
      </Box>

      <CreateBlogDialog open={open} onClose={() => setOpen(false)} onCreated={load} />
      </Box>
    </Box>
  )
}
