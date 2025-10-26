import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSocket } from '../contexts/SocketContext'
import { useChat } from '../contexts/ChatContext'
import {
  Box,
  Container,
  Avatar,
  Typography,
  Stack,
  Button,
  Tabs,
  Tab,
  Grid,
  Paper,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Alert,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material'
import {
  Edit as EditIcon,
  Share as ShareIcon,
  Settings as SettingsIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  PhotoCamera as PhotoCameraIcon,
  Add as AddIcon,
  Block as BlockIcon,
  Verified as VerifiedIcon,
  Search as SearchIcon
} from '@mui/icons-material'
import { storage, getProfile, deleteBlog, updateProfile, acceptFriendRequest, rejectFriendRequest, cancelFriend, blockUser, searchUserBlogs } from '../lib/api'
import BlogCard from '../components/BlogCard'
import CreateBlogDialog from '../components/CreateBlogDialog'
import { formatNumber } from '../utils/formatNumber'

export default function Profile() {
  const { username } = useParams()
  const navigate = useNavigate()
  const { openChat } = useChat()
  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [blogsLastNumber, setBlogsLastNumber] = useState(0)
  const [open, setOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const currentUser = storage.user
  const isOwnProfile = currentUser?.username === username

  const [updateData, setUpdateData] = useState({
    username: '',
    email: '',
    password: '',
    photo: null
  })
  const [updateLoading, setUpdateLoading] = useState(false)
  const [updateError, setUpdateError] = useState('')
  const [createBlogOpen, setCreateBlogOpen] = useState(false)
  const [friendRequestSent, setFriendRequestSent] = useState(false)
  
  // Search states
  const [searchDialogOpen, setSearchDialogOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState(null)
  const [blockDialogOpen, setBlockDialogOpen] = useState(false)
  const [blockLoading, setBlockLoading] = useState(false)
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
  const [tabValue, setTabValue] = useState(0)

  useEffect(() => {
    loadProfile()
  }, [username])

  const loadProfile = async (reset = true) => {
    try {
      const currentLastNumber = reset ? 0 : blogsLastNumber
      reset ? setLoading(true) : setLoadingMore(true)
      
      const { data } = await getProfile(username, currentLastNumber)
      console.log('🔍 Profile data received:', data)
      console.log('👤 User data:', data.userData)
      console.log('✅ Verified status:', data.userData?.verified)
      
      if (reset) {
        setProfileData(data)
        setBlogsLastNumber(data.blogs?.length || 0)
      } else {
        setProfileData(prev => ({
          ...prev,
          blogs: [...(prev.blogs || []), ...(data.blogs || [])]
        }))
        setBlogsLastNumber(prev => prev + (data.blogs?.length || 0))
      }
      
      // Check if there are more blogs
      setHasMore((data.blogs?.length || 0) === 20) // Backend limit is 20 for profile
      
    } catch (err) {
      console.error('❌ Failed to load profile:', err)
      if (reset) setProfileData(null)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMoreBlogs = () => {
    if (!loadingMore && hasMore) {
      loadProfile(false)
    }
  }

  const handleUpdateBlog = (updatedBlog) => {
    if (!profileData) return
    setProfileData(prev => ({
      ...prev,
      blogs: prev.blogs?.map(blog => 
        blog.id === updatedBlog.id ? updatedBlog : blog
      ) || []
    }))
  }

  const handleDeleteBlog = (blogId) => {
    if (!profileData) return
    setProfileData(prev => ({
      ...prev,
      blogs: prev.blogs?.filter(blog => blog.id !== blogId) || []
    }))
  }

  const handleUpdateProfile = () => {
    setUpdateDialogOpen(true)
    setUpdateData({
      username: currentUser?.username || '',
      email: currentUser?.email || '',
      password: '',
      photo: null
    })
    setUpdateError('')
  }

  const handleUpdateSubmit = async (e) => {
    e.preventDefault()
    if (updateLoading) return

    try {
      setUpdateLoading(true)
      setUpdateError('')

      const formData = new FormData()

      if (updateData.username.trim()) {
        formData.append('username', updateData.username.trim())
      }
      if (updateData.email.trim()) {
        formData.append('email', updateData.email.trim())
      }
      if (updateData.password.trim()) {
        formData.append('password', updateData.password.trim())
      }
      if (updateData.photo) {
        formData.append('photo', updateData.photo)
      }

      const { data } = await updateProfile(formData)
      
      // تحديث بيانات المستخدم في الـ storage
      const updatedUser = data.userUpdate
      storage.user = updatedUser
      
      setUpdateDialogOpen(false)
      
      // إذا تغير الـ username، اعيد توجيه للـ profile الجديد
      if (updatedUser.username !== currentUser.username) {
        window.location.href = `/profile/${updatedUser.username}`
      } else {
        // إعادة تحميل الصفحة لتحديث البيانات
        window.location.reload()
      }
    } catch (err) {
      setUpdateError(err.message || 'حدث خطأ ما')
    } finally {
      setUpdateLoading(false)
    }
  }

  const handleAddBlog = (newBlog) => {
    if (!profileData) return
    setProfileData(prev => ({
      ...prev,
      blogs: [newBlog, ...(prev.blogs || [])]
    }))
    setCreateBlogOpen(false)
  }

  const handleSearchBlogs = async () => {
    if (!searchValue.trim()) return
    
    setSearchLoading(true)
    try {
      const response = await searchUserBlogs(username, searchValue)
      setSearchResults(response.data.blogsData || [])
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  const getFriendButtonText = () => {
    // Show loading state during request
    if (friendRequestSent) return 'جاري الإرسال...'
    
    if (!profileData?.statusUser) return 'إضافة صديق'
    
    const { isRequestSent, isReceivedRequest } = profileData.statusUser
    
    if (isRequestSent) {
      return 'إلغاء الطلب'
    } else if (isReceivedRequest) {
      return 'قبول الطلب'
    } else {
      return 'إضافة صديق'
    }
  }

  const getButtonColor = () => {
    if (!profileData?.statusUser) return 'primary'
    
    const { isRequestSent, isReceivedRequest } = profileData.statusUser
    
    if (isRequestSent) {
      return 'error' // أحمر للإلغاء
    } else if (isReceivedRequest) {
      return 'success' // أخضر للقبول
    } else {
      return 'primary' // أزرق للإضافة
    }
  }

  const handleFriendAction = () => {
    if (!profileData?.statusUser) {
      handleSendFriendRequest()
      return
    }
    
    const { isRequestSent, isReceivedRequest } = profileData.statusUser
    
    if (isRequestSent) {
      // إلغاء الطلب
      handleCancelFriendRequest()
    } else if (isReceivedRequest) {
      // قبول الطلب
      handleAcceptFriendRequest()
    } else {
      // إضافة صديق
      handleSendFriendRequest()
    }
  }

  const handleSendFriendRequest = () => {
    if (!username) return
    setFriendRequestSent(true)
  }

  const handleCancelFriendRequest = async () => {
    try {
      setFriendRequestSent(true)
      // إلغاء طلب أنا بعته - service = "reject"
      await rejectFriendRequest(username, "reject")
      
      // Update UI immediately
      setProfileData(prev => ({
        ...prev,
        statusUser: {
          ...prev.statusUser,
          isRequestSent: false,
          isReceivedRequest: false,
          isFriend: false
        }
      }))
      
      console.log('✅ تم إلغاء طلب الصداقة')
    } catch (err) {
      console.error('❌ خطأ في إلغاء الطلب:', err)
    } finally {
      setFriendRequestSent(false)
    }
  }

  const handleAcceptFriendRequest = async () => {
    try {
      setFriendRequestSent(true)
      await acceptFriendRequest(username)
      
      // Update UI immediately - now they are friends
      setProfileData(prev => ({
        ...prev,
        statusUser: {
          ...prev.statusUser,
          isRequestSent: false,
          isReceivedRequest: false,
          isFriend: true
        }
      }))
      
      console.log('✅ تم قبول طلب الصداقة')
    } catch (err) {
      console.error('❌ خطأ في قبول الطلب:', err)
    } finally {
      setFriendRequestSent(false)
    }
  }

  const handleRejectFriendRequest = async () => {
    try {
      setFriendRequestSent(true)
      // رفض طلب هو بعته - service = "rejectRequest"
      await rejectFriendRequest(username, "rejectRequest")
      
      // Update UI immediately
      setProfileData(prev => ({
        ...prev,
        statusUser: {
          ...prev.statusUser,
          isRequestSent: false,
          isReceivedRequest: false,
          isFriend: false
        }
      }))
      
      console.log('✅ تم رفض طلب الصداقة')
    } catch (err) {
      console.error('❌ خطأ في رفض الطلب:', err)
    } finally {
      setFriendRequestSent(false)
    }
  }

  const handleUnfriend = () => {
    // فتح Dialog التأكيد المخصص
    setConfirmDialogOpen(true)
  }

  const confirmUnfriend = async () => {
    try {
      setFriendRequestSent(true)
      setConfirmDialogOpen(false)
      
      // استخدام API المخصص لإلغاء الصداقة
      await cancelFriend(username)
      
      // Update UI immediately - back to no relationship
      setProfileData(prev => ({
        ...prev,
        statusUser: {
          ...prev.statusUser,
          isRequestSent: false,
          isReceivedRequest: false,
          isFriend: false
        }
      }))
    } catch (err) {
      console.error('❌ خطأ في إلغاء الصداقة:', err)
    } finally {
      setFriendRequestSent(false)
    }
  }

  const handleBlockUser = async () => {
    setBlockDialogOpen(false)
    setMenuAnchor(null)
    setBlockLoading(true)
    
    try {
      await blockUser(username)
      // Navigate away after successful block
      navigate('/')
    } catch (err) {
      console.error('❌ خطأ في حظر المستخدم:', err)
      alert(err.message || 'فشل في حظر المستخدم')
    } finally {
      setBlockLoading(false)
    }
  }


  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress color="secondary" />
      </Box>
    )
  }

  if (!profileData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography>المستخدم غير موجود</Typography>
      </Box>
    )
  }

  const profile = profileData
  const { isOwner, blogs } = profileData
  const userInitials = (username || 'U').slice(0, 2).toUpperCase()

  return (
    <>
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 }, px: { xs: 1, sm: 2 } }}>
      {/* Profile Header */}
      <Paper sx={{ p: { xs: 2, sm: 3, md: 4 }, mb: 3, borderRadius: 2, position: 'relative', overflow: 'visible' }}>
        {/* More Options Menu - Only show for other users */}
        {!isOwnProfile && (
          <>
            <IconButton
              onClick={(e) => setMenuAnchor(e.currentTarget)}
              sx={{ 
                position: 'absolute',
                top: 16,
                left: 16,
                zIndex: 10,
                bgcolor: 'background.paper',
                boxShadow: 1,
                '&:hover': {
                  bgcolor: 'action.hover'
                }
              }}
            >
              <MoreVertIcon />
            </IconButton>
            
            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={() => setMenuAnchor(null)}
            >
              <MenuItem
                onClick={() => {
                  setMenuAnchor(null)
                  setBlockDialogOpen(true)
                }}
                sx={{ color: 'error.main' }}
              >
                <BlockIcon sx={{ mr: 1 }} />
                حظر المستخدم
              </MenuItem>
            </Menu>
          </>
        )}
        
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems={{ xs: 'center', md: 'flex-start' }}>
          {/* Avatar */}
          <Avatar
            src={profile.userData?.photo ? `http://localhost:5000/${profile.userData.photo}` : undefined}
            sx={{
              width: 120,
              height: 120,
              fontSize: '2.5rem',
              fontWeight: 600,
              bgcolor: 'primary.main'
            }}
          >
            {!profile.userData?.photo && userInitials}
          </Avatar>

          {/* Profile Info */}
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
              <Typography variant="h4" fontWeight={600}>
                {username}
              </Typography>
              {profile.userData?.verified && (
                <VerifiedIcon 
                  sx={{ 
                    color: '#1DA1F2', 
                    fontSize: '1.8rem',
                    filter: 'drop-shadow(0 2px 4px rgba(29, 161, 242, 0.3))'
                  }} 
                />
              )}
            </Stack>

            {/* Stats */}
            <Stack direction="row" spacing={12} sx={{ mb: 2, justifyContent: 'space-around', width: '100%' }}>
              <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                <Typography variant="h6" fontWeight={600}>
                  {formatNumber(profile.likes)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  الإعجابات
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                <Typography variant="h6" fontWeight={600}>
                  {formatNumber(profile.followers)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  المتابعين
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                <Typography variant="h6" fontWeight={600}>
                  {formatNumber(profile.UserFollows)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  أتابعه
                </Typography>
              </Box>
            </Stack>

            {/* Bio */}
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              لا توجد سيرة ذاتية بعد.
            </Typography>

            {/* Action Buttons */}
            <Stack direction="row" spacing={2}>
              {isOwner ? (
                <>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    sx={{ minWidth: 120 }}
                    onClick={() => setCreateBlogOpen(true)}
                  >
                    إضافة مدونة
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={handleUpdateProfile}
                  >
                    تعديل الملف الشخصي
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<SettingsIcon />}
                    onClick={() => navigate('/settings')}
                  >
                    الإعدادات
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<SearchIcon />}
                    onClick={() => setSearchDialogOpen(true)}
                    color="info"
                  >
                    البحث في المنشورات
                  </Button>
                </>
              ) : (
                <>
                  {profileData?.statusUser?.isFriend ? (
                    // إذا كانوا أصدقاء بالفعل
                    <>
                      <Button
                        variant="contained"
                        color="success"
                        onClick={handleUnfriend}
                        disabled={friendRequestSent}
                        sx={{ minWidth: 120 }}
                      >
                        ✓ أصدقاء
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => openChat(username)}
                      >
                        رسالة
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<SearchIcon />}
                        onClick={() => setSearchDialogOpen(true)}
                        color="info"
                      >
                        البحث في المنشورات
                      </Button>
                    </>
                  ) : profileData?.statusUser?.isReceivedRequest ? (
                    // إذا كان هناك طلب صداقة مستلم - عرض زرين قبول/رفض
                    <>
                      <Button
                        variant="contained"
                        color="success"
                        onClick={handleAcceptFriendRequest}
                        disabled={friendRequestSent}
                        sx={{ minWidth: 100 }}
                      >
                        قبول الطلب
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={handleRejectFriendRequest}
                        disabled={friendRequestSent}
                        sx={{ minWidth: 100 }}
                      >
                        رفض الطلب
                      </Button>
                    </>
                  ) : (
                    // الحالات العادية - زر واحد فقط
                    <>
                      <Button
                        variant="contained"
                        startIcon={<PersonIcon />}
                        onClick={handleFriendAction}
                        disabled={friendRequestSent}
                        color={getButtonColor()}
                        sx={{ minWidth: 120 }}
                      >
                        {getFriendButtonText()}
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<SearchIcon />}
                        onClick={() => setSearchDialogOpen(true)}
                        color="info"
                      >
                        البحث في المنشورات
                      </Button>
                    </>
                  )}
                </>
              )}
            </Stack>
          </Box>
        </Stack>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ borderRadius: 2 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab label="المنشورات" />
        </Tabs>

        {/* Tab Content */}
        <Box sx={{ p: 3, minHeight: 400 }}>
          <Box>
            {blogs && blogs.length > 0 ? (
              <Grid container spacing={2}>
                {blogs.map((blog, idx) => (
                  <Grid item xs={12} key={blog.id || idx}>
                    <BlogCard 
                      blog={blog} 
                      isAuthed={!!storage.token}
                      onUpdateBlog={handleUpdateBlog}
                      onAddComment={() => {}}
                      onDeleteBlog={handleDeleteBlog}
                    />
                  </Grid>
                ))}
                
                {/* Load More Button */}
                {hasMore && !loading && (
                  <Grid item xs={12}>
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <Button
                        variant="outlined"
                        onClick={loadMoreBlogs}
                        disabled={loadingMore}
                        sx={{ minWidth: 200 }}
                      >
                        {loadingMore ? (
                          <>
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                            جاري التحميل...
                          </>
                        ) : (
                          'تحميل المزيد'
                        )}
                      </Button>
                    </Box>
                  </Grid>
                )}
              </Grid>
            ) : (
              <Box sx={{ 
                textAlign: 'center', 
                py: 8,
                color: 'text.secondary'
              }}>
                <Box sx={{ 
                  width: 80, 
                  height: 80, 
                  bgcolor: 'grey.100', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3
                }}>
                  <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: 0.5,
                    width: 24,
                    height: 24
                  }}>
                    {[...Array(4)].map((_, i) => (
                      <Box key={i} sx={{ 
                        width: 10, 
                        height: 10, 
                        bgcolor: 'grey.400', 
                        borderRadius: 0.5 
                      }} />
                    ))}
                  </Box>
                </Box>
                
                {isOwner ? (
                  <>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                      قم بمشاركة أول منشور لك
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      منشوراتك ستظهر هنا
                    </Typography>
                  </>
                ) : (
                  <>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                      لا توجد منشورات
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      لم يقم {username} بنشر أي منشورات بعد
                    </Typography>
                  </>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>

      {/* Update Profile Dialog */}
    <Dialog
      open={updateDialogOpen}
      onClose={() => setUpdateDialogOpen(false)}
      maxWidth="sm"
      fullWidth
    >
      <form onSubmit={handleUpdateSubmit}>
        <DialogTitle sx={{
          textAlign: 'center',
          fontWeight: 600,
          bgcolor: 'primary.main',
          color: 'white',
          py: 3
        }}>
          تعديل الملف الشخصي
        </DialogTitle>

        <DialogContent sx={{ p: 4 }}>
          {updateError && (
            <Typography color="error" sx={{ mb: 2, textAlign: 'center' }}>
              {updateError}
            </Typography>
          )}
          <Stack spacing={3}>
            {/* Username */}
            <TextField
              label="اسم المستخدم"
              value={updateData.username}
              onChange={(e) => setUpdateData(prev => ({ ...prev, username: e.target.value }))}
              variant="outlined"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="action" />
                  </InputAdornment>
                )
              }}
            />

            {/* Email */}
            <TextField
              label="البريد الإلكتروني"
              type="email"
              value={updateData.email}
              onChange={(e) => setUpdateData(prev => ({ ...prev, email: e.target.value }))}
              variant="outlined"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                )
              }}
            />

            {/* Password */}
            <TextField
              label="كلمة المرور الجديدة"
              type="password"
              value={updateData.password}
              onChange={(e) => setUpdateData(prev => ({ ...prev, password: e.target.value }))}
              variant="outlined"
              fullWidth
              placeholder="اتركها فارغة إذا لم تريد تغييرها"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                )
              }}
            />

            {/* Photo Upload */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
                صورة الملف الشخصي
              </Typography>
              <Button
                variant="outlined"
                component="label"
                startIcon={<PhotoCameraIcon />}
                sx={{ width: '100%', py: 2 }}
              >
                اختر صورة جديدة
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => setUpdateData(prev => ({ ...prev, photo: e.target.files[0] }))}
                />
              </Button>
              {updateData.photo && (
                <Typography variant="caption" color="success.main" sx={{ mt: 1, display: 'block' }}>
                  تم اختيار: {updateData.photo.name}
                </Typography>
              )}
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={() => setUpdateDialogOpen(false)}
            disabled={updateLoading}
          >
            إلغاء
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={updateLoading}
            sx={{ minWidth: 100 }}
          >
            {updateLoading ? <CircularProgress size={20} /> : 'حفظ التغييرات'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>

      {/* Create Blog Dialog */}
      <CreateBlogDialog
        open={createBlogOpen}
        onClose={() => setCreateBlogOpen(false)}
        onAddBlog={handleAddBlog}
      />

      {/* Custom Confirm Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
          }
        }}
      >
        <DialogTitle sx={{
          textAlign: 'center',
          fontWeight: 600,
          bgcolor: 'error.main',
          color: 'white',
          py: 3,
          fontSize: '1.2rem'
        }}>
          ⚠️ تأكيد إلغاء الصداقة
        </DialogTitle>

        <DialogContent sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
            هل تريد إلغاء الصداقة مع {username}؟
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
            سيتم إزالة {username} من قائمة أصدقائك وستحتاج لإرسال طلب صداقة جديد للتواصل معه مرة أخرى.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ p: 3, justifyContent: 'center', gap: 2 }}>
          <Button
            onClick={() => setConfirmDialogOpen(false)}
            variant="outlined"
            sx={{ 
              minWidth: 120,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            إلغاء
          </Button>
          <Button
            onClick={confirmUnfriend}
            variant="contained"
            color="error"
            disabled={friendRequestSent}
            sx={{ 
              minWidth: 120,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            {friendRequestSent ? 'جاري الإلغاء...' : 'نعم، إلغاء الصداقة'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Block User Confirmation Dialog */}
      <Dialog
        open={blockDialogOpen}
        onClose={() => setBlockDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 700,
          fontSize: '1.5rem',
          color: 'error.main',
          textAlign: 'center',
          pb: 1
        }}>
          ⚠️ تأكيد الحظر
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              <Typography variant="body1" fontWeight={500}>
                هل أنت متأكد من حظر <strong>{username}</strong>؟
              </Typography>
            </Alert>
            <Typography variant="body2" color="text.secondary">
              • سيتم إلغاء الصداقة إذا كنتما أصدقاء
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • سيتم إلغاء أي طلب صداقة معلق
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • لن تستطيع رؤية منشورات بعضكما البعض
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • لن تستطيع إرسال رسائل لبعضكما البعض
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setBlockDialogOpen(false)}
            variant="outlined"
            disabled={blockLoading}
            sx={{ 
              minWidth: 100,
              borderRadius: 2,
              textTransform: 'none'
            }}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleBlockUser}
            variant="contained"
            color="error"
            disabled={blockLoading}
            sx={{ 
              minWidth: 120,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            {blockLoading ? 'جاري الحظر...' : 'نعم، حظر المستخدم'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Search Blogs Dialog */}
      <Dialog
        open={searchDialogOpen}
        onClose={() => setSearchDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>🔍 البحث في منشورات {profileData?.userData?.username}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="ابحث في المنشورات"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="اكتب كلمة البحث..."
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleSearchBlogs} disabled={searchLoading}>
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchBlogs()}
            />
            
            {searchLoading && (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <CircularProgress />
              </Box>
            )}
            
            {/* Search Results */}
            {searchResults.length > 0 && !searchLoading && (
              <Stack spacing={2}>
                <Typography variant="h6">نتائج البحث ({searchResults.length})</Typography>
                {searchResults.map((blog, index) => (
                  <BlogCard key={blog.id || index} blog={blog} />
                ))}
              </Stack>
            )}
            
            {searchResults.length === 0 && searchValue && !searchLoading && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  لا توجد نتائج للبحث "{searchValue}"
                </Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setSearchDialogOpen(false)
            setSearchValue('')
            setSearchResults([])
          }}>
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>

    </>
  )
}
