import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Stack,
  Tabs,
  Tab,
  Avatar,
  Chip,
  Divider,
  Card,
  CardContent,
  Grid,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  People as PeopleIcon,
  Lock as LockIcon,
  Public as PublicIcon,
  ArrowBack as ArrowBackIcon,
  PersonAdd as PersonAddIcon,
  Close as CloseIcon,
  Image as ImageIcon,
  Send as SendIcon,
  Dashboard as DashboardIcon
} from '@mui/icons-material'
import { getGroup, joinGroup, leaveGroup, cancelJoinGroup, addGroupPost, storage, API_BASE } from '../lib/api'
import BlogCard from '../components/BlogCard'
import CreateBlogDialog from '../components/CreateBlogDialog'

export default function GroupDetails() {
  const { groupName } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [groupData, setGroupData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const isAuthed = !!storage.token
  
  // Get current tab from URL or default to 0
  const currentTab = parseInt(searchParams.get('tab') || '0', 10)
  
  const handleTabChange = (event, newValue) => {
    setSearchParams({ tab: newValue.toString() })
  }

  useEffect(() => {
    loadGroupData()
  }, [groupName])

  const loadGroupData = async () => {
    try {
      setLoading(true)
      console.log('Loading group:', groupName)
      const { data } = await getGroup(groupName)
      console.log('Group data received:', data)
      console.log('Role:', data.groupData?.role)
      console.log('Description:', data.groupData?.description)
      console.log('isMember check:', ['owner', 'Admin', 'Moderator', 'member', 'Member'].includes(data.groupData?.role))
      setGroupData(data.groupData)
    } catch (err) {
      console.error('Error loading group:', err)
      console.error('Error details:', err.response?.data)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinGroup = async () => {
    try {
      setJoining(true)
      
      if (groupData.isRequest) {
        // Cancel pending request
        await cancelJoinGroup(groupName)
        setGroupData(prev => ({
          ...prev,
          isRequest: false
        }))
      } else {
        // Join or request to join
        await joinGroup(groupName)
        setGroupData(prev => ({
          ...prev,
          isRequest: groupData.privacy === 'private' ? true : false,
          role: groupData.privacy === 'public' ? 'member' : 'guest'
        }))
      }
    } catch (err) {
      console.error('Error joining group:', err)
    } finally {
      setJoining(false)
    }
  }

  const handleLeaveGroup = async () => {
    try {
      setJoining(true)
      await leaveGroup(groupName)
      setLeaveDialogOpen(false)
      setGroupData(prev => ({
        ...prev,
        role: 'guest'
      }))
    } catch (err) {
      console.error('Error leaving group:', err)
    } finally {
      setJoining(false)
    }
  }

  const handleCreatePost = async (postData) => {
    try {
      const formData = new FormData()
      formData.append('groupName', groupName)
      formData.append('title', postData.title)
      formData.append('content', postData.content)
      if (postData.photo) {
        formData.append('photo', postData.photo)
      }

      await addGroupPost(formData)
      await loadGroupData()
    } catch (err) {
      console.error('Error adding post:', err)
      throw err
    }
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography textAlign="center">جاري التحميل...</Typography>
      </Container>
    )
  }

  if (!groupData) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography textAlign="center">المجموعة غير موجودة</Typography>
      </Container>
    )
  }

  const isOwner = groupData.role?.toLowerCase() === 'owner'
  const isAdmin = groupData.role?.toLowerCase() === 'admin'
  const isMember = ['owner', 'admin', 'moderator', 'member'].includes(groupData.role?.toLowerCase())
  const isGuest = groupData.role?.toLowerCase() === 'guest'
  const isPublic = groupData.privacy === 'public'
  const canViewPosts = isMember || isPublic
  const canAddPost = isMember

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 }, px: { xs: 1, sm: 2 } }}>
      {/* Back Button */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/groups')}
        sx={{ mb: 2 }}
      >
        رجوع للمجموعات
      </Button>

      {/* Cover Image */}
      <Paper sx={{ mb: 3, overflow: 'hidden', borderRadius: 2 }}>
        <Box
          component="img"
          src={`${API_BASE}/${groupData.photo}`}
          alt={groupData.name}
          sx={{
            width: '100%',
            height: { xs: 200, sm: 300, md: 400 },
            objectFit: 'cover'
          }}
        />
      </Paper>

      {/* Group Info */}
      <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3, borderRadius: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
          <Box>
            <Typography variant="h4" fontWeight={700} mb={1}>
              {groupData.name}
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Chip
                icon={groupData.privacy === 'private' ? <LockIcon /> : <PublicIcon />}
                label={groupData.privacy === 'private' ? 'خاصة' : 'عامة'}
                size="small"
              />
              <Chip
                icon={<PeopleIcon />}
                label={`${groupData.numberMembers || 0} عضو`}
                size="small"
              />
            </Stack>
          </Box>

          {isAuthed && (
            <>
              {(isOwner || isAdmin) ? (
                <Button
                  variant="contained"
                  startIcon={<DashboardIcon />}
                  onClick={() => navigate(`/groups/${groupName}/dashboard`)}
                  sx={{ 
                    minWidth: 150,
                    fontWeight: 600,
                    borderRadius: 2,
                    textTransform: 'none',
                    background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                    boxShadow: '0 3px 5px 2px rgba(102, 126, 234, .3)',
                    color: 'white',
                    '& .MuiButton-startIcon': {
                      marginRight: '12px'
                    },
                    '&:hover': {
                      background: 'linear-gradient(45deg, #5568d3 30%, #653a91 90%)',
                      boxShadow: '0 6px 10px 4px rgba(102, 126, 234, .3)',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  لوحة التحكم
                </Button>
              ) : isMember ? (
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => setLeaveDialogOpen(true)}
                  sx={{ 
                    minWidth: 150,
                    fontWeight: 600,
                    borderRadius: 2,
                    textTransform: 'none',
                    boxShadow: 2,
                    '&:hover': {
                      bgcolor: 'success.dark',
                      boxShadow: 4
                    }
                  }}
                >
                  ✓ تم الانضمام
                </Button>
              ) : (
                <Button
                  variant={groupData.isRequest ? 'outlined' : 'contained'}
                  color={groupData.isRequest ? 'error' : 'primary'}
                  startIcon={groupData.isRequest ? <CloseIcon /> : <PersonAddIcon />}
                  onClick={handleJoinGroup}
                  disabled={joining}
                  sx={{ 
                    minWidth: 150,
                    fontWeight: 600,
                    borderRadius: 2,
                    textTransform: 'none',
                    boxShadow: groupData.isRequest ? 0 : 2,
                    '& .MuiButton-startIcon': {
                      marginRight: '12px'
                    },
                    ...(groupData.isRequest && {
                      borderWidth: 2,
                      '&:hover': {
                        borderWidth: 2,
                        bgcolor: 'error.light',
                        color: 'white'
                      }
                    }),
                    ...(!groupData.isRequest && {
                      '&:hover': {
                        boxShadow: 4
                      }
                    })
                  }}
                >
                  {groupData.isRequest ? 'إلغاء الطلب' : joining ? 'جاري الانضمام...' : 'انضم للمجموعة'}
                </Button>
              )}
            </>
          )}
        </Stack>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="حول" />
          <Tab label="مناقشة" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {currentTab === 0 ? (
        // حول Tab
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" fontWeight={600} mb={2}>
                نبذة عن المجموعة
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Stack spacing={2}>
                {/* Description */}
                {groupData.description && groupData.description.trim() && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" mb={0.5}>
                      الوصف
                    </Typography>
                    <Typography variant="body1">
                      {groupData.description}
                    </Typography>
                  </Box>
                )}

                {groupData.description && <Divider />}

                <Box>
                  <Typography variant="subtitle2" color="text.secondary" mb={0.5}>
                    الخصوصية
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    {groupData.privacy === 'private' ? (
                      <>
                        <LockIcon fontSize="small" />
                        <Typography>مجموعة خاصة</Typography>
                      </>
                    ) : (
                      <>
                        <PublicIcon fontSize="small" />
                        <Typography>مجموعة عامة</Typography>
                      </>
                    )}
                  </Stack>
                  <Typography variant="body2" color="text.secondary" mt={0.5}>
                    {groupData.privacy === 'private' 
                      ? 'يمكن لأي شخص العثور على هذه المجموعة، لكن الأعضاء فقط يمكنهم رؤية المنشورات'
                      : 'يمكن لأي شخص رؤية الأعضاء والمنشورات'}
                  </Typography>
                </Box>

                <Divider />


                <Box>
                  <Typography variant="subtitle2" color="text.secondary" mb={0.5}>
                    السجل
                  </Typography>
                  <Typography>
                    تم إنشاء المجموعة في {new Date(groupData.createdAt).toLocaleDateString('ar-EG')}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" fontWeight={600} mb={2}>
                المسؤول
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Stack 
                direction="row" 
                alignItems="center" 
                spacing={2}
                component={Link}
                to={`/profile/${Array.isArray(groupData.ownerGroup) ? groupData.ownerGroup[0] : groupData.ownerGroup}`}
                sx={{ 
                  textDecoration: 'none', 
                  color: 'inherit',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    borderRadius: 1
                  },
                  p: 1,
                  mx: -1,
                  transition: 'background-color 0.2s'
                }}
              >
                <Avatar 
                  src={Array.isArray(groupData.ownerGroup) && groupData.ownerGroup[1] ? `${API_BASE}/${groupData.ownerGroup[1]}` : undefined}
                  sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}
                >
                  {Array.isArray(groupData.ownerGroup) 
                    ? groupData.ownerGroup[0]?.charAt(0).toUpperCase() 
                    : groupData.ownerGroup?.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography fontWeight={600}>
                    {Array.isArray(groupData.ownerGroup) ? groupData.ownerGroup[0] : groupData.ownerGroup}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    مسؤول المجموعة
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      ) : (
        // مناقشة Tab
        <Box>
          {canViewPosts ? (
            <>
              {/* Add Post Button - Only for members */}
              {canAddPost && (
                <Box sx={{ mb: 3, textAlign: 'center' }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<AddIcon />}
                    onClick={() => setCreateDialogOpen(true)}
                    sx={{ 
                      borderRadius: 2,
                      px: 4,
                      py: 1.5,
                      fontSize: '1rem',
                      fontWeight: 600
                    }}
                  >
                    إنشاء منشور جديد
                  </Button>
                </Box>
              )}

              {/* Posts List */}
              {groupData.Blogs && groupData.Blogs.length > 0 ? (
                <Stack spacing={0}>
                  {groupData.Blogs.map((blog) => (
                    <BlogCard
                      key={blog.id}
                      blog={blog}
                      isAuthed={isAuthed}
                      onUpdateBlog={null}
                      onAddComment={null}
                      onDeleteBlog={() => loadGroupData()}
                      userRole={groupData.role}
                    />
                  ))}
                </Stack>
              ) : (
                <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                  <Typography color="text.secondary">
                    لا توجد منشورات بعد. كن أول من ينشر!
                  </Typography>
                </Paper>
              )}
            </>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
              <LockIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" mb={1}>
                محتوى خاص
              </Typography>
              <Typography color="text.secondary">
                يجب أن تكون عضواً لرؤية منشورات المجموعة
              </Typography>
            </Paper>
          )}
        </Box>
      )}

      {/* Create Post Dialog */}
      <CreateBlogDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreated={async () => {
          setCreateDialogOpen(false)
          // Reload to get the new post
          await loadGroupData()
        }}
        groupName={groupName}
      />

      {/* Leave Group Dialog */}
      <Dialog
        open={leaveDialogOpen}
        onClose={() => setLeaveDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>مغادرة المجموعة</DialogTitle>
        <DialogContent>
          <Typography>
            هل أنت متأكد من مغادرة مجموعة <strong>{groupData?.name}</strong>؟
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            لن تتمكن من رؤية منشورات المجموعة بعد المغادرة.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLeaveDialogOpen(false)}>
            إلغاء
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleLeaveGroup}
            disabled={joining}
          >
            {joining ? 'جاري المغادرة...' : 'مغادرة'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
