import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Stack,
  IconButton,
  Paper
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Favorite as FavoriteIcon
} from '@mui/icons-material'
import { getFavorites, storage } from '../lib/api'
import BlogCard from '../components/BlogCard'

export default function FavoritesPage() {
  const navigate = useNavigate()
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const currentUser = storage.user

  useEffect(() => {
    loadFavorites()
  }, [])

  const loadFavorites = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await getFavorites()
      
      // تحويل البيانات لتكون متوافقة مع BlogCard
      const formattedFavorites = (data.Favorites || [])
        .filter(favorite => favorite && favorite.Blog) // فلترة المنشورات المحذوفة أو null
        .map(favorite => ({
          id: favorite.Blog.id,
          title: favorite.Blog.title,
          content: favorite.Blog.content,
          photo: favorite.Blog.photo,
          createdAt: favorite.Blog.createdAt, // تاريخ نشر المنشور الأصلي
          userData: favorite.Blog.User, // بيانات صاحب المنشور
          groupData: favorite.Blog.Group, // بيانات المجموعة إن وجدت
          isFavorite: true, // دايماً true لأنها في صفحة المفضلة
          isLike: false, // سيتم تحديثه من BlogCard نفسه
          isDislike: false,
          isOwner: currentUser && favorite.Blog.User && currentUser.id === favorite.Blog.User.id,
          blogStats: {
            likesNumber: 0, // سيتم تحديثه من BlogCard
            dislikeNumber: 0,
            commentsNumber: 0
          },
          commentsBlogs: []
        }))
      
      setFavorites(formattedFavorites)
    } catch (err) {
      console.error('Error loading favorites:', err)
      setError('فشل في تحميل المنشورات المفضلة')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateBlog = (updatedBlog) => {
    // إذا تم إزالة المنشور من المفضلة، احذفه من القائمة
    if (updatedBlog.isFavorite === false) {
      setFavorites(prev => prev.filter(blog => blog.id !== updatedBlog.id))
    } else {
      setFavorites(prev => 
        prev.map(blog => 
          blog.id === updatedBlog.id ? updatedBlog : blog
        )
      )
    }
  }

  const handleDeleteBlog = (blogId) => {
    setFavorites(prev => prev.filter(blog => blog.id !== blogId))
  }

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          mb: 4,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <IconButton 
            onClick={() => navigate('/settings')}
            sx={{ 
              color: 'white',
              bgcolor: 'rgba(255,255,255,0.2)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FavoriteIcon sx={{ fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={700}>
                المنشورات المفضلة
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, mt: 0.5 }}>
                {favorites.length} منشور مفضل
              </Typography>
            </Box>
          </Box>
        </Stack>
      </Paper>

      {/* Content */}
      {error ? (
        <Alert severity="error" sx={{ borderRadius: 2, mb: 3 }}>
          {error}
        </Alert>
      ) : favorites.length === 0 ? (
        <Paper 
          elevation={0}
          sx={{ 
            p: 6, 
            textAlign: 'center',
            borderRadius: 3,
            bgcolor: 'grey.50'
          }}
        >
          <FavoriteIcon sx={{ fontSize: 80, color: 'grey.400', mb: 2 }} />
          <Typography variant="h5" fontWeight={600} color="text.secondary" mb={1}>
            لا توجد منشورات مفضلة
          </Typography>
          <Typography variant="body1" color="text.secondary">
            ابدأ بإضافة منشورات للمفضلة لتظهر هنا
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={3}>
          {favorites.map((blog) => (
            <Box key={blog.id} sx={{ position: 'relative' }}>
              <BlogCard
                blog={blog}
                isAuthed={!!currentUser}
                onUpdateBlog={handleUpdateBlog}
                onDeleteBlog={handleDeleteBlog}
                userRole="user"
                groupSettings={{ allowReports: true }}
              />
            </Box>
          ))}
        </Stack>
      )}
    </Container>
  )
}
