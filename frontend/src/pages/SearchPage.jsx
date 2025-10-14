import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Avatar,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Divider,
  Button,
  ListItem,
  ListItemAvatar,
  ListItemText
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import PersonIcon from '@mui/icons-material/Person'
import GroupIcon from '@mui/icons-material/Group'
import ArticleIcon from '@mui/icons-material/Article'
import { search, storage } from '../lib/api'
import BlogCard from '../components/BlogCard'

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const query = searchParams.get('q')
  
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMoreBlogs, setHasMoreBlogs] = useState(true)
  const [blogsLastNumber, setBlogsLastNumber] = useState(0)
  const isAuthed = !!storage.token

  const handleUpdateBlog = (updatedBlog) => {
    setResults(prev => ({
      ...prev,
      blogsData: prev.blogsData.map(blog => 
        blog.id === updatedBlog.id ? updatedBlog : blog
      )
    }))
  }

  const handleDeleteBlog = (blogId) => {
    setResults(prev => ({
      ...prev,
      blogsData: prev.blogsData.filter(blog => blog.id !== blogId)
    }))
  }

  useEffect(() => {
    if (query) {
      performSearch(query)
    }
  }, [query])

  const performSearch = async (searchQuery) => {
    try {
      setLoading(true)
      const { data } = await search(searchQuery)
      console.log('🔍 Search results:', data)
      console.log('📝 Blogs data:', data.blogsData)
      setResults(data)
    } catch (err) {
      console.error('❌ Search failed:', err)
      setResults(null)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (user) => {
    if (user.isOwner) return { text: 'أنت', color: 'default', icon: '👤' }
    if (user.isFriend) return { text: 'صديق', color: 'success', icon: '✓' }
    if (user.isRequestFriend) return { text: 'تم الإرسال', color: 'warning', icon: '⏱' }
    if (user.isRecivceFriend) return { text: 'طلب صداقة', color: 'info', icon: '👋' }
    return null
  }

  const getGroupBadge = (group) => {
    if (!group.isMember) return null
    if (group.role === 'owner') return { text: 'مالك', color: 'error', icon: '👑' }
    if (group.role === 'admin') return { text: 'مشرف', color: 'warning', icon: '⭐' }
    if (group.role === 'Member') return { text: 'عضو', color: 'success', icon: '✓' }
    return null
  }

  if (!query) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <SearchIcon sx={{ fontSize: 100, color: 'text.secondary', mb: 3 }} />
        <Typography variant="h4" color="text.secondary" gutterBottom>
          ابحث عن أي شيء
        </Typography>
        <Typography variant="body1" color="text.secondary">
          استخدم شريط البحث أعلاه للبحث عن مستخدمين، مجموعات، أو منشورات
        </Typography>
      </Container>
    )
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 3 }} color="text.secondary">
          جاري البحث عن "{query}"...
        </Typography>
      </Container>
    )
  }

  const usersCount = results?.userStats?.length || 0
  const groupsCount = results?.groupsStats?.length || 0
  const blogsCount = results?.blogsData?.filter(blog => blog && blog.id)?.length || 0
  const totalCount = usersCount + groupsCount + blogsCount

  if (totalCount === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <SearchIcon sx={{ fontSize: 100, color: 'text.secondary', mb: 3 }} />
        <Typography variant="h4" gutterBottom>
          لا توجد نتائج
        </Typography>
        <Typography variant="body1" color="text.secondary">
          لم نجد أي نتائج لـ "{query}"
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          جرب البحث بكلمات مختلفة
        </Typography>
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      {/* Header */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 2.5, 
          mb: 3, 
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Typography variant="h5" fontWeight={700} gutterBottom>
          نتائج البحث عن: "{query}"
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {usersCount > 0 && `${usersCount} مستخدم`}
          {usersCount > 0 && groupsCount > 0 && ' • '}
          {groupsCount > 0 && `${groupsCount} مجموعة`}
          {(usersCount > 0 || groupsCount > 0) && blogsCount > 0 && ' • '}
          {blogsCount > 0 && `${blogsCount} منشور`}
        </Typography>
      </Paper>

      <Stack spacing={4}>
        {/* Users Section */}
        {usersCount > 0 && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <PersonIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>
                المستخدمين
              </Typography>
              <Chip label={usersCount} size="small" color="primary" />
            </Box>
            <Paper 
              elevation={0}
              sx={{ 
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                overflow: 'hidden'
              }}
            >
              {results.userStats.map((user, index) => {
                const badge = getStatusBadge(user)
                return (
                  <Box key={user.id}>
                    <ListItem
                      button
                      onClick={() => navigate(`/profile/${user.username}`)}
                      sx={{
                        py: 2,
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          src={user.photo ? `http://localhost:5000/${user.photo}` : undefined}
                          sx={{ width: 56, height: 56 }}
                        >
                          {!user.photo && user.username?.slice(0, 2).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" fontWeight={600}>
                              {user.username}
                            </Typography>
                            {badge && (
                              <Chip
                                icon={<span style={{ fontSize: '0.9rem' }}>{badge.icon}</span>}
                                label={badge.text}
                                color={badge.color}
                                size="small"
                                sx={{ height: 24 }}
                              />
                            )}
                          </Box>
                        }
                      />
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/profile/${user.username}`)
                        }}
                      >
                        عرض
                      </Button>
                    </ListItem>
                    {index < results.userStats.length - 1 && <Divider />}
                  </Box>
                )
              })}
            </Paper>
          </Box>
        )}

        {/* Groups Section */}
        {groupsCount > 0 && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <GroupIcon color="secondary" />
              <Typography variant="h6" fontWeight={600}>
                المجموعات
              </Typography>
              <Chip label={groupsCount} size="small" color="secondary" />
            </Box>
            <Stack spacing={2}>
              {results.groupsStats.map((group) => {
                const badge = getGroupBadge(group)
                return (
                  <Card
                    key={group.id}
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: 4
                      }
                    }}
                    onClick={() => navigate(`/groups/${group.name}`)}
                  >
                    <Box sx={{ display: 'flex', gap: 2, p: 2 }}>
                      <Avatar
                        src={group.photo ? `http://localhost:5000/${group.photo}` : undefined}
                        variant="rounded"
                        sx={{ width: 80, height: 80, bgcolor: 'secondary.main' }}
                      >
                        <GroupIcon sx={{ fontSize: 40 }} />
                      </Avatar>
                      
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                          <Typography variant="h6" fontWeight={600} noWrap>
                            {group.name}
                          </Typography>
                          {badge && (
                            <Chip
                              icon={<span style={{ fontSize: '0.9rem' }}>{badge.icon}</span>}
                              label={badge.text}
                              color={badge.color}
                              size="small"
                            />
                          )}
                        </Box>
                        
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            mb: 1
                          }}
                        >
                          {group.description}
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                          <Typography variant="caption" color="text.secondary">
                            👥 {group.numberMembers} عضو
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {group.privacy === 'public' ? '🌐 عامة' : '🔒 خاصة'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Card>
                )
              })}
            </Stack>
          </Box>
        )}

        {/* Blogs Section */}
        {blogsCount > 0 && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <ArticleIcon color="info" />
              <Typography variant="h6" fontWeight={600}>
                المنشورات
              </Typography>
              <Chip label={blogsCount} size="small" color="info" />
            </Box>
            <Stack spacing={3}>
              {results.blogsData.filter(blog => blog && blog.id).map((blog) => (
                <BlogCard
                  key={blog.id}
                  blog={blog}
                  isAuthed={isAuthed}
                  onUpdateBlog={handleUpdateBlog}
                  onDeleteBlog={handleDeleteBlog}
                />
              ))}
            </Stack>
          </Box>
        )}
      </Stack>
    </Container>
  )
}
