import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Stack,
  Avatar,
  Card,
  CardContent,
  IconButton,
  Chip,
  Divider,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  People as PeopleIcon,
  Gavel as GavelIcon,
  Dashboard as DashboardIcon,
  Search as SearchIcon,
  Timeline as ActivityIcon,
  PersonAdd as PersonAddIcon,
  ExitToApp as ExitToAppIcon,
  Star as CrownIcon,
  Report as ReportIcon,
  PersonRemove as PersonRemoveIcon,
  ExpandMore as ExpandMoreIcon,
  Delete as DeleteIcon,
  SwapHoriz as SwapHorizIcon,
  History as HistoryIcon,
  Article as ArticleIcon,
  Comment as CommentIcon,
  Settings as SettingsIcon
} from '@mui/icons-material'
import { API_BASE, getPendingUsers, acceptUser, cancelUser, checkGroupAccess, api, searchMembers, changeRole, kickUser, updateGroupData, getGroup, storage, deleteGroup, changeOwner, leaveGroup, getGroupLogger, getHistoryDelete, updateGroupSettings, getGroupReports, getPendingBlogs, acceptPendingBlog, cancelPendingBlog } from '../lib/api'

export default function GroupDashboard() {
  const { groupName } = useParams()
  const navigate = useNavigate()
  const [pendingUsers, setPendingUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(null)
  const [hasAccess, setHasAccess] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentTab, setCurrentTab] = useState(() => {
    // Get saved tab from localStorage or default to 0
    const savedTab = localStorage.getItem(`groupDashboard_${groupName}_tab`)
    return savedTab ? parseInt(savedTab) : 0
  })
  const [isSearching, setIsSearching] = useState(false)
  const [allPendingUsers, setAllPendingUsers] = useState([])
  
  // Members state
  const [members, setMembers] = useState([])
  const [memberSearchTerm, setMemberSearchTerm] = useState('')
  const [isSearchingMembers, setIsSearchingMembers] = useState(false)
  const [hasSearchedMembers, setHasSearchedMembers] = useState(false)
  const [kickDialog, setKickDialog] = useState({ open: false, username: '' })
  const [transferDialog, setTransferDialog] = useState({ open: false, username: '', userId: '' })
  const [transferring, setTransferring] = useState(false)
  // Settings state
  const [groupData, setGroupData] = useState({ description: '', privacy: '', photo: '' })
  const [settingsForm, setSettingsForm] = useState({ description: '', privacy: 'public' })
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [savingSettings, setSavingSettings] = useState(false)
  const [deleteGroupDialog, setDeleteGroupDialog] = useState(false)
  const [deletingGroup, setDeletingGroup] = useState(false)
  const [deleteExpanded, setDeleteExpanded] = useState(false)
  const [userRole, setUserRole] = useState('')
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' })
  
  // Activity tab states
  const [activities, setActivities] = useState([])
  const [activityStatus, setActivityStatus] = useState(() => {
    // Get saved activity status from localStorage or default to 'join'
    const savedStatus = localStorage.getItem(`groupDashboard_${groupName}_activityStatus`)
    return savedStatus || 'join'
  })
  const [loadingActivities, setLoadingActivities] = useState(false)

  // History Delete tab states
  const [historyDelete, setHistoryDelete] = useState([])
  const [historyService, setHistoryService] = useState(() => {
    // Get saved history service from localStorage or default to 'posts'
    const savedService = localStorage.getItem(`groupDashboard_${groupName}_historyService`)
    return savedService || 'posts'
  })
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Settings tab states
  const [settingsLoading, setSettingsLoading] = useState(false)

  // Reports tab states
  const [reports, setReports] = useState([])
  const [loadingReports, setLoadingReports] = useState(false)
  const [reportType, setReportType] = useState('blog') // 'blog' or 'comment'
  const [selectedReport, setSelectedReport] = useState(null)
  const [showContentDialog, setShowContentDialog] = useState(false)

  // Pending Blogs tab states
  const [pendingBlogs, setPendingBlogs] = useState([])
  const [loadingPending, setLoadingPending] = useState(false)
  const [processingBlog, setProcessingBlog] = useState(null)

  useEffect(() => {
    checkAccess()
    loadGroupData()
  }, [groupName])

  // Load activities if Activities tab is selected on mount
  useEffect(() => {
    if (currentTab === 3) {
      loadActivities()
    } else if (currentTab === 4) {
      loadHistoryDelete(historyService)
    } else if (currentTab === 6) {
      loadReports()
    } else if (currentTab === 7) {
      loadPendingBlogs()
    }
  }, [currentTab, historyService])

  const loadGroupData = async () => {
    try {
      const { data } = await getGroup(groupName)
      console.log('GroupDashboard - Full response:', data)
      console.log('GroupDashboard - Role from API:', data.role)
      console.log('GroupDashboard - GroupData role:', data.groupData?.role)
      console.log('GroupDashboard - GroupSettings:', data.groupSettings)
      
      // Try to get role from different possible locations
      const role = data.role || data.groupData?.role || ''
      console.log('GroupDashboard - Final role:', role)
      
      // Set both groupData and groupSettings
      setGroupData({
        ...data.groupData,
        groupSettings: data.groupSettings
      })
      setUserRole(role)
      setSettingsForm({ 
        description: data.description || data.groupData?.description || '', 
        privacy: data.privacy || data.groupData?.privacy || 'public' 
      })
    } catch (err) {
      console.error('Error loading group data:', err)
    }
  }

  const refreshUserData = async () => {
    try {
      // Re-fetch group data to get updated role
      const { data } = await getGroup(groupName)
      // Update storage if user role changed
      if (storage.user && data.role) {
        const updatedUser = { ...storage.user }
        storage.user = updatedUser
      }
    } catch (err) {
      console.error('Error refreshing user data:', err)
    }
  }


  const checkAccess = async () => {
    try {
      await checkGroupAccess(groupName)
      setHasAccess(true)
      loadPendingUsers()
    } catch (err) {
      // Redirect to group page if no access
      navigate(`/groups/${groupName}`, { replace: true })
    }
  }

  const loadPendingUsers = async () => {
    try {
      setLoading(true)
      const response = await getPendingUsers(groupName)
      console.log('Load API Response:', response)
      // getPendingUsers returns axios response, so we need .data
      const data = response.data || response
      const users = data.pendingUser || data.pendinguser || []
      setPendingUsers(users)
      setAllPendingUsers(users) // Store all users for clear search
    } catch (err) {
      console.error('Error loading pending users:', err)
      setPendingUsers([])
      setAllPendingUsers([])
    } finally {
      setLoading(false)
    }
  }

  const searchPendingUsers = async () => {
    if (!searchTerm.trim()) {
      setPendingUsers(allPendingUsers) // Show all users without API call
      return
    }
    
    try {
      setIsSearching(true)
      console.log('Searching for:', { groupName, username: searchTerm })
      const response = await api.post('/api/group/searchPendingUser', {
        groupName: groupName,
        username: searchTerm
      })
      console.log('Search API Response:', response.data)
      // Backend returns array directly, not wrapped in object
      setPendingUsers(Array.isArray(response.data) ? response.data : [])
    } catch (err) {
      console.error('Error searching users:', err)
      console.error('Error response:', err.response?.data)
    } finally {
      setIsSearching(false)
    }
  }

  const handleClearSearch = () => {
    setSearchTerm('')
    setPendingUsers(allPendingUsers)
  }

  const handleAccept = async (id) => {
    try {
      setProcessing(id)
      await acceptUser(groupName, id)
      setPendingUsers(prev => prev.filter(user => user.requestId !== id))
      setAllPendingUsers(prev => prev.filter(user => user.requestId !== id))
      setSnackbar({ open: true, message: 'تم قبول العضو بنجاح', severity: 'success' })
    } catch (err) {
      console.error('Error accepting user:', err)
      setSnackbar({ 
        open: true, 
        message: err.message || 'فشل قبول العضو', 
        severity: 'error' 
      })
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (id) => {
    try {
      setProcessing(id)
      await cancelUser(groupName, id)
      setPendingUsers(prev => prev.filter(user => user.requestId !== id))
      setAllPendingUsers(prev => prev.filter(user => user.requestId !== id))
      setSnackbar({ open: true, message: 'تم رفض العضو', severity: 'info' })
    } catch (err) {
      console.error('Error rejecting user:', err)
      setSnackbar({ 
        open: true, 
        message: err.message || 'فشل رفض العضو', 
        severity: 'error' 
      })
    } finally {
      setProcessing(null)
    }
  }

  // Members functions
  const searchMembersFunc = async () => {
    if (!memberSearchTerm.trim()) {
      setMembers([])
      setHasSearchedMembers(false)
      return
    }
    
    try {
      setIsSearchingMembers(true)
      setHasSearchedMembers(true)
      const response = await searchMembers(groupName, memberSearchTerm)
      console.log('Search Members Response:', response.data)
      setMembers(response.data.filterMember || [])
    } catch (err) {
      console.error('Error searching members:', err)
      console.error('Error response:', err.response?.data)
      setMembers([])
    } finally {
      setIsSearchingMembers(false)
    }
  }

  const handleRoleChange = async (username, newRole) => {
    console.log('🔄 Changing role for:', username, 'to:', newRole)
    console.log('🔑 Token exists:', storage.token ? 'YES' : 'NO')
    console.log('👤 Current user:', storage.user?.username)
    
    try {
      setProcessing(username)
      console.log('📡 Calling changeRole API...')
      await changeRole(groupName, username, newRole)
      console.log('✅ Role changed successfully')
      
      // Refresh search after role change
      await searchMembersFunc()
      // Refresh user data to update cached role
      await refreshUserData()
      setSnackbar({ open: true, message: 'تم تغيير الصلاحية بنجاح', severity: 'success' })
    } catch (err) {
      console.error('💥 Error changing role:', err)
      console.error('💥 Error response:', err.response?.data)
      console.error('💥 Error status:', err.response?.status)
      setSnackbar({ 
        open: true, 
        message: err.message || 'فشل تغيير الصلاحية', 
        severity: 'error' 
      })
    } finally {
      setProcessing(null)
    }
  }

  const handleKick = async (username) => {
    setKickDialog({ open: true, username })
  }

  const confirmKick = async () => {
    const username = kickDialog.username
    setKickDialog({ open: false, username: '' })
    
    try {
      setProcessing(username)
      await kickUser(groupName, username)
      setMembers(prev => prev.filter(m => m.username !== username))
      setSnackbar({ open: true, message: 'تم طرد العضو بنجاح', severity: 'success' })
    } catch (err) {
      console.error('Error kicking user:', err)
      setSnackbar({ 
        open: true, 
        message: err.message || 'فشل طرد العضو', 
        severity: 'error' 
      })
    } finally {
      setProcessing(null)
    }
  }

  const handleTransferOwnership = async (member) => {
    setTransferDialog({ open: true, username: member.username, userId: member.userId })
  }

  const confirmTransferOwnership = async () => {
    const { username, userId } = transferDialog
    setTransferDialog({ open: false, username: '', userId: '' })
    
    try {
      setTransferring(true)
      await changeOwner(groupName, userId)
      setSnackbar({ open: true, message: 'تم نقل الملكية بنجاح', severity: 'success' })
      // Refresh the members list to update roles
      await searchMembersFunc()
      // Redirect to group page since user is no longer owner
      setTimeout(() => {
        navigate(`/groups/${groupName}`)
      }, 2000)
    } catch (err) {
      console.error('Error transferring ownership:', err)
      setSnackbar({ 
        open: true, 
        message: err.message || 'فشل نقل الملكية', 
        severity: 'error' 
      })
    } finally {
      setTransferring(false)
    }
  }

  // Settings functions
  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPhotoFile(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true)
      const formData = new FormData()
      formData.append('groupName', groupName)
      formData.append('description', settingsForm.description)
      formData.append('privacy', settingsForm.privacy)
      if (photoFile) {
        formData.append('photo', photoFile)
      }
      
      await updateGroupData(formData)
      await loadGroupData()
      setPhotoFile(null)
      setPhotoPreview(null)
      setSnackbar({ open: true, message: 'تم حفظ الإعدادات بنجاح', severity: 'success' })
    } catch (err) {
      console.error('Error updating group:', err)
      setSnackbar({ 
        open: true, 
        message: err.message || 'فشل حفظ الإعدادات', 
        severity: 'error' 
      })
    } finally {
      setSavingSettings(false)
    }
  }

  const handleDeleteGroup = async () => {
    try {
      setDeletingGroup(true)
      await deleteGroup(groupName)
      setSnackbar({ open: true, message: 'تم حذف المجموعة بنجاح', severity: 'success' })
      // Redirect to groups page after successful deletion
      setTimeout(() => {
        navigate('/groups')
      }, 2000)
    } catch (err) {
      console.error('Error deleting group:', err)
      setSnackbar({ 
        open: true, 
        message: err.message || 'فشل حذف المجموعة', 
        severity: 'error' 
      })
    } finally {
      setDeletingGroup(false)
      setDeleteGroupDialog(false)
    }
  }

  const handleLeaveGroup = async () => {
    try {
      await leaveGroup(groupName)
      setSnackbar({ open: true, message: 'تم مغادرة المجموعة بنجاح', severity: 'success' })
      setTimeout(() => {
        navigate('/groups')
      }, 2000)
    } catch (err) {
      console.error('Error leaving group:', err)
      setSnackbar({ 
        open: true, 
        message: err.message || 'فشل مغادرة المجموعة', 
        severity: 'error' 
      })
    }
  }

  // Load activities function
  const loadActivities = async (status = activityStatus) => {
    try {
      setLoadingActivities(true)
      const { data } = await getGroupLogger(groupName, status)
      
      // Merge activities with user data
      const activitiesWithUsers = (data.logger || []).map(activity => {
        const user = (data.users || []).find(u => u.id === activity.userId)
        console.log('Activity:', activity)
        console.log('Found user:', user)
        console.log('Photo path:', user?.photo)
        console.log('Full photo URL:', user?.photo ? `${API_BASE}${user.photo}` : 'No photo')
        return {
          ...activity,
          user: user || { username: 'مستخدم محذوف', photo: null }
        }
      })
      
      setActivities(activitiesWithUsers)
    } catch (err) {
      console.error('Error loading activities:', err)
      console.error('Error response:', err.response?.data)
      setSnackbar({ 
        open: true, 
        message: err.message || 'فشل تحميل النشاطات', 
        severity: 'error' 
      })
    } finally {
      setLoadingActivities(false)
    }
  }

  // Handle activity status change
  const handleActivityStatusChange = (newStatus) => {
    setActivityStatus(newStatus)
    localStorage.setItem(`groupDashboard_${groupName}_activityStatus`, newStatus)
    loadActivities(newStatus)
  }

  // Load history delete function
  const loadHistoryDelete = async (service = historyService) => {
    try {
      setLoadingHistory(true)
      const { data } = await getHistoryDelete(groupName, service)
      setHistoryDelete(data.historyDelete || [])
    } catch (err) {
      console.error('Error loading history delete:', err)
      console.error('Error response:', err.response?.data)
      setSnackbar({ 
        open: true, 
        message: err.message || 'فشل تحميل سجل الحذف', 
        severity: 'error' 
      })
    } finally {
      setLoadingHistory(false)
    }
  }

  // Handle history service change
  const handleHistoryServiceChange = (newService) => {
    setHistoryService(newService)
    localStorage.setItem(`groupDashboard_${groupName}_historyService`, newService)
    loadHistoryDelete(newService)
  }

  // Handle settings update
  const handleSettingsUpdate = async (settingName, value) => {
    try {
      setSettingsLoading(true)
      
      const currentSettings = {
        publish: groupData?.groupSettings?.publish ?? true,
        allowReports: groupData?.groupSettings?.allowReports ?? true
      }
      
      const newSettings = {
        ...currentSettings,
        [settingName]: value
      }
      
      await updateGroupSettings(groupName, newSettings.publish, newSettings.allowReports)
      
      // Update local state
      setGroupData(prev => ({
        ...prev,
        groupSettings: {
          ...prev.groupSettings,
          [settingName]: value
        }
      }))
      
      setSnackbar({ 
        open: true, 
        message: 'تم تحديث الإعدادات بنجاح', 
        severity: 'success' 
      })
    } catch (err) {
      console.error('Error updating settings:', err)
      setSnackbar({ 
        open: true, 
        message: err.message || 'فشل في تحديث الإعدادات', 
        severity: 'error' 
      })
    } finally {
      setSettingsLoading(false)
    }
  }

  // Load reports function
  const loadReports = async (type = reportType) => {
    setLoadingReports(true)
    try {
      const { data } = await getGroupReports(groupName, type)
      setReports(data.groupReports || [])
    } catch (err) {
      console.error('Error loading reports:', err)
      setSnackbar({ 
        open: true, 
        message: 'فشل في تحميل البلاغات', 
        severity: 'error' 
      })
    } finally {
      setLoadingReports(false)
    }
  }

  // Handle report type change
  const handleReportTypeChange = (type) => {
    setReportType(type)
    loadReports(type)
  }

  // Handle delete blog
  const handleDeleteBlog = async (blogId) => {
    try {
      await api.post('/api/deleteBlog', { blogId })
      setSnackbar({ 
        open: true, 
        message: 'تم حذف المنشور بنجاح', 
        severity: 'success' 
      })
      loadReports() // Reload reports
    } catch (err) {
      setSnackbar({ 
        open: true, 
        message: err.message || 'فشل في حذف المنشور', 
        severity: 'error' 
      })
    }
  }

  // Load pending blogs
  const loadPendingBlogs = async () => {
    setLoadingPending(true)
    try {
      const { data } = await getPendingBlogs(groupName)
      setPendingBlogs(data.blogs || [])
    } catch (err) {
      console.error('Error loading pending blogs:', err)
      setSnackbar({ 
        open: true, 
        message: 'فشل في تحميل المنشورات المعلقة', 
        severity: 'error' 
      })
    } finally {
      setLoadingPending(false)
    }
  }

  // Accept pending blog
  const handleAcceptBlog = async (blogId) => {
    setProcessingBlog(blogId)
    try {
      await acceptPendingBlog(groupName, blogId)
      setPendingBlogs(prev => prev.filter(blog => blog.id !== blogId))
      setSnackbar({ 
        open: true, 
        message: 'تم قبول المنشور بنجاح', 
        severity: 'success' 
      })
    } catch (err) {
      setSnackbar({ 
        open: true, 
        message: err.message || 'فشل في قبول المنشور', 
        severity: 'error' 
      })
    } finally {
      setProcessingBlog(null)
    }
  }

  // Cancel pending blog
  const handleCancelBlog = async (blogId) => {
    setProcessingBlog(blogId)
    try {
      await cancelPendingBlog(groupName, blogId)
      setPendingBlogs(prev => prev.filter(blog => blog.id !== blogId))
      setSnackbar({ 
        open: true, 
        message: 'تم رفض المنشور بنجاح', 
        severity: 'success' 
      })
    } catch (err) {
      setSnackbar({ 
        open: true, 
        message: err.message || 'فشل في رفض المنشور', 
        severity: 'error' 
      })
    } finally {
      setProcessingBlog(null)
    }
  }

  // Handle tab change with localStorage save
  const handleTabChange = (tabIndex) => {
    setCurrentTab(tabIndex)
    localStorage.setItem(`groupDashboard_${groupName}_tab`, tabIndex.toString())
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography textAlign="center">جاري التحميل...</Typography>
      </Container>
    )
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Box
        sx={{
          width: 280,
          bgcolor: '#4A5FBF',
          color: 'white',
          position: 'fixed',
          top: 64,
          left: 0,
          height: 'calc(100vh - 64px)',
          overflowY: 'auto',
          boxShadow: 3
        }}
      >
        {/* Header */}
        <Box sx={{ p: 3, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <IconButton 
            onClick={() => navigate(`/groups/${groupName}`)}
            sx={{ color: 'white', mb: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
            {groupName}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            لوحة التحكم
          </Typography>
        </Box>

        {/* Menu Items */}
        <Box sx={{ p: 2 }}>
          <Stack spacing={1}>
            <Box
              onClick={() => handleTabChange(0)}
              sx={{
                p: 2.5,
                borderRadius: 2,
                cursor: 'pointer',
                bgcolor: currentTab === 0 ? 'rgba(255,255,255,0.15)' : 'transparent',
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              <Stack direction="row" alignItems="center" spacing={2}>
                <PeopleIcon />
                <Typography fontWeight={currentTab === 0 ? 700 : 500}>
                  طلبات الانضمام
                </Typography>
                {pendingUsers.length > 0 && (
                  <Chip 
                    label={pendingUsers.length} 
                    size="small"
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      fontWeight: 600
                    }}
                  />
                )}
              </Stack>
            </Box>

            <Box
              onClick={() => handleTabChange(2)}
              sx={{
                p: 2.5,
                borderRadius: 2,
                cursor: 'pointer',
                bgcolor: currentTab === 2 ? 'rgba(255,255,255,0.15)' : 'transparent',
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              <Stack direction="row" alignItems="center" spacing={2}>
                <PeopleIcon />
                <Typography fontWeight={currentTab === 2 ? 700 : 500}>
                  الأعضاء
                </Typography>
              </Stack>
            </Box>

            {/* Activities Tab */}
            <Box
              onClick={() => {
                handleTabChange(3)
                loadActivities()
              }}
              sx={{
                p: 2.5,
                borderRadius: 2,
                cursor: 'pointer',
                bgcolor: currentTab === 3 ? 'rgba(255,255,255,0.15)' : 'transparent',
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              <Stack direction="row" alignItems="center" spacing={2}>
                <ActivityIcon />
                <Typography fontWeight={currentTab === 3 ? 700 : 500}>
                  النشاطات
                </Typography>
              </Stack>
            </Box>

            {/* History Delete Tab */}
            <Box
              onClick={() => {
                handleTabChange(4)
                loadHistoryDelete()
              }}
              sx={{
                p: 2.5,
                borderRadius: 2,
                cursor: 'pointer',
                bgcolor: currentTab === 4 ? 'rgba(255,255,255,0.15)' : 'transparent',
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              <Stack direction="row" alignItems="center" spacing={2}>
                <HistoryIcon />
                <Typography fontWeight={currentTab === 4 ? 700 : 500}>
                  سجل الحذف
                </Typography>
              </Stack>
            </Box>

            {/* Settings Tab - Only for admin/owner */}
            {(userRole === 'owner' || userRole === 'admin' || userRole === 'Admin') && (
              <Box
                onClick={() => handleTabChange(5)}
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  cursor: 'pointer',
                  bgcolor: currentTab === 5 ? 'rgba(255,255,255,0.15)' : 'transparent',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                <Stack direction="row" alignItems="center" spacing={2}>
                  <SettingsIcon />
                  <Typography fontWeight={currentTab === 5 ? 700 : 500}>
                    إعدادات المجموعة
                  </Typography>
                </Stack>
              </Box>
            )}

            {/* Reports Tab - Only for admin/owner */}
            {(userRole === 'owner' || userRole === 'admin' || userRole === 'Admin') && (
              <Box
                onClick={() => {
                  handleTabChange(6)
                  loadReports()
                }}
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  cursor: 'pointer',
                  bgcolor: currentTab === 6 ? 'rgba(255,255,255,0.15)' : 'transparent',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                <Stack direction="row" alignItems="center" spacing={2}>
                  <ReportIcon />
                  <Typography fontWeight={currentTab === 6 ? 700 : 500}>
                    البلاغات
                  </Typography>
                </Stack>
              </Box>
            )}

            {/* Pending Blogs Tab (Owner/Admin only) */}
            {(userRole === 'owner' || userRole === 'admin' || userRole === 'Admin') && (
              <Box
                onClick={() => {
                  handleTabChange(7)
                  loadPendingBlogs()
                }}
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  cursor: 'pointer',
                  bgcolor: currentTab === 7 ? 'rgba(255,255,255,0.15)' : 'transparent',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                <Stack direction="row" alignItems="center" spacing={2}>
                  <ArticleIcon />
                  <Typography fontWeight={currentTab === 7 ? 700 : 500}>
                    المنشورات المعلقة
                  </Typography>
                </Stack>
              </Box>
            )}

            <Box
              onClick={() => navigate(`/groups/${groupName}/rules`)}
              sx={{
                p: 2.5,
                borderRadius: 2,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              <Stack direction="row" alignItems="center" spacing={2}>
                <GavelIcon />
                <Typography fontWeight={500}>القواعد</Typography>
              </Stack>
            </Box>

            <Box
              onClick={() => handleTabChange(1)}
              sx={{
                p: 2.5,
                borderRadius: 2,
                cursor: 'pointer',
                bgcolor: currentTab === 1 ? 'rgba(255,255,255,0.15)' : 'transparent',
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              <Stack direction="row" alignItems="center" spacing={2}>
                <SettingsIcon />
                <Typography fontWeight={currentTab === 1 ? 700 : 500}>
                  الإعدادات
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, ml: '280px', p: 4 }}>
        {currentTab === 0 && (
          <Box>
            {/* Header */}
            <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: 'primary.light' }}>
              <Typography variant="h5" fontWeight={700} mb={1} color="primary.dark">
                طلبات الانضمام المعلقة
              </Typography>
              <Typography variant="body2" color="text.secondary">
                قم بمراجعة وقبول أو رفض طلبات الانضمام للمجموعة
              </Typography>
            </Paper>

            {/* Search Box */}
            <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <TextField
                  fullWidth
                  placeholder="البحث عن عضو معين..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchPendingUsers()}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: 'primary.main',
                      },
                    }
                  }}
                />
                <Button
                  variant="contained"
                  onClick={searchPendingUsers}
                  disabled={isSearching}
                  sx={{ minWidth: 100, height: 56 }}
                >
                  {isSearching ? 'جاري البحث...' : 'بحث'}
                </Button>
                {searchTerm && (
                  <Button
                    variant="outlined"
                    onClick={handleClearSearch}
                    sx={{ minWidth: 100, height: 56 }}
                  >
                    مسح
                  </Button>
                )}
              </Stack>
            </Paper>

            {/* Stats */}
            <Stack direction="row" spacing={2} mb={3}>
              <Paper 
                elevation={2}
                sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  flex: 1,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white'
                }}
              >
                <Stack direction="row" alignItems="center" spacing={2}>
                  <PeopleIcon sx={{ fontSize: 28 }} />
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      {pendingUsers.length}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      طلبات معلقة
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Stack>

        {pendingUsers.length > 0 ? (
          <Stack spacing={3}>
            {pendingUsers.map((user) => (
              <Paper 
                key={user.requestId} 
                elevation={2}
                sx={{ 
                  borderRadius: 3,
                  overflow: 'hidden',
                  transition: 'all 0.3s',
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    boxShadow: 6,
                    borderColor: 'primary.main',
                    transform: 'translateY(-4px)'
                  }
                }}
              >
                <Box sx={{ p: 3 }}>
                  <Stack direction="row" alignItems="center" spacing={3}>
                    <Box 
                      onClick={() => navigate(`/profile/${user.username}`)}
                      sx={{ 
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                        '&:hover': {
                          transform: 'scale(1.05)'
                        }
                      }}
                    >
                      <Avatar
                        src={user.photo ? `${API_BASE}/${user.photo}` : undefined}
                        sx={{ 
                          width: 72, 
                          height: 72,
                          border: '4px solid',
                          borderColor: 'primary.light',
                          boxShadow: 3
                        }}
                      >
                        <Typography variant="h4" fontWeight={700}>
                          {user.username?.charAt(0).toUpperCase()}
                        </Typography>
                      </Avatar>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography 
                        variant="h5" 
                        fontWeight={700} 
                        mb={0.5}
                        onClick={() => navigate(`/profile/${user.username}`)}
                        sx={{
                          cursor: 'pointer',
                          display: 'inline-block',
                          '&:hover': {
                            color: 'primary.main'
                          }
                        }}
                      >
                        {user.username}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Box sx={{ 
                          width: 10, 
                          height: 10, 
                          borderRadius: '50%', 
                          bgcolor: 'warning.main',
                          animation: 'pulse 2s infinite'
                        }} />
                        <Typography variant="body1" color="text.secondary" fontWeight={500}>
                          في انتظار الموافقة على الانضمام
                        </Typography>
                      </Stack>
                    </Box>
                    <Stack direction="row" spacing={2}>
                      <Button
                        variant="contained"
                        color="success"
                        size="large"
                        startIcon={<CheckIcon />}
                        onClick={() => handleAccept(user.requestId)}
                        disabled={processing === user.requestId}
                        sx={{
                          minWidth: 140,
                          fontWeight: 700,
                          fontSize: '1.1rem',
                          boxShadow: 3,
                          '&:hover': {
                            boxShadow: 6,
                            transform: 'scale(1.05)'
                          },
                          '& .MuiButton-startIcon': {
                            marginRight: '8px',
                            marginLeft: 0
                          }
                        }}
                      >
                        {processing === user.requestId ? 'جاري القبول...' : 'قبول'}
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="large"
                        startIcon={<CloseIcon />}
                        onClick={() => handleReject(user.requestId)}
                        disabled={processing === user.requestId}
                        sx={{
                          minWidth: 140,
                          fontWeight: 700,
                          fontSize: '1.1rem',
                          borderWidth: 2,
                          '&:hover': {
                            borderWidth: 2,
                            transform: 'scale(1.05)'
                          },
                          '& .MuiButton-startIcon': {
                            marginRight: '8px',
                            marginLeft: 0
                          }
                        }}
                      >
                        {processing === user.requestId ? 'جاري الرفض...' : 'رفض'}
                      </Button>
                    </Stack>
                  </Stack>
                </Box>
              </Paper>
            ))}
          </Stack>
        ) : (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <PeopleIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" mb={1}>
              {searchTerm ? 'لا توجد نتائج للبحث' : 'لا توجد طلبات معلقة'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchTerm 
                ? `لم يتم العثور على "${searchTerm}" في طلبات الانضمام`
                : 'جميع طلبات الانضمام تمّت معالجتها'
              }
            </Typography>
          </Box>
          )}
          </Box>
        )}

        {currentTab === 1 && (
          <Box>
            <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
              <Typography variant="h5" fontWeight={700} mb={4}>
                ⚙️ {userRole === 'owner' ? 'إعدادات المجموعة' : 'خيارات العضوية'}
              </Typography>
              
              {/* Debug log */}
              {console.log('Settings Tab - userRole:', userRole, 'isOwner:', userRole === 'owner')}
              
              {userRole === 'owner' ? (
                <Stack spacing={4}>
                {/* Group Photo */}
                <Box>
                  <Typography variant="h6" fontWeight={600} mb={2}>صورة المجموعة</Typography>
                  <Stack direction="row" spacing={3} alignItems="center">
                    <Avatar
                      src={photoPreview || (groupData.photo ? `${API_BASE}${groupData.photo}` : null)}
                      sx={{ width: 100, height: 100 }}
                    >
                      {groupName?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <input
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="photo-upload"
                        type="file"
                        onChange={handlePhotoChange}
                      />
                      <label htmlFor="photo-upload">
                        <Button variant="outlined" component="span">
                          اختر صورة جديدة
                        </Button>
                      </label>
                      {photoPreview && (
                        <Button 
                          variant="text" 
                          color="error" 
                          onClick={() => {
                            setPhotoFile(null)
                            setPhotoPreview(null)
                          }}
                          sx={{ ml: 2 }}
                        >
                          إلغاء
                        </Button>
                      )}
                    </Box>
                  </Stack>
                </Box>

                {/* Description */}
                <Box>
                  <Typography variant="h6" fontWeight={600} mb={2}>وصف المجموعة</Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    value={settingsForm.description}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="اكتب وصف للمجموعة..."
                  />
                </Box>

                {/* Privacy */}
                <Box>
                  <Typography variant="h6" fontWeight={600} mb={2}>خصوصية المجموعة</Typography>
                  <FormControl fullWidth>
                    <InputLabel>الخصوصية</InputLabel>
                    <Select
                      value={settingsForm.privacy}
                      label="الخصوصية"
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, privacy: e.target.value }))}
                    >
                      <MenuItem value="public">عامة - يمكن لأي شخص الانضمام</MenuItem>
                      <MenuItem value="private">خاصة - تحتاج موافقة للانضمام</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {/* Save Button */}
                <Box sx={{ pt: 2 }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleSaveSettings}
                    disabled={savingSettings}
                    sx={{ minWidth: 200 }}
                  >
                    {savingSettings ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                  </Button>
                </Box>

                {/* Danger Zone */}
                <Divider sx={{ my: 4 }} />
                <Box>
                  <Typography variant="h6" fontWeight={600} mb={2} color="error.main">
                    ⚠️ منطقة الخطر
                  </Typography>
                  <Accordion 
                    expanded={deleteExpanded}
                    onChange={() => setDeleteExpanded(!deleteExpanded)}
                    sx={{ 
                      border: '2px solid', 
                      borderColor: 'error.main',
                      borderRadius: '12px !important',
                      '&:before': { display: 'none' },
                      boxShadow: 'none'
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon sx={{ color: 'error.main' }} />}
                      sx={{
                        bgcolor: 'error.light',
                        borderRadius: deleteExpanded ? '12px 12px 0 0' : '12px',
                        '& .MuiAccordionSummary-content': {
                          alignItems: 'center',
                          gap: 2
                        }
                      }}
                    >
                      <DeleteIcon sx={{ color: 'error.main', fontSize: 28 }} />
                      <Typography variant="h6" fontWeight={700} color="error.dark">
                        حذف المجموعة نهائياً
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails
                      sx={{
                        bgcolor: 'error.light',
                        borderRadius: '0 0 12px 12px',
                        pt: 0
                      }}
                    >
                      <Box sx={{ p: 2 }}>
                        <Typography variant="body2" color="error.dark" mb={2} fontWeight={600}>
                          ⚠️ تحذير: هذا الإجراء لا يمكن التراجع عنه وسيتم حذف:
                        </Typography>
                        <Box component="ul" sx={{ mb: 3, pl: 2 }}>
                          <Typography component="li" variant="body2" color="error.dark" mb={0.5}>
                            🗂️ جميع المنشورات والتعليقات
                          </Typography>
                          <Typography component="li" variant="body2" color="error.dark" mb={0.5}>
                            👥 جميع الأعضاء وطلبات الانضمام
                          </Typography>
                          <Typography component="li" variant="body2" color="error.dark" mb={0.5}>
                            ⚙️ جميع الإعدادات والبيانات
                          </Typography>
                          <Typography component="li" variant="body2" color="error.dark">
                            📸 الصور والملفات المرفقة
                          </Typography>
                        </Box>
                        <Button
                          variant="contained"
                          color="error"
                          size="large"
                          onClick={() => setDeleteGroupDialog(true)}
                          startIcon={<DeleteIcon />}
                          sx={{ 
                            minWidth: 250,
                            fontWeight: 700,
                            fontSize: '1.1rem',
                            py: 1.5,
                            '&:hover': {
                              bgcolor: 'error.dark',
                              transform: 'scale(1.02)'
                            },
                            transition: 'all 0.2s'
                          }}
                        >
                          حذف المجموعة نهائياً
                        </Button>
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                </Box>
              </Stack>
              ) : (
                // Admin section - Leave Group only
                <Box>
                  <Typography variant="h6" fontWeight={600} mb={3} color="text.secondary">
                    كونك Admin، يمكنك مغادرة المجموعة فقط
                  </Typography>
                  
                  <Paper 
                    sx={{ 
                      p: 3, 
                      border: '2px solid', 
                      borderColor: 'warning.main',
                      bgcolor: 'warning.light',
                      borderRadius: 2
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                      <ExitToAppIcon sx={{ color: 'warning.main', fontSize: 28 }} />
                      <Typography variant="h6" fontWeight={700} color="warning.dark">
                        مغادرة المجموعة
                      </Typography>
                    </Stack>
                    
                    <Typography variant="body2" color="warning.dark" mb={3}>
                      ⚠️ تنبيه: بعد المغادرة لن تستطيع الوصول لإعدادات المجموعة أو إدارة الأعضاء
                    </Typography>
                    
                    <Button
                      variant="contained"
                      color="warning"
                      size="large"
                      onClick={handleLeaveGroup}
                      startIcon={<ExitToAppIcon />}
                      sx={{ 
                        minWidth: 200,
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        py: 1.5,
                        '&:hover': {
                          bgcolor: 'warning.dark',
                          transform: 'scale(1.02)'
                        },
                        transition: 'all 0.2s'
                      }}
                    >
                      مغادرة المجموعة
                    </Button>
                  </Paper>
                </Box>
              )}
            </Paper>
          </Box>
        )}

        {currentTab === 2 && (
          <Box>
            {/* Search Section */}
            <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
              <Typography variant="h5" fontWeight={700} mb={3}>
                🔍 البحث عن الأعضاء
              </Typography>
              
              <Stack direction="row" spacing={2} alignItems="center">
                <TextField
                  fullWidth
                  placeholder="ابحث عن عضو..."
                  value={memberSearchTerm}
                  onChange={(e) => setMemberSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchMembersFunc()}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    )
                  }}
                />
                <Button
                  variant="contained"
                  onClick={searchMembersFunc}
                  disabled={isSearchingMembers}
                  sx={{ minWidth: 100 }}
                >
                  {isSearchingMembers ? 'جاري البحث...' : 'بحث'}
                </Button>
                {memberSearchTerm && (
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setMemberSearchTerm('')
                      setMembers([])
                      setHasSearchedMembers(false)
                    }}
                  >
                    مسح
                  </Button>
                )}
              </Stack>
            </Paper>

            {/* Members List */}
            {members.length > 0 ? (
              <Stack spacing={2}>
                {members.map((member) => (
                  <Paper key={member.userId} elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
                      <Stack direction="row" alignItems="center" spacing={2} flex={1}>
                        <Avatar
                          src={member.photo ? `${API_BASE}${member.photo}` : null}
                          sx={{ width: 60, height: 60, cursor: 'pointer' }}
                          onClick={() => navigate(`/profile/${member.username}`)}
                        >
                          {member.username?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography 
                            variant="h6" 
                            fontWeight={700}
                            onClick={() => navigate(`/profile/${member.username}`)}
                            sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                          >
                            {member.username}
                          </Typography>
                          <Chip 
                            label={member.role || 'Member'} 
                            size="small"
                            color={
                              member.role === 'owner' ? 'error' : 
                              member.role === 'Admin' ? 'warning' : 
                              member.role === 'Moderator' ? 'info' : 
                              'default'
                            }
                          />
                        </Box>
                      </Stack>

                      <Stack direction="row" spacing={2} alignItems="center">
                        {member.role !== 'owner' && (
                          <>
                            <FormControl size="small" sx={{ minWidth: 140 }}>
                              <InputLabel>الصلاحية</InputLabel>
                              <Select
                                value={member.role || 'Member'}
                                label="الصلاحية"
                                onChange={(e) => handleRoleChange(member.username, e.target.value)}
                                disabled={processing === member.username}
                              >
                                <MenuItem value="Member">Member</MenuItem>
                                <MenuItem value="Moderator">Moderator</MenuItem>
                                <MenuItem value="Admin">Admin</MenuItem>
                              </Select>
                            </FormControl>
                            <Button
                              variant="outlined"
                              color="primary"
                              size="small"
                              startIcon={<SwapHorizIcon />}
                              onClick={() => handleTransferOwnership(member)}
                              disabled={processing === member.username || transferring}
                              sx={{ 
                                minWidth: 120,
                                '&:hover': {
                                  bgcolor: 'primary.light',
                                  color: 'white'
                                }
                              }}
                            >
                              نقل الملكية
                            </Button>
                            <Button
                              variant="contained"
                              color="error"
                              size="small"
                              onClick={() => handleKick(member.username)}
                              disabled={processing === member.username}
                            >
                              طرد
                            </Button>
                          </>
                        )}
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            ) : hasSearchedMembers ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <PeopleIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" mb={1}>
                  لا توجد نتائج للبحث
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  لم يتم العثور على "{memberSearchTerm}"
                </Typography>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <PeopleIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" mb={1}>
                  ابحث عن عضو
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  اكتب اسم العضو للبحث وإدارة الصلاحيات
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Activities Tab */}
        {currentTab === 3 && (
          <Box>
            <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
              <Typography variant="h5" fontWeight={700} mb={4}>
                📊 نشاطات المجموعة
              </Typography>
              
              {/* Activity Status Filter */}
              <Stack direction="row" spacing={2} mb={4}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>نوع النشاط</InputLabel>
                  <Select
                    value={activityStatus}
                    label="نوع النشاط"
                    onChange={(e) => handleActivityStatusChange(e.target.value)}
                  >
                    <MenuItem value="join">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <PersonAddIcon sx={{ fontSize: 18, color: 'success.main' }} />
                        <span>انضمام</span>
                      </Stack>
                    </MenuItem>
                    <MenuItem value="leave">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <ExitToAppIcon sx={{ fontSize: 18, color: 'warning.main' }} />
                        <span>مغادرة</span>
                      </Stack>
                    </MenuItem>
                    <MenuItem value="kick">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <PersonRemoveIcon sx={{ fontSize: 18, color: 'error.main' }} />
                        <span>طرد</span>
                      </Stack>
                    </MenuItem>
                    <MenuItem value="newOwner">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <CrownIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                        <span>تغيير المالك</span>
                      </Stack>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Stack>

              {/* Activities List */}
              {loadingActivities ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : activities.length > 0 ? (
                <List>
                  {activities.map((activity, index) => (
                    <ListItem key={index} divider={index < activities.length - 1}>
                      <ListItemIcon>
                        {activity.status === 'join' && <PersonAddIcon sx={{ color: 'success.main' }} />}
                        {activity.status === 'leave' && <ExitToAppIcon sx={{ color: 'warning.main' }} />}
                        {activity.status === 'kick' && <PersonRemoveIcon sx={{ color: 'error.main' }} />}
                        {activity.status === 'newOwner' && <CrownIcon sx={{ color: 'primary.main' }} />}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar
                              src={activity.user?.photo ? `${API_BASE}${activity.user.photo}` : null}
                              sx={{ 
                                width: 40, 
                                height: 40,
                                border: '2px solid #e0e0e0',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                              }}
                            >
                              {activity.user?.username?.charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography
                              component="span"
                              variant="body1"
                              sx={{
                                color: 'primary.main',
                                cursor: 'pointer',
                                fontWeight: 600,
                                '&:hover': {
                                  color: 'primary.dark',
                                  textDecoration: 'underline'
                                }
                              }}
                              onClick={() => navigate(`/profile/${activity.user?.username}`)}
                            >
                              {activity.user?.username}
                            </Typography>
                            <Typography variant="body1">
                              {activity.status === 'join' && 'انضم للمجموعة'}
                              {activity.status === 'leave' && 'غادر المجموعة'}
                              {activity.status === 'kick' && 'تم طرده من المجموعة'}
                              {activity.status === 'newOwner' && 'أصبح مالك المجموعة'}
                            </Typography>
                          </Stack>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary">
                            {new Date(activity.createdAt).toLocaleString('ar-EG', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <ActivityIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" mb={1}>
                    لا توجد نشاطات
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    لم يتم تسجيل أي نشاطات من نوع "{activityStatus}" حتى الآن
                  </Typography>
                </Box>
              )}
            </Paper>
          </Box>
        )}

        {/* History Delete Tab */}
        {currentTab === 4 && (
          <Box>
            <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
              <Typography variant="h5" fontWeight={700} mb={4}>
                📜 سجل الحذف
              </Typography>

              {/* Service Filter */}
              <Box sx={{ mb: 4 }}>
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>نوع المحتوى</InputLabel>
                  <Select
                    value={historyService}
                    label="نوع المحتوى"
                    onChange={(e) => handleHistoryServiceChange(e.target.value)}
                    endAdornment={<ExpandMoreIcon />}
                  >
                    <MenuItem value="posts">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <ArticleIcon sx={{ fontSize: 20 }} />
                        <span>المقالات</span>
                      </Stack>
                    </MenuItem>
                    <MenuItem value="comments">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <CommentIcon sx={{ fontSize: 20 }} />
                        <span>التعليقات</span>
                      </Stack>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* History Delete Content */}
              {loadingHistory ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <CircularProgress size={60} />
                  <Typography variant="h6" sx={{ mt: 2 }}>
                    جاري تحميل سجل الحذف...
                  </Typography>
                </Box>
              ) : historyDelete.length > 0 ? (
                <List>
                  {historyDelete.map((item, index) => (
                    <ListItem key={index} divider={index < historyDelete.length - 1}>
                      <ListItemIcon>
                        {historyService === 'posts' ? (
                          <ArticleIcon sx={{ color: 'error.main' }} />
                        ) : (
                          <CommentIcon sx={{ color: 'error.main' }} />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap">
                            <Typography variant="body1" fontWeight={600}>
                              {historyService === 'posts' ? 'مقال محذوف' : 'تعليق محذوف'}
                            </Typography>
                            <Typography
                              component="span"
                              variant="body2"
                              sx={{
                                color: 'primary.main',
                                cursor: 'pointer',
                                fontWeight: 600,
                                '&:hover': {
                                  color: 'primary.dark',
                                  textDecoration: 'underline'
                                }
                              }}
                              onClick={() => navigate(`/profile/${item.usernameOwnerBlogDelete}`)}
                            >
                              لـ: {item.usernameOwnerBlogDelete}
                            </Typography>
                          </Stack>
                        }
                        secondary={
                          <Stack spacing={1} sx={{ mt: 1 }}>
                            {item.contentDelete && (
                              <Typography variant="body2" color="text.secondary">
                                المحتوى: {item.contentDelete.length > 100 ? item.contentDelete.substring(0, 100) + '...' : item.contentDelete}
                              </Typography>
                            )}
                            <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap">
                              <Typography
                                component="span"
                                variant="body2"
                                sx={{
                                  color: 'error.main',
                                  cursor: 'pointer',
                                  fontWeight: 600,
                                  '&:hover': {
                                    color: 'error.dark',
                                    textDecoration: 'underline'
                                  }
                                }}
                                onClick={() => navigate(`/profile/${item.administratorDelete}`)}
                              >
                                حذف بواسطة: {item.administratorDelete}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                (صلاحية: {item.roleDeleteBlog})
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                مالك المجموعة وقتها: {item.ownerInThisTime}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {new Date(item.createdAt).toLocaleString('ar-EG', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </Typography>
                            </Stack>
                          </Stack>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <HistoryIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" mb={1}>
                    لا يوجد سجل حذف
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    لم يتم حذف أي {historyService === 'posts' ? 'مقالات' : 'تعليقات'} حتى الآن
                  </Typography>
                </Box>
              )}
            </Paper>
          </Box>
        )}

        {/* Settings Tab */}
        {currentTab === 5 && (userRole === 'owner' || userRole === 'admin' || userRole === 'Admin') && (
          <Box>
            <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
              <Typography variant="h5" fontWeight={700} mb={4}>
                ⚙️ إعدادات المجموعة
              </Typography>

              <Stack spacing={4}>
                {/* Publish Setting */}
                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={groupData?.groupSettings?.publish ?? true}
                        onChange={(e) => handleSettingsUpdate('publish', e.target.checked)}
                        disabled={settingsLoading}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="h6" fontWeight={600}>
                          النشر المباشر
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {groupData?.groupSettings?.publish !== false 
                            ? 'المنشورات تظهر مباشرة بدون موافقة' 
                            : 'المنشورات تحتاج موافقة المشرف قبل الظهور'
                          }
                        </Typography>
                      </Box>
                    }
                    sx={{ alignItems: 'flex-start', mb: 2 }}
                  />
                </Box>

                <Divider />

                {/* Allow Reports Setting */}
                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={groupData?.groupSettings?.allowReports ?? true}
                        onChange={(e) => handleSettingsUpdate('allowReports', e.target.checked)}
                        disabled={settingsLoading}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="h6" fontWeight={600}>
                          السماح بالبلاغات
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {groupData?.groupSettings?.allowReports !== false 
                            ? 'الأعضاء يمكنهم إبلاغ عن المنشورات والتعليقات' 
                            : 'البلاغات معطلة في هذه المجموعة'
                          }
                        </Typography>
                      </Box>
                    }
                    sx={{ alignItems: 'flex-start' }}
                  />
                </Box>
              </Stack>

              {settingsLoading && (
                <Box sx={{ textAlign: 'center', mt: 3 }}>
                  <CircularProgress size={24} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    جاري تحديث الإعدادات...
                  </Typography>
                </Box>
              )}
            </Paper>
          </Box>
        )}

        {/* Reports Tab */}
        {currentTab === 6 && (userRole === 'owner' || userRole === 'admin' || userRole === 'Admin') && (
          <Box>
            <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
              <Typography variant="h5" fontWeight={700} mb={3}>
                📋 البلاغات
              </Typography>
              
              {/* Report Type Tabs */}
              <Stack direction="row" spacing={2} mb={3}>
                <Button
                  variant={reportType === 'blog' ? 'contained' : 'outlined'}
                  onClick={() => handleReportTypeChange('blog')}
                  startIcon={<ArticleIcon />}
                >
                  المنشورات
                </Button>
                <Button
                  variant={reportType === 'comment' ? 'contained' : 'outlined'}
                  onClick={() => handleReportTypeChange('comment')}
                  startIcon={<CommentIcon />}
                >
                  التعليقات
                </Button>
              </Stack>
              
              {loadingReports ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : reports.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <ReportIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" mb={1}>
                    لا توجد بلاغات
                  </Typography>
                  <Typography variant="body2" color="text.disabled">
                    لم يتم الإبلاغ عن أي {reportType === 'blog' ? 'منشورات' : 'تعليقات'} في هذه المجموعة
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'grid', gap: 2 }}>
                  {reports.map((report) => (
                    <Paper 
                      key={report.id} 
                      elevation={1}
                      sx={{ 
                        p: 3, 
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: 'grey.200',
                        transition: 'all 0.2s',
                        '&:hover': {
                          elevation: 3,
                          borderColor: 'primary.main',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        {/* Reporter Info */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 80 }}>
                          <Avatar 
                            src={report.User?.photo ? `${API_BASE}/${report.User.photo}` : undefined}
                            sx={{ 
                              width: 56, 
                              height: 56,
                              border: '3px solid',
                              borderColor: 'primary.light'
                            }}
                          >
                            {report.User?.username?.[0]?.toUpperCase()}
                          </Avatar>
                          <Typography 
                            variant="caption" 
                            fontWeight={600}
                            color="primary.main"
                            sx={{ 
                              mt: 1,
                              cursor: 'pointer',
                              textAlign: 'center',
                              '&:hover': { textDecoration: 'underline' }
                            }}
                            onClick={() => navigate(`/profile/${report.User?.username}`)}
                          >
                            {report.User?.username || 'محذوف'}
                          </Typography>
                        </Box>
                        
                        {/* Report Details */}
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(report.createdAt).toLocaleDateString('ar-EG', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Typography>
                            <Chip 
                              label={report.service === 'blog' ? '📝 منشور' : '💬 تعليق'} 
                              size="small"
                              variant="outlined"
                              color={report.service === 'blog' ? 'primary' : 'secondary'}
                            />
                          </Box>
                          
                          <Box sx={{ 
                            bgcolor: 'warning.light', 
                            p: 2, 
                            borderRadius: 2,
                            mb: 2,
                            borderLeft: '4px solid',
                            borderLeftColor: 'warning.main'
                          }}>
                            <Typography variant="body2" fontWeight={600} color="warning.dark" mb={0.5}>
                              ⚠️ سبب البلاغ:
                            </Typography>
                            <Typography variant="body1" color="warning.dark">
                              {report.content}
                            </Typography>
                          </Box>
                          
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button 
                              variant="outlined" 
                              size="small"
                              startIcon={<ArticleIcon />}
                              onClick={() => {
                                setSelectedReport(report)
                                setShowContentDialog(true)
                              }}
                            >
                              عرض المحتوى
                            </Button>
                            {(userRole === 'owner' || userRole === 'admin' || userRole === 'Admin') && (
                              <Button 
                                variant="contained" 
                                size="small"
                                color="error"
                                startIcon={<DeleteIcon />}
                                onClick={() => {
                                  if (report.Blog) handleDeleteBlog(report.Blog.id)
                                  // TODO: Add delete comment function
                                }}
                              >
                                حذف
                              </Button>
                            )}
                          </Stack>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )}
            </Paper>
          </Box>
        )}

        {/* Pending Blogs Tab */}
        {currentTab === 7 && (userRole === 'owner' || userRole === 'admin' || userRole === 'Admin') && (
          <Box>
            <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
              <Typography variant="h5" fontWeight={700} mb={3}>
                📝 المنشورات المعلقة
              </Typography>
              
              {loadingPending ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : pendingBlogs.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <ArticleIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" mb={1}>
                    لا توجد منشورات معلقة
                  </Typography>
                  <Typography variant="body2" color="text.disabled">
                    جميع المنشورات تمت الموافقة عليها
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {pendingBlogs.map((blog) => (
                    <Card 
                      key={blog.id} 
                      sx={{ 
                        borderRadius: 2, 
                        border: '1px solid', 
                        borderColor: 'warning.light',
                        opacity: processingBlog === blog.id ? 0.5 : 1,
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <CardContent>
                        <Stack direction="row" spacing={2}>
                          <Avatar 
                            src={blog.userData?.photo ? `${API_BASE}/${blog.userData.photo}` : undefined}
                            sx={{ width: 48, height: 48 }}
                          >
                            {blog.userData?.username?.[0]?.toUpperCase()}
                          </Avatar>
                          
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" fontWeight={600} mb={1}>
                              {blog.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" mb={2}>
                              {blog.content?.substring(0, 150)}{blog.content?.length > 150 ? '...' : ''}
                            </Typography>
                            
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="caption" color="text.secondary">
                                بواسطة: {blog.userData?.username || 'مستخدم'} • {new Date(blog.createdAt).toLocaleDateString('ar-EG')}
                              </Typography>
                              
                              <Stack direction="row" spacing={1}>
                                <Button 
                                  variant="contained" 
                                  size="small"
                                  color="success"
                                  onClick={() => handleAcceptBlog(blog.id)}
                                  disabled={processingBlog === blog.id}
                                >
                                  {processingBlog === blog.id ? 'جاري القبول...' : 'قبول'}
                                </Button>
                                <Button 
                                  variant="outlined" 
                                  size="small"
                                  color="error"
                                  onClick={() => handleCancelBlog(blog.id)}
                                  disabled={processingBlog === blog.id}
                                >
                                  {processingBlog === blog.id ? 'جاري الرفض...' : 'رفض'}
                                </Button>
                              </Stack>
                            </Stack>
                            
                            {blog.photo && (
                              <Box sx={{ mt: 2 }}>
                                <img 
                                  src={`${API_BASE}/${blog.photo}`}
                                  alt={blog.title}
                                  style={{ 
                                    maxWidth: '100%', 
                                    maxHeight: '200px', 
                                    borderRadius: '8px',
                                    objectFit: 'cover'
                                  }}
                                />
                              </Box>
                            )}
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </Paper>
          </Box>
        )}
      </Box>

      {/* Kick Confirmation Dialog */}
      <Dialog
        open={kickDialog.open}
        onClose={() => setKickDialog({ open: false, username: '' })}
        PaperProps={{
          sx: { borderRadius: 2, minWidth: 400 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.5rem' }}>
          ⚠️ تأكيد الطرد
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" color="text.secondary">
            هل أنت متأكد من طرد <strong>{kickDialog.username}</strong> من المجموعة؟
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            لن يستطيع العودة إلا بطلب انضمام جديد
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setKickDialog({ open: false, username: '' })}
            variant="outlined"
          >
            إلغاء
          </Button>
          <Button
            onClick={confirmKick}
            variant="contained"
            color="error"
          >
            طرد
          </Button>
        </DialogActions>
      </Dialog>

      {/* Content View Dialog */}
      <Dialog
        open={showContentDialog}
        onClose={() => setShowContentDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.5rem' }}>
          عرض المحتوى المبلغ عنه
        </DialogTitle>
        <DialogContent>
          {selectedReport?.Blog && (
            <Box>
              <Typography variant="h6" fontWeight={600} mb={2}>
                {selectedReport.Blog.title}
              </Typography>
              <Typography variant="body1" mb={2} sx={{ whiteSpace: 'pre-wrap' }}>
                {selectedReport.Blog.content}
              </Typography>
              {selectedReport.Blog.User && (
                <Typography variant="body2" color="text.secondary" mb={2}>
                  <strong>كاتب المنشور:</strong> {selectedReport.Blog.User.username}
                </Typography>
              )}
              {selectedReport.Blog.photo && (
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <img 
                    src={`${API_BASE}/${selectedReport.Blog.photo}`}
                    alt="صورة المنشور"
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '400px', 
                      borderRadius: '8px',
                      objectFit: 'contain'
                    }}
                  />
                </Box>
              )}
            </Box>
          )}
          {selectedReport?.commentsBlogs && (
            <Box>
              <Typography variant="body1" mb={2} sx={{ whiteSpace: 'pre-wrap' }}>
                {selectedReport.commentsBlogs.content}
              </Typography>
              {selectedReport.commentsBlogs.User && (
                <Typography variant="body2" color="text.secondary">
                  <strong>كاتب التعليق:</strong> {selectedReport.commentsBlogs.User.username}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShowContentDialog(false)}>
            إغلاق
          </Button>
          {(userRole === 'owner' || userRole === 'admin' || userRole === 'Admin') && selectedReport?.Blog && (
            <Button 
              variant="contained" 
              color="error"
              onClick={() => {
                handleDeleteBlog(selectedReport.Blog.id)
                setShowContentDialog(false)
              }}
            >
              حذف المحتوى
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Transfer Ownership Dialog */}
      <Dialog
        open={transferDialog.open}
        onClose={() => setTransferDialog({ open: false, username: '', userId: '' })}
        PaperProps={{
          sx: { borderRadius: 2, minWidth: 450 }
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 700, 
          fontSize: '1.4rem',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          color: 'primary.main'
        }}>
          <SwapHorizIcon sx={{ fontSize: 28 }} />
          نقل ملكية المجموعة
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body1" color="text.primary" mb={2}>
            هل أنت متأكد من نقل ملكية المجموعة إلى <strong>{transferDialog.username}</strong>؟
          </Typography>
          <Box sx={{ 
            bgcolor: 'warning.light', 
            p: 2, 
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'warning.main'
          }}>
            <Typography variant="body2" color="warning.dark" fontWeight={600} mb={1}>
              ⚠️ تنبيه مهم:
            </Typography>
            <Box component="ul" sx={{ pl: 2, m: 0 }}>
              <Typography component="li" variant="body2" color="warning.dark">
                ستفقد جميع صلاحيات المالك
              </Typography>
              <Typography component="li" variant="body2" color="warning.dark">
                لن تستطيع الوصول لإعدادات المجموعة
              </Typography>
              <Typography component="li" variant="body2" color="warning.dark">
                سيصبح {transferDialog.username} المالك الجديد
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setTransferDialog({ open: false, username: '', userId: '' })}
            variant="outlined"
            disabled={transferring}
          >
            إلغاء
          </Button>
          <Button
            onClick={confirmTransferOwnership}
            variant="contained"
            color="primary"
            disabled={transferring}
            startIcon={<SwapHorizIcon />}
            sx={{ minWidth: 150 }}
          >
            {transferring ? 'جاري النقل...' : 'نقل الملكية'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Group Confirmation Dialog */}
      <Dialog
        open={deleteGroupDialog}
        onClose={() => setDeleteGroupDialog(false)}
        PaperProps={{
          sx: { borderRadius: 2, minWidth: 500 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.5rem', color: 'error.main' }}>
          ⚠️ تأكيد حذف المجموعة
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" color="text.secondary" mb={2}>
            هل أنت متأكد من حذف مجموعة <strong>{groupName}</strong> نهائياً؟
          </Typography>
          <Typography variant="body2" color="error" sx={{ fontWeight: 600 }}>
            ⚠️ تحذير: هذا الإجراء لا يمكن التراجع عنه وسيتم حذف:
          </Typography>
          <Box component="ul" sx={{ mt: 1, pl: 2 }}>
            <Typography component="li" variant="body2" color="error">جميع المنشورات والتعليقات</Typography>
            <Typography component="li" variant="body2" color="error">جميع الأعضاء وطلبات الانضمام</Typography>
            <Typography component="li" variant="body2" color="error">جميع الإعدادات والبيانات</Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setDeleteGroupDialog(false)}
            variant="outlined"
            disabled={deletingGroup}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleDeleteGroup}
            variant="contained"
            color="error"
            disabled={deletingGroup}
            sx={{ minWidth: 150 }}
          >
            {deletingGroup ? 'جاري الحذف...' : '🗑️ حذف نهائياً'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
