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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  People as PeopleIcon,
  Gavel as GavelIcon,
  Dashboard as DashboardIcon,
  Search as SearchIcon,
  Settings as SettingsIcon
} from '@mui/icons-material'
import { API_BASE, getPendingUsers, acceptUser, cancelUser, checkGroupAccess, api, searchMembers, changeRole, kickUser, updateGroupData, getGroup, storage } from '../lib/api'

export default function GroupDashboard() {
  const { groupName } = useParams()
  const navigate = useNavigate()
  const [pendingUsers, setPendingUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(null)
  const [hasAccess, setHasAccess] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentTab, setCurrentTab] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const [allPendingUsers, setAllPendingUsers] = useState([])
  
  // Members state
  const [members, setMembers] = useState([])
  const [memberSearchTerm, setMemberSearchTerm] = useState('')
  const [isSearchingMembers, setIsSearchingMembers] = useState(false)
  const [hasSearchedMembers, setHasSearchedMembers] = useState(false)
  const [kickDialog, setKickDialog] = useState({ open: false, username: '' })
  
  // Settings state
  const [groupData, setGroupData] = useState({ description: '', privacy: '', photo: '' })
  const [settingsForm, setSettingsForm] = useState({ description: '', privacy: 'public' })
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [savingSettings, setSavingSettings] = useState(false)
  
  // Error/Success state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' })

  useEffect(() => {
    checkAccess()
    loadGroupData()
  }, [groupName])

  const loadGroupData = async () => {
    try {
      const { data } = await getGroup(groupName)
      setGroupData(data)
      setSettingsForm({ 
        description: data.description || '', 
        privacy: data.privacy || 'public' 
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
      setPendingUsers(prev => prev.filter(user => user.id !== id))
      setSnackbar({ open: true, message: 'تم قبول العضو بنجاح', severity: 'success' })
    } catch (err) {
      console.error('Error accepting user:', err)
      setSnackbar({ 
        open: true, 
        message: err.response?.data?.message || 'فشل قبول العضو', 
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
      setPendingUsers(prev => prev.filter(user => user.id !== id))
      setSnackbar({ open: true, message: 'تم رفض العضو', severity: 'info' })
    } catch (err) {
      console.error('Error rejecting user:', err)
      setSnackbar({ 
        open: true, 
        message: err.response?.data?.message || 'فشل رفض العضو', 
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
    try {
      setProcessing(username)
      await changeRole(groupName, username, newRole)
      // Refresh search after role change
      await searchMembersFunc()
      // Refresh user data to update cached role
      await refreshUserData()
      setSnackbar({ open: true, message: 'تم تغيير الصلاحية بنجاح', severity: 'success' })
    } catch (err) {
      console.error('Error changing role:', err)
      setSnackbar({ 
        open: true, 
        message: err.response?.data?.message || 'فشل تغيير الصلاحية', 
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
        message: err.response?.data?.message || 'فشل طرد العضو', 
        severity: 'error' 
      })
    } finally {
      setProcessing(null)
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
        message: err.response?.data?.message || 'فشل حفظ الإعدادات', 
        severity: 'error' 
      })
    } finally {
      setSavingSettings(false)
    }
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
              onClick={() => setCurrentTab(0)}
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
              onClick={() => setCurrentTab(2)}
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
              onClick={() => setCurrentTab(1)}
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
                ⚙️ إعدادات المجموعة
              </Typography>
              
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
              </Stack>
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
