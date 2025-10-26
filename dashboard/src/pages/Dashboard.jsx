import { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  InputAdornment,
  Divider,
  Stack,
  Fade,
  Slide,
  Zoom,
  Badge,
  Tooltip,
  FormControl,
  InputLabel,
  Select
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Article as ArticleIcon,
  Visibility as VisibilityIcon,
  AccountCircle as AccountIcon,
  Logout as LogoutIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  ManageAccounts as ManageAccountsIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'
import { getDashboardHome, logoutUser, API_BASE, isAuthenticated, searchUser, getUserLastSeen, banUser, unbanUser, getUserProfile, deleteUser, updateProfileStatus, updateUserData, verifyUser, removeVerifyUser, getFavUser, getUserBlocks, createBlogUser, getUserSecurityLogs, sendBroadcastNotification, startTokenRefreshTimer, stopTokenRefreshTimer } from '../lib/api'
import { useNavigate } from 'react-router-dom'

// Enhanced Stats Card Component
function StatsCard({ title, value, todayValue, icon, color, filterDays = 0 }) {
  const getPeriodText = (days) => {
    if (days === 0) return "اليوم"
    if (days === 1) return "آخر يوم"
    if (days === 7) return "آخر أسبوع"
    if (days === 30) return "آخر شهر"
    return `آخر ${days} أيام`
  }

  return (
    <Zoom in timeout={500}>
      <Card 
        elevation={0}
        sx={{ 
          height: '100%',
          background: `linear-gradient(135deg, ${color === 'primary' ? '#667eea 0%, #764ba2 100%' : 
                                                color === 'success' ? '#11998e 0%, #38ef7d 100%' :
                                                color === 'info' ? '#3b82f6 0%, #1d4ed8 100%' :
                                                '#f093fb 0%, #f5576c 100%'})`,
          color: 'white',
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '100px',
            height: '100px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '50%',
            transform: 'translate(30px, -30px)',
          }
        }}
      >
        <CardContent sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 3,
                bgcolor: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2,
                backdropFilter: 'blur(10px)',
              }}
            >
              {icon}
            </Box>
            <Typography variant="h6" fontWeight={700} color="white">
              {title}
            </Typography>
          </Box>
          
          <Typography variant="h3" fontWeight={800} mb={1} color="white">
            {value?.toLocaleString() || 0}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
            إجمالي عام
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={`${getPeriodText(filterDays)}: ${todayValue?.toLocaleString() || 0}`}
              size="small"
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontWeight: 600,
                backdropFilter: 'blur(10px)',
              }}
            />
          </Box>
        </CardContent>
      </Card>
    </Zoom>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [anchorEl, setAnchorEl] = useState(null)
  const [activeTab, setActiveTab] = useState(0)
  const [filters, setFilters] = useState({
    blogDay: 0,
    userDay: 0,
    vistorDay: 0,
    analtyicsDay: 1
  })

  // User Management States
  const [searchUsername, setSearchUsername] = useState('')
  const [searchedUser, setSearchedUser] = useState(null)
  const [userLastSeen, setUserLastSeen] = useState([])
  const [userLoading, setUserLoading] = useState(false)
  const [banDialogOpen, setBanDialogOpen] = useState(false)
  const [banDays, setBanDays] = useState(1)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })
  
  // New Features States
  const [profileDialogOpen, setProfileDialogOpen] = useState(false)
  const [userProfile, setUserProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [updateProfileDialogOpen, setUpdateProfileDialogOpen] = useState(false)
  const [profileUpdateData, setProfileUpdateData] = useState({
    followers: '',
    UserFollows: '',
    likes: ''
  })
  
  // New User Management States
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false)
  const [userEditData, setUserEditData] = useState({
    username: '',
    email: '',
    password: ''
  })
  
  // New Features States
  const [favoritesDialogOpen, setFavoritesDialogOpen] = useState(false)
  const [userFavorites, setUserFavorites] = useState([])
  const [blocksDialogOpen, setBlocksDialogOpen] = useState(false)
  const [userBlocks, setUserBlocks] = useState([])
  const [createBlogDialogOpen, setCreateBlogDialogOpen] = useState(false)
  const [blogData, setBlogData] = useState({
    title: '',
    content: '',
    photo: null
  })
  const [securityLogsDialogOpen, setSecurityLogsDialogOpen] = useState(false)
  const [userSecurityLogs, setUserSecurityLogs] = useState([])
  const [broadcastDialogOpen, setBroadcastDialogOpen] = useState(false)
  const [broadcastData, setBroadcastData] = useState({
    type: 'info',
    content: ''
  })

  useEffect(() => {
    let mounted = true
    let hasRun = false // Prevent React Strict Mode double execution
    
    const loadData = async () => {
      if (!mounted || hasRun) return
      hasRun = true
      
      try {
        setLoading(true)
        setError('')
        
        const result = await getDashboardHome(filters)
        if (mounted) {
          setData(result)
          setError('')
          // Start token refresh timer after successful data load
          startTokenRefreshTimer()
        }
      } catch (err) {
        if (mounted) {
          setError(err.response?.data?.message || 'حدث خطأ في تحميل البيانات')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    // Debounce API calls - wait 1 second after user stops typing
    const timeoutId = setTimeout(loadData, 1000)
    
    return () => {
      mounted = false
      clearTimeout(timeoutId)
    }
  }, [filters])


  const handleRefresh = async () => {
    try {
      setLoading(true)
      setError('')
      
      if (!isAuthenticated()) {
        navigate('/login', { replace: true })
        return
      }
      
      const dashboardData = await getDashboardHome(filters)
      setData(dashboardData)
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        console.log('🚫 Admin authentication failed during refresh - interceptor will handle it')
        setError('فشل في المصادقة - جاري إعادة المحاولة...')
      } else {
        setError('فشل في تحميل بيانات لوحة التحكم')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logoutUser()
      navigate('/login', { replace: true })
    } catch (err) {
      // Force logout even if API fails
      navigate('/login', { replace: true })
    }
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  // User Management Functions
  const handleSearchUser = async () => {
    if (!searchUsername.trim()) {
      setSnackbar({ open: true, message: 'يرجى إدخال اسم المستخدم', severity: 'warning' })
      return
    }

    try {
      setUserLoading(true)
      const userData = await searchUser(searchUsername.trim())
      setSearchedUser(userData.user)
      
      // Get user's last seen data
      const lastSeenData = await getUserLastSeen(searchUsername.trim())
      setUserLastSeen(lastSeenData.lastSeens || [])
      
      setSnackbar({ open: true, message: 'تم العثور على المستخدم بنجاح', severity: 'success' })
    } catch (err) {
      setSearchedUser(null)
      setUserLastSeen([])
      setSnackbar({ open: true, message: err.response?.data?.message || 'فشل في البحث عن المستخدم', severity: 'error' })
    } finally {
      setUserLoading(false)
    }
  }

  const handleBanUser = async () => {
    try {
      await banUser(searchedUser.username, banDays)
      setBanDialogOpen(false)
      setBanDays(1)
      
      // Refresh user data
      const userData = await searchUser(searchedUser.username)
      setSearchedUser(userData.user)
      
      setSnackbar({ open: true, message: `تم حظر المستخدم لمدة ${banDays} أيام`, severity: 'success' })
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'فشل في حظر المستخدم', severity: 'error' })
    }
  }

  const handleUnbanUser = async () => {
    try {
      await unbanUser(searchedUser.username)
      
      // Refresh user data
      const userData = await searchUser(searchedUser.username)
      setSearchedUser(userData.user)
      
      setSnackbar({ open: true, message: 'تم إلغاء حظر المستخدم بنجاح', severity: 'success' })
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'فشل في إلغاء حظر المستخدم', severity: 'error' })
    }
  }

  // New Features Handlers
  const handleViewProfile = async (userId) => {
    try {
      setProfileLoading(true)
      setProfileDialogOpen(true)
      const profileData = await getUserProfile(userId)
      setUserProfile(profileData.profileData)
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'فشل في تحميل الملف الشخصي', severity: 'error' })
      setProfileDialogOpen(false)
    } finally {
      setProfileLoading(false)
    }
  }

  const handleDeleteUser = async (userId) => {
    try {
      await deleteUser(userId)
      setDeleteDialogOpen(false)
      setSnackbar({ open: true, message: 'تم حذف المستخدم بنجاح', severity: 'success' })
      
      // Clear searched user if it was the deleted one
      if (searchedUser && searchedUser.id === userId) {
        setSearchedUser(null)
        setSearchUsername('')
      }
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'فشل في حذف المستخدم', severity: 'error' })
    }
  }

  const handleUpdateProfile = async () => {
    try {
      const { followers, UserFollows, likes } = profileUpdateData
      await updateProfileStatus(
        searchedUser.id, 
        followers ? parseInt(followers) : undefined,
        UserFollows ? parseInt(UserFollows) : undefined,
        likes ? parseInt(likes) : undefined
      )
      
      setUpdateProfileDialogOpen(false)
      setSnackbar({ open: true, message: 'تم تحديث الملف الشخصي بنجاح', severity: 'success' })
      
      // Refresh user data
      const userData = await searchUser(searchedUser.username)
      setSearchedUser(userData.user)
      
      // Reset form
      setProfileUpdateData({ followers: '', UserFollows: '', likes: '' })
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'فشل في تحديث الملف الشخصي', severity: 'error' })
    }
  }

  // New User Management Handlers
  const handleEditUser = () => {
    setUserEditData({
      username: searchedUser.username,
      email: searchedUser.email || '',
      password: ''
    })
    setEditUserDialogOpen(true)
  }

  const handleUpdateUser = async () => {
    try {
      const { username, email, password } = userEditData
      await updateUserData(
        searchedUser.id,
        username !== searchedUser.username ? username : undefined,
        email !== searchedUser.email ? email : undefined,
        password || undefined
      )
      
      setEditUserDialogOpen(false)
      setSnackbar({ open: true, message: 'تم تحديث بيانات المستخدم بنجاح', severity: 'success' })
      
      // Refresh user data - use new username if it was changed
      const newUsername = username !== searchedUser.username ? username : searchedUser.username
      const userData = await searchUser(newUsername)
      setSearchedUser(userData.user)
      
      // Reset form
      setUserEditData({ username: '', email: '', password: '' })
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'فشل في تحديث بيانات المستخدم', severity: 'error' })
    }
  }

  const handleVerifyUser = async () => {
    try {
      await verifyUser(searchedUser.username)
      setSnackbar({ open: true, message: 'تم توثيق المستخدم بنجاح', severity: 'success' })
      
      // Refresh user data
      const userData = await searchUser(searchedUser.username)
      setSearchedUser(userData.user)
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'فشل في توثيق المستخدم', severity: 'error' })
    }
  }

  const handleRemoveVerify = async () => {
    try {
      console.log('🔍 Attempting to remove verification for:', searchedUser.username)
      await removeVerifyUser(searchedUser.username)
      console.log('✅ Remove verification successful')
      setSnackbar({ open: true, message: 'تم إلغاء توثيق المستخدم بنجاح', severity: 'success' })
      
      // Refresh user data
      const userData = await searchUser(searchedUser.username)
      setSearchedUser(userData.user)
    } catch (err) {
      console.log('❌ Remove verification failed:', err)
      console.log('❌ Error response:', err.response?.data)
      setSnackbar({ open: true, message: err.response?.data?.message || 'فشل في إلغاء توثيق المستخدم', severity: 'error' })
    }
  }

  // New Features Handlers
  const handleGetFavorites = async () => {
    try {
      const { fav } = await getFavUser(searchedUser.username)
      setUserFavorites(fav)
      setFavoritesDialogOpen(true)
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'فشل في جلب المفضلة', severity: 'error' })
    }
  }

  const handleGetBlocks = async () => {
    try {
      const { usersBlocks } = await getUserBlocks(searchedUser.username)
      setUserBlocks(usersBlocks)
      setBlocksDialogOpen(true)
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'فشل في جلب المحظورين', severity: 'error' })
    }
  }

  const handleCreateBlog = async () => {
    try {
      if (!blogData.title || !blogData.content) {
        setSnackbar({ open: true, message: 'يرجى ملء جميع الحقول المطلوبة', severity: 'warning' })
        return
      }
      
      await createBlogUser(searchedUser.username, blogData)
      setCreateBlogDialogOpen(false)
      setBlogData({ title: '', content: '', photo: null })
      setSnackbar({ open: true, message: 'تم إنشاء المنشور بنجاح', severity: 'success' })
    } catch (err) {
      console.error('Create blog error:', err)
      setSnackbar({ open: true, message: err.response?.data?.message || 'فشل في إنشاء المنشور', severity: 'error' })
    }
  }

  const handleViewBlocks = async () => {
    try {
      const { usersBlocks } = await getUserBlocks(searchedUser.username)
      setUserBlocks(usersBlocks)
      setBlocksDialogOpen(true)
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'فشل في جلب المحظورين', severity: 'error' })
    }
  }

  const handleViewSecurityLogs = async () => {
    try {
      const { logs } = await getUserSecurityLogs(searchedUser.username)
      setUserSecurityLogs(logs)
      setSecurityLogsDialogOpen(true)
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'فشل في جلب سجلات الأمان', severity: 'error' })
    }
  }

  const handleSendBroadcast = async () => {
    try {
      if (!broadcastData.content.trim()) {
        setSnackbar({ open: true, message: 'يرجى كتابة محتوى الإشعار', severity: 'warning' })
        return
      }
      
      await sendBroadcastNotification(broadcastData.type, broadcastData.content)
      setBroadcastDialogOpen(false)
      setBroadcastData({ type: 'info', content: '' })
      setSnackbar({ open: true, message: 'تم إرسال الإشعار لجميع المستخدمين بنجاح', severity: 'success' })
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'فشل في إرسال الإشعار', severity: 'error' })
    }
  }


  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: 2,
            background: 'rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3,
            backdropFilter: 'blur(10px)',
          }}
        >
          <CircularProgress size={40} sx={{ color: 'white' }} />
        </Box>
        <Typography variant="h6" fontWeight={600} sx={{ opacity: 0.9 }}>
          جاري تحميل لوحة التحكم...
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.7, mt: 1 }}>
          يرجى الانتظار قليلاً
        </Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        color: 'white',
        p: 4
      }}>
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: 2,
            background: 'rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3,
            backdropFilter: 'blur(10px)',
          }}
        >
          ⚠️
        </Box>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 2, textAlign: 'center' }}>
          حدث خطأ في تحميل البيانات
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9, mb: 4, textAlign: 'center', maxWidth: 400 }}>
          {error}
        </Typography>
        <Button 
          variant="contained"
          onClick={handleRefresh}
          startIcon={<RefreshIcon />}
          sx={{
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.3)',
            fontWeight: 600,
            px: 4,
            py: 1.5,
            borderRadius: 3,
            '&:hover': {
              background: 'rgba(255,255,255,0.3)',
              transform: 'translateY(-2px)',
            }
          }}
        >
          إعادة المحاولة
        </Button>
      </Box>
    )
  }

  // Prepare chart data (mock for now)
  const chartData = [
    { name: 'الأسبوع الماضي', visitors: data?.analtyics || 0 },
    { name: 'هذا الأسبوع', visitors: (data?.analtyics || 0) * 1.2 },
  ]

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* Enhanced Top Navigation */}
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <Toolbar sx={{ py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2,
                backdropFilter: 'blur(10px)',
              }}
            >
              <Typography variant="h6" fontWeight={900} color="white">
                O
              </Typography>
            </Box>
            <Typography variant="h5" component="div" sx={{ fontWeight: 800, color: 'white' }}>
              OtakuHub
            </Typography>
            <Chip
              label="Admin Panel"
              size="small"
              sx={{ 
                ml: 2,
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontWeight: 600,
                backdropFilter: 'blur(10px)',
              }}
            />
          </Box>
          
          <Tooltip title="إرسال إشعار عام">
            <IconButton 
              color="inherit" 
              onClick={() => setBroadcastDialogOpen(true)} 
              sx={{ 
                mr: 2,
                bgcolor: 'rgba(255,255,255,0.1)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
              }}
            >
              📢
            </IconButton>
          </Tooltip>
          
          <Tooltip title="تحديث البيانات">
            <IconButton 
              color="inherit" 
              onClick={handleRefresh} 
              sx={{ 
                mr: 2,
                bgcolor: 'rgba(255,255,255,0.1)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="إعدادات الحساب">
            <IconButton
              color="inherit"
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.1)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
              }}
            >
              <AccountIcon />
            </IconButton>
          </Tooltip>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                borderRadius: 2,
                mt: 1,
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
              }
            }}
          >
            <MenuItem 
              onClick={handleLogout}
              sx={{ 
                borderRadius: 1,
                mx: 1,
                '&:hover': { bgcolor: 'error.light', color: 'white' }
              }}
            >
              <LogoutIcon sx={{ mr: 1 }} />
              تسجيل الخروج
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Enhanced Tabs */}
        <Fade in timeout={800}>
          <Paper 
            elevation={0} 
            sx={{ 
              mb: 4,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              border: '1px solid rgba(0,0,0,0.05)',
              overflow: 'hidden'
            }}
          >
            <Tabs 
              value={activeTab} 
              onChange={(e, newValue) => setActiveTab(newValue)}
              sx={{ 
                '& .MuiTab-root': {
                  minHeight: 64,
                  fontWeight: 600,
                  fontSize: '1rem',
                  textTransform: 'none',
                  borderRadius: 2,
                  mx: 1,
                  my: 1,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: 'rgba(102, 126, 234, 0.1)',
                    transform: 'translateY(-2px)',
                  },
                  '&.Mui-selected': {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
                  }
                },
                '& .MuiTabs-indicator': {
                  display: 'none'
                }
              }}
            >
              <Tab 
                label="الإحصائيات والتحليلات" 
                icon={<TrendingUpIcon />} 
                iconPosition="start"
              />
              <Tab 
                label="إدارة المستخدمين" 
                icon={<ManageAccountsIcon />} 
                iconPosition="start"
              />
            </Tabs>
          </Paper>
        </Fade>

        {/* Tab Content */}
        {activeTab === 0 && (
          <>
            {/* Enhanced Filters */}
            <Slide direction="up" in timeout={1000}>
              <Card 
                elevation={0}
                sx={{ 
                  mb: 4, 
                  p: 4, 
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                  }
                }}
              >
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                  <Typography variant="h5" gutterBottom sx={{ 
                    fontWeight: 700, 
                    mb: 3, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2,
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    color: 'white'
                  }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: 'rgba(255,255,255,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                      }}
                    >
                      🔍
                    </Box>
                    فلاتر البيانات المتقدمة
                  </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="📝 أيام المنشورات"
                type="number"
                value={filters.blogDay}
                onChange={(e) => setFilters(prev => ({ ...prev, blogDay: parseInt(e.target.value) || 0 }))}
                helperText="0 = اليوم فقط، 1 = آخر يوم، 7 = آخر أسبوع"
                variant="outlined"
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    borderRadius: 2,
                    backdropFilter: 'blur(10px)',
                    '&:hover': { 
                      backgroundColor: 'rgba(255,255,255,1)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
                    },
                    '& fieldset': {
                      borderColor: 'rgba(255,255,255,0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255,255,255,0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'rgba(255,255,255,0.8)',
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255,255,255,0.9)',
                    '&.Mui-focused': {
                      color: 'white'
                    }
                  },
                  '& .MuiFormHelperText-root': {
                    color: 'rgba(255,255,255,0.95)',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="👥 أيام المستخدمين"
                type="number"
                value={filters.userDay}
                onChange={(e) => setFilters(prev => ({ ...prev, userDay: parseInt(e.target.value) || 0 }))}
                helperText="0 = اليوم فقط، 1 = آخر يوم، 7 = آخر أسبوع"
                variant="outlined"
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    borderRadius: 2,
                    backdropFilter: 'blur(10px)',
                    '&:hover': { 
                      backgroundColor: 'rgba(255,255,255,1)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
                    },
                    '& fieldset': {
                      borderColor: 'rgba(255,255,255,0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255,255,255,0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'rgba(255,255,255,0.8)',
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255,255,255,0.9)',
                    '&.Mui-focused': {
                      color: 'white'
                    }
                  },
                  '& .MuiFormHelperText-root': {
                    color: 'rgba(255,255,255,0.95)',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="👁️ أيام الزيارات"
                type="number"
                value={filters.vistorDay}
                onChange={(e) => setFilters(prev => ({ ...prev, vistorDay: parseInt(e.target.value) || 0 }))}
                helperText="0 = اليوم فقط، 1 = آخر يوم، 7 = آخر أسبوع"
                variant="outlined"
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    borderRadius: 2,
                    backdropFilter: 'blur(10px)',
                    '&:hover': { 
                      backgroundColor: 'rgba(255,255,255,1)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
                    },
                    '& fieldset': {
                      borderColor: 'rgba(255,255,255,0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255,255,255,0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'rgba(255,255,255,0.8)',
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255,255,255,0.9)',
                    '&.Mui-focused': {
                      color: 'white'
                    }
                  },
                  '& .MuiFormHelperText-root': {
                    color: 'rgba(255,255,255,0.95)',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="📊 أيام التحليلات"
                type="number"
                value={filters.analtyicsDay}
                onChange={(e) => setFilters(prev => ({ ...prev, analtyicsDay: parseInt(e.target.value) || 1 }))}
                helperText="1 = مقارنة مع أمس، 7 = مع الأسبوع الماضي"
                variant="outlined"
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    borderRadius: 2,
                    backdropFilter: 'blur(10px)',
                    '&:hover': { 
                      backgroundColor: 'rgba(255,255,255,1)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
                    },
                    '& fieldset': {
                      borderColor: 'rgba(255,255,255,0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255,255,255,0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'rgba(255,255,255,0.8)',
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255,255,255,0.9)',
                    '&.Mui-focused': {
                      color: 'white'
                    }
                  },
                  '& .MuiFormHelperText-root': {
                    color: 'rgba(255,255,255,0.95)',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                  }
                }}
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button 
              variant="contained" 
              onClick={handleRefresh}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
              sx={{ 
                background: 'rgba(255,255,255,0.25)',
                color: 'white',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.4)',
                fontWeight: 700,
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                fontSize: '1rem',
                '&:hover': { 
                  background: 'rgba(255,255,255,0.35)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
                }
              }}
            >
              {loading ? 'جاري التحديث...' : 'تحديث البيانات'}
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => setFilters({ blogDay: 0, userDay: 0, vistorDay: 0, analtyicsDay: 1 })}
              sx={{ 
                borderColor: 'rgba(255,255,255,0.4)',
                color: 'white',
                backdropFilter: 'blur(10px)',
                fontWeight: 700,
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                fontSize: '1rem',
                '&:hover': { 
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderColor: 'rgba(255,255,255,0.6)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              🔄 إعادة تعيين
            </Button>
          </Box>
                </Box>
              </Card>
            </Slide>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="إجمالي المستخدمين"
              value={data?.allUsersNumbers}
              todayValue={data?.todayUsersNumbers}
              icon={<PeopleIcon sx={{ color: 'primary.main' }} />}
              color="primary"
              filterDays={filters.userDay}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="إجمالي المنشورات"
              value={data?.allBlogsNumbers}
              todayValue={data?.toDayBlogsNumbers}
              icon={<ArticleIcon sx={{ color: 'success.main' }} />}
              color="success"
              filterDays={filters.blogDay}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="إجمالي الزيارات"
              value={data?.allVisitorsNumbers}
              todayValue={data?.todayVisitorsNumbers}
              icon={<VisibilityIcon sx={{ color: 'info.main' }} />}
              color="info"
              filterDays={filters.vistorDay}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="نسبة النمو"
              value={`${Math.round(data?.analtyics || 0)}%`}
              todayValue="مقارنة الفترات"
              icon={<TrendingUpIcon sx={{ color: 'warning.main' }} />}
              color="warning"
              filterDays={filters.analtyicsDay}
            />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Analytics Chart */}
          <Grid item xs={12} md={8}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 4, 
                height: 400,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                border: '1px solid rgba(0,0,0,0.05)'
              }}
            >
              <Typography variant="h6" fontWeight={700} mb={3} sx={{ 
                color: '#1e293b',
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}>
                📊 تحليلات الزيارات
              </Typography>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Line 
                    type="monotone" 
                    dataKey="visitors" 
                    stroke="#667eea" 
                    strokeWidth={3}
                    dot={{ fill: '#667eea', strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Recent Users */}
          <Grid item xs={12} md={4}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 4, 
                height: 400, 
                overflow: 'hidden',
                borderRadius: 3,
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                border: '1px solid rgba(0,0,0,0.05)'
              }}
            >
              <Typography variant="h6" fontWeight={700} mb={3} sx={{ 
                color: '#1e293b',
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}>
                👥 المستخدمون الجدد
              </Typography>
              <Box sx={{ height: 'calc(100% - 60px)', overflow: 'auto' }}>
                {!data?.lastsUsers || data.lastsUsers.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
                    لا توجد مستخدمين جدد
                  </Typography>
                ) : (
                  <List sx={{ width: '100%', p: 0 }}>
                    {data.lastsUsers.map((user, index) => (
                    <ListItem key={user.id} sx={{ px: 0, py: 1, width: '100%' }}>
                      <ListItemAvatar>
                        <Avatar 
                          src={user.photo && user.photo !== 'default' ? `${API_BASE}/${user.photo}` : undefined}
                          sx={{ 
                            width: 48, 
                            height: 48,
                            backgroundColor: (!user.photo || user.photo === 'default') ? 'primary.main' : 'transparent'
                          }}
                          onError={(e) => {
                            e.target.src = '' // Clear the src to show fallback
                          }}
                        >
                          {user.username?.[0]?.toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" noWrap>
                            {user.username}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            مستخدم جديد #{index + 1}
                          </Typography>
                        }
                      />
                    </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
          </>
        )}

        {/* Enhanced User Management Tab */}
        {activeTab === 1 && (
          <Fade in timeout={1000}>
            <Grid container spacing={3}>
              {/* Search User */}
              <Grid item xs={12}>
                <Card 
                  elevation={0}
                  sx={{ 
                    p: 4,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    border: '1px solid rgba(0,0,0,0.05)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: '200px',
                      height: '200px',
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                      borderRadius: '50%',
                      transform: 'translate(50px, -50px)',
                    }
                  }}
                >
                  <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Typography variant="h5" gutterBottom sx={{ 
                      fontWeight: 700, 
                      mb: 3, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2,
                      color: '#1e293b',
                      textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
                        }}
                      >
                        <SearchIcon />
                      </Box>
                      إدارة المستخدمين المتقدمة
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
                      <TextField
                        fullWidth
                        label="اسم المستخدم"
                        placeholder="ابحث عن مستخدم..."
                        value={searchUsername}
                        onChange={(e) => setSearchUsername(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearchUser()}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon color="primary" />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 3,
                            backgroundColor: '#f8fafc',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              backgroundColor: '#f1f5f9',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
                            },
                            '&.Mui-focused': {
                              backgroundColor: 'white',
                              boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)'
                            }
                          }
                        }}
                      />
                      <Tooltip title="البحث عن المستخدم">
                        <Button
                          variant="contained"
                          onClick={handleSearchUser}
                          disabled={userLoading}
                          sx={{ 
                            minWidth: 140,
                            height: 56,
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            fontWeight: 600,
                            fontSize: '1rem',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
                            }
                          }}
                        >
                          {userLoading ? <CircularProgress size={24} color="inherit" /> : '🔍 بحث'}
                        </Button>
                      </Tooltip>
                    </Box>

                    {/* Enhanced User Details */}
                    {searchedUser && (
                      <Zoom in timeout={800}>
                        <Card 
                          elevation={0}
                          sx={{ 
                            p: 4, 
                            mt: 4,
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                            border: '1px solid rgba(0,0,0,0.05)',
                            position: 'relative',
                            overflow: 'hidden',
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              width: '100%',
                              height: '4px',
                              background: searchedUser.isBanned 
                                ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'
                                : 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                            }
                          }}
                        >
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Avatar
                            src={searchedUser.photo && searchedUser.photo !== 'default' ? `${API_BASE}/${searchedUser.photo}` : undefined}
                            sx={{ width: 64, height: 64 }}
                          >
                            {searchedUser.username?.[0]?.toUpperCase()}
                          </Avatar>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="h6">{searchedUser.username}</Typography>
                              {searchedUser.verified && (
                                <CheckCircleIcon 
                                  sx={{ 
                                    color: '#1DA1F2', 
                                    fontSize: '1.2rem',
                                    filter: 'drop-shadow(0 2px 4px rgba(29, 161, 242, 0.3))'
                                  }} 
                                />
                              )}
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {searchedUser.email}
                            </Typography>
                            <Chip
                              label={searchedUser.isBanned ? 'محظور' : 'نشط'}
                              color={searchedUser.isBanned ? 'error' : 'success'}
                              size="small"
                              sx={{ mt: 1 }}
                            />
                          </Box>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Stack spacing={2}>
                          <Typography variant="subtitle2">الإجراءات:</Typography>
                          {searchedUser.isBanned ? (
                            <Button
                              variant="contained"
                              color="success"
                              startIcon={<CheckCircleIcon />}
                              onClick={handleUnbanUser}
                              fullWidth
                            >
                              إلغاء الحظر
                            </Button>
                          ) : (
                            <Button
                              variant="contained"
                              color="error"
                              startIcon={<BlockIcon />}
                              onClick={() => setBanDialogOpen(true)}
                              fullWidth
                            >
                              حظر المستخدم
                            </Button>
                          )}
                          
                          {/* New Action Buttons */}
                          <Button
                            variant="outlined"
                            color="primary"
                            startIcon={<ManageAccountsIcon />}
                            onClick={() => handleViewProfile(searchedUser.id)}
                            fullWidth
                            sx={{ mt: 1 }}
                          >
                            عرض الملف الشخصي
                          </Button>
                          
                          <Button
                            variant="outlined"
                            color="secondary"
                            startIcon={<EditIcon />}
                            onClick={() => {
                              setProfileUpdateData({
                                followers: '',
                                UserFollows: '',
                                likes: ''
                              })
                              setUpdateProfileDialogOpen(true)
                            }}
                            fullWidth
                            sx={{ mt: 1 }}
                          >
                            تحديث الإحصائيات
                          </Button>
                          
                          <Button
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => setDeleteDialogOpen(true)}
                            fullWidth
                            sx={{ mt: 1 }}
                          >
                            حذف المستخدم
                          </Button>
                          
                          {/* Edit User Button */}
                          <Button
                            variant="outlined"
                            color="info"
                            startIcon={<EditIcon />}
                            onClick={handleEditUser}
                            fullWidth
                            sx={{ mt: 1 }}
                          >
                            تعديل البيانات
                          </Button>
                          
                          {/* Verify/Unverify Buttons */}
                          {searchedUser.verified ? (
                            <Button
                              variant="outlined"
                              color="warning"
                              startIcon={<CheckCircleIcon />}
                              onClick={handleRemoveVerify}
                              fullWidth
                              sx={{ mt: 1 }}
                            >
                              إلغاء التوثيق
                            </Button>
                          ) : (
                            <Button
                              variant="outlined"
                              color="success"
                              startIcon={<CheckCircleIcon />}
                              onClick={handleVerifyUser}
                              fullWidth
                              sx={{ mt: 1 }}
                            >
                              توثيق المستخدم
                            </Button>
                          )}
                          
                          {/* New Feature Buttons */}
                          <Button
                            variant="outlined"
                            color="secondary"
                            startIcon={<ManageAccountsIcon />}
                            onClick={handleGetFavorites}
                            fullWidth
                            sx={{ mt: 1 }}
                          >
                            عرض المفضلة
                          </Button>
                          
                          <Button
                            variant="outlined"
                            color="warning"
                            startIcon={<BlockIcon />}
                            onClick={handleViewBlocks}
                            fullWidth
                            sx={{ mt: 1 }}
                          >
                            عرض المحظورين
                          </Button>
                          
                          <Button
                            variant="outlined"
                            color="info"
                            startIcon={<ScheduleIcon />}
                            onClick={handleViewSecurityLogs}
                            fullWidth
                            sx={{ mt: 1 }}
                          >
                            سجلات الأمان
                          </Button>
                          
                          <Button
                            variant="outlined"
                            color="primary"
                            startIcon={<EditIcon />}
                            onClick={() => setCreateBlogDialogOpen(true)}
                            fullWidth
                            sx={{ mt: 1 }}
                          >
                            إنشاء منشور
                          </Button>
                          
                        </Stack>
                      </Grid>
                    </Grid>

                    {/* Last Seen */}
                    {userLastSeen.length > 0 && (
                      <>
                        <Divider sx={{ my: 3 }} />
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ScheduleIcon color="primary" />
                          آخر الأنشطة
                        </Typography>
                        <List>
                          {userLastSeen.slice(0, 5).map((activity, index) => (
                            <ListItem key={index} divider>
                              <ListItemText
                                primary={new Date(activity.createdAt).toLocaleString('ar-EG')}
                                secondary="نشاط في المنصة"
                              />
                            </ListItem>
                          ))}
                        </List>
                      </>
                    )}
                          </Card>
                        </Zoom>
                    )}
                  </Box>
                </Card>
              </Grid>
            </Grid>
          </Fade>
        )}

        {/* Enhanced Ban Dialog */}
        <Dialog 
          open={banDialogOpen} 
          onClose={() => setBanDialogOpen(false)}
          PaperProps={{
            sx: {
              borderRadius: 3,
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              minWidth: 400,
              overflow: 'hidden'
            }
          }}
        >
          <DialogTitle sx={{ 
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            fontWeight: 700
          }}>
            <BlockIcon />
            حظر المستخدم
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
              <Typography variant="body2">
                هل أنت متأكد من حظر المستخدم <strong>"{searchedUser?.username}"</strong>؟
                <br />
                سيتم منع المستخدم من الوصول للمنصة خلال المدة المحددة.
              </Typography>
            </Alert>
            <TextField
              fullWidth
              label="عدد الأيام"
              type="number"
              value={banDays}
              onChange={(e) => setBanDays(parseInt(e.target.value) || 1)}
              inputProps={{ min: 1, max: 365 }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&.Mui-focused': {
                    boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.1)'
                  }
                }
              }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 2 }}>
            <Button 
              onClick={() => setBanDialogOpen(false)}
              sx={{ 
                borderRadius: 2,
                px: 3,
                fontWeight: 600
              }}
            >
              إلغاء
            </Button>
            <Button 
              onClick={handleBanUser} 
              variant="contained" 
              color="error"
              startIcon={<BlockIcon />}
              sx={{ 
                borderRadius: 2,
                px: 3,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                }
              }}
            >
              تأكيد الحظر
            </Button>
          </DialogActions>
        </Dialog>

        {/* Profile View Dialog */}
        <Dialog
          open={profileDialogOpen}
          onClose={() => setProfileDialogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
            }
          }}
        >
          <DialogTitle sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            textAlign: 'center',
            fontWeight: 700,
            py: 3
          }}>
            👤 الملف الشخصي
          </DialogTitle>
          <DialogContent sx={{ p: 4 }}>
            {profileLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : userProfile ? (
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">المتابعين:</Typography>
                  <Typography variant="h6" fontWeight={600}>{userProfile.followers || 0}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">يتابع:</Typography>
                  <Typography variant="h6" fontWeight={600}>{userProfile.UserFollows || 0}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">الإعجابات:</Typography>
                  <Typography variant="h6" fontWeight={600}>{userProfile.likes || 0}</Typography>
                </Grid>
              </Grid>
            ) : (
              <Typography color="error">فشل في تحميل البيانات</Typography>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setProfileDialogOpen(false)} sx={{ borderRadius: 2 }}>
              إغلاق
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete User Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              background: 'linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)'
            }
          }}
        >
          <DialogTitle sx={{
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: 'white',
            textAlign: 'center',
            fontWeight: 700,
            py: 3
          }}>
            ⚠️ تأكيد الحذف
          </DialogTitle>
          <DialogContent sx={{ p: 4 }}>
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              <Typography variant="body2">
                هل أنت متأكد من حذف المستخدم <strong>"{searchedUser?.username}"</strong>؟
                <br />
                <strong>تحذير:</strong> هذا الإجراء لا يمكن التراجع عنه!
              </Typography>
            </Alert>
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 2 }}>
            <Button 
              onClick={() => setDeleteDialogOpen(false)}
              sx={{ borderRadius: 2, px: 3, fontWeight: 600 }}
            >
              إلغاء
            </Button>
            <Button 
              onClick={() => handleDeleteUser(searchedUser?.id)} 
              variant="contained" 
              color="error"
              startIcon={<DeleteIcon />}
              sx={{ 
                borderRadius: 2,
                px: 3,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                }
              }}
            >
              تأكيد الحذف
            </Button>
          </DialogActions>
        </Dialog>

        {/* Update Profile Dialog */}
        <Dialog
          open={updateProfileDialogOpen}
          onClose={() => setUpdateProfileDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)'
            }
          }}
        >
          <DialogTitle sx={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: 'white',
            textAlign: 'center',
            fontWeight: 700,
            py: 3
          }}>
            📊 تحديث الإحصائيات
          </DialogTitle>
          <DialogContent sx={{ p: 4 }}>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="عدد المتابعين"
                type="number"
                value={profileUpdateData.followers}
                onChange={(e) => setProfileUpdateData(prev => ({ ...prev, followers: e.target.value }))}
                placeholder="اتركه فارغاً إذا لم تريد تغييره"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                fullWidth
                label="عدد المتابَعين"
                type="number"
                value={profileUpdateData.UserFollows}
                onChange={(e) => setProfileUpdateData(prev => ({ ...prev, UserFollows: e.target.value }))}
                placeholder="اتركه فارغاً إذا لم تريد تغييره"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                fullWidth
                label="عدد الإعجابات"
                type="number"
                value={profileUpdateData.likes}
                onChange={(e) => setProfileUpdateData(prev => ({ ...prev, likes: e.target.value }))}
                placeholder="اتركه فارغاً إذا لم تريد تغييره"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 2 }}>
            <Button 
              onClick={() => setUpdateProfileDialogOpen(false)}
              sx={{ borderRadius: 2, px: 3, fontWeight: 600 }}
            >
              إلغاء
            </Button>
            <Button 
              onClick={handleUpdateProfile} 
              variant="contained" 
              startIcon={<EditIcon />}
              sx={{ 
                borderRadius: 2,
                px: 3,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
                }
              }}
            >
              تحديث
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog
          open={editUserDialogOpen}
          onClose={() => setEditUserDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)'
            }
          }}
        >
          <DialogTitle sx={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: 'white',
            textAlign: 'center',
            fontWeight: 700,
            py: 3
          }}>
            ✏️ تعديل بيانات المستخدم
          </DialogTitle>
          <DialogContent sx={{ p: 4 }}>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="اسم المستخدم"
                value={userEditData.username}
                onChange={(e) => setUserEditData(prev => ({ ...prev, username: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                fullWidth
                label="البريد الإلكتروني"
                type="email"
                value={userEditData.email}
                onChange={(e) => setUserEditData(prev => ({ ...prev, email: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                fullWidth
                label="كلمة المرور الجديدة"
                type="password"
                value={userEditData.password}
                onChange={(e) => setUserEditData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="اتركه فارغاً إذا لم تريد تغييره"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 2 }}>
            <Button 
              onClick={() => setEditUserDialogOpen(false)}
              sx={{ borderRadius: 2, px: 3, fontWeight: 600 }}
            >
              إلغاء
            </Button>
            <Button 
              onClick={handleUpdateUser} 
              variant="contained" 
              startIcon={<EditIcon />}
              sx={{ 
                borderRadius: 2,
                px: 3,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
                }
              }}
            >
              حفظ التغييرات
            </Button>
          </DialogActions>
        </Dialog>

        {/* Favorites Dialog */}
        <Dialog
          open={favoritesDialogOpen}
          onClose={() => setFavoritesDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>📚 مفضلة المستخدم</DialogTitle>
          <DialogContent>
            {userFavorites.length > 0 ? (
              <Stack spacing={3}>
                {userFavorites.map((fav, index) => (
                  <Card key={index} sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      {/* Blog Image */}
                      {fav.Blog?.photo && (
                        <Box
                          component="img"
                          src={`${API_BASE}/${fav.Blog.photo}`}
                          alt={fav.Blog.title}
                          sx={{
                            width: 120,
                            height: 80,
                            objectFit: 'cover',
                            borderRadius: 1,
                            flexShrink: 0
                          }}
                        />
                      )}
                      
                      {/* Blog Content */}
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                          {fav.Blog?.title}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {fav.Blog?.content?.substring(0, 150)}...
                        </Typography>
                        
                        {/* Author Info */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar 
                            src={fav.Blog?.User?.photo && fav.Blog.User.photo !== 'default' ? `${API_BASE}/${fav.Blog.User.photo}` : undefined}
                            sx={{ width: 24, height: 24 }}
                          >
                            {fav.Blog?.User?.username?.[0]?.toUpperCase()}
                          </Avatar>
                          <Typography variant="caption" color="text.secondary">
                            {fav.Blog?.User?.username}
                          </Typography>
                          {fav.Blog?.User?.verified && (
                            <CheckCircleIcon sx={{ color: '#1DA1F2', fontSize: '0.9rem' }} />
                          )}
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                            {new Date(fav.Blog?.createdAt).toLocaleDateString('ar-EG')}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Card>
                ))}
              </Stack>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  لا توجد منشورات في المفضلة
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFavoritesDialogOpen(false)}>إغلاق</Button>
          </DialogActions>
        </Dialog>

        {/* Blocks Dialog */}
        <Dialog
          open={blocksDialogOpen}
          onClose={() => setBlocksDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>🚫 المستخدمين المحظورين</DialogTitle>
          <DialogContent>
            {userBlocks.length > 0 ? (
              <Stack spacing={2}>
                {userBlocks.map((user) => (
                  <Box key={user.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar src={user.photo && user.photo !== 'default' ? `${API_BASE}/${user.photo}` : undefined}>
                      {user.username?.[0]?.toUpperCase()}
                    </Avatar>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography>{user.username}</Typography>
                      {user.verified && (
                        <CheckCircleIcon sx={{ color: '#1DA1F2', fontSize: '1rem' }} />
                      )}
                    </Box>
                  </Box>
                ))}
              </Stack>
            ) : (
              <Typography>لا يوجد مستخدمين محظورين</Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBlocksDialogOpen(false)}>إغلاق</Button>
          </DialogActions>
        </Dialog>

        {/* Create Blog Dialog */}
        <Dialog
          open={createBlogDialogOpen}
          onClose={() => setCreateBlogDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>✍️ إنشاء منشور جديد</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="عنوان المنشور"
                value={blogData.title}
                onChange={(e) => setBlogData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
              <TextField
                fullWidth
                label="محتوى المنشور"
                multiline
                rows={4}
                value={blogData.content}
                onChange={(e) => setBlogData(prev => ({ ...prev, content: e.target.value }))}
                required
              />
              
              {/* Image Upload */}
              <Box>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="blog-image-upload"
                  type="file"
                  onChange={(e) => setBlogData(prev => ({ ...prev, photo: e.target.files[0] }))}
                />
                <label htmlFor="blog-image-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    fullWidth
                    sx={{ py: 2 }}
                  >
                    📷 اختيار صورة (اختياري)
                  </Button>
                </label>
                
                {blogData.photo && (
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="primary">
                      تم اختيار: {blogData.photo.name}
                    </Typography>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => setBlogData(prev => ({ ...prev, photo: null }))}
                      sx={{ mt: 1 }}
                    >
                      إزالة الصورة
                    </Button>
                  </Box>
                )}
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateBlogDialogOpen(false)}>إلغاء</Button>
            <Button 
              onClick={handleCreateBlog} 
              variant="contained"
              disabled={!blogData.title || !blogData.content}
            >
              إنشاء المنشور
            </Button>
          </DialogActions>
        </Dialog>

        {/* Security Logs Dialog */}
        <Dialog
          open={securityLogsDialogOpen}
          onClose={() => setSecurityLogsDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>🔒 سجلات الأمان للمستخدم</DialogTitle>
          <DialogContent>
            {userSecurityLogs.length > 0 ? (
              <Stack spacing={2} sx={{ mt: 2 }}>
                {userSecurityLogs.map((log, index) => (
                  <Card key={index} sx={{ p: 2, borderRadius: 2, boxShadow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                          {log.action === 'Login' ? '🔑 تسجيل دخول' : log.action}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          📱 الجهاز: {log.agent?.substring(0, 50)}...
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          🌐 IP: {log.ip}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(log.createdAt).toLocaleDateString('ar-EG', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {new Date(log.createdAt).toLocaleTimeString('ar-EG')}
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                ))}
              </Stack>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  لا توجد سجلات أمان
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSecurityLogsDialogOpen(false)}>إغلاق</Button>
          </DialogActions>
        </Dialog>

        {/* Broadcast Notification Dialog */}
        <Dialog
          open={broadcastDialogOpen}
          onClose={() => setBroadcastDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            textAlign: 'center',
            fontWeight: 700,
            fontSize: '1.3rem'
          }}>
            📢 إرسال إشعار عام لجميع المستخدمين
          </DialogTitle>
          <DialogContent sx={{ mt: 3 }}>
            <Stack spacing={3}>
              <FormControl fullWidth>
                <InputLabel>نوع الإشعار</InputLabel>
                <Select
                  value={broadcastData.type}
                  onChange={(e) => setBroadcastData(prev => ({ ...prev, type: e.target.value }))}
                  label="نوع الإشعار"
                >
                  <MenuItem value="info">📢 معلومات</MenuItem>
                  <MenuItem value="warring">⚠️ تحذير</MenuItem>
                  <MenuItem value="update">🔄 تحديث</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                multiline
                rows={4}
                label="محتوى الإشعار"
                value={broadcastData.content}
                onChange={(e) => setBroadcastData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="اكتب محتوى الإشعار الذي سيتم إرساله لجميع المستخدمين..."
                helperText="سيتم إرسال هذا الإشعار لجميع المستخدمين المسجلين في المنصة"
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button 
              onClick={() => setBroadcastDialogOpen(false)}
              variant="outlined"
            >
              إلغاء
            </Button>
            <Button 
              onClick={handleSendBroadcast}
              variant="contained"
              disabled={!broadcastData.content.trim()}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                }
              }}
            >
              📤 إرسال الإشعار
            </Button>
          </DialogActions>
        </Dialog>

        {/* Enhanced Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            severity={snackbar.severity} 
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            sx={{
              borderRadius: 3,
              fontWeight: 600,
              minWidth: 300,
              boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
              '& .MuiAlert-icon': {
                fontSize: '1.5rem'
              }
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  )
}
