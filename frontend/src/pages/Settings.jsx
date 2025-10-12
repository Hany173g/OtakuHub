import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Paper,
  Typography,
  Box,
  Avatar,
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Divider,
  Collapse,
  ListItemButton
} from '@mui/material'
import {
  Block as BlockIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material'
import { getBlockedUsers, unblockUser, API_BASE } from '../lib/api'

export default function Settings() {
  const navigate = useNavigate()
  const [blockedUsers, setBlockedUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [unblockDialogOpen, setUnblockDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [expandedSection, setExpandedSection] = useState(null)

  useEffect(() => {
    if (expandedSection === 'blocks') {
      loadBlockedUsers()
    }
  }, [expandedSection])

  const loadBlockedUsers = async () => {
    try {
      setLoading(true)
      const { data } = await getBlockedUsers()
      setBlockedUsers(data.usersBlocks || [])
    } catch (err) {
      console.error('Error loading blocked users:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUnblock = async () => {
    if (!selectedUser) return
    
    setProcessing(true)
    try {
      await unblockUser(selectedUser.username)
      setBlockedUsers(prev => prev.filter(user => user.username !== selectedUser.username))
      setUnblockDialogOpen(false)
      setSelectedUser(null)
    } catch (err) {
      console.error('Error unblocking user:', err)
      alert(err.response?.data?.message || 'فشل في إلغاء الحظر')
    } finally {
      setProcessing(false)
    }
  }

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper 
        elevation={0}
        sx={{ 
          p: 4, 
          mb: 4, 
          borderRadius: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}
      >
        <Typography variant="h3" fontWeight={800} mb={1}>
          ⚙️ الإعدادات
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9 }}>
          إدارة حسابك وتفضيلاتك
        </Typography>
      </Paper>

      {/* Settings List */}
      <Stack spacing={2}>
        {/* Blocked Users Section */}
        <Paper 
          elevation={expandedSection === 'blocks' ? 4 : 1}
          sx={{ 
            borderRadius: 3,
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            border: expandedSection === 'blocks' ? '2px solid' : '1px solid',
            borderColor: expandedSection === 'blocks' ? 'error.main' : 'divider'
          }}
        >
          <ListItemButton
            onClick={() => toggleSection('blocks')}
            sx={{
              p: 3,
              '&:hover': { 
                bgcolor: 'error.50',
                '& .MuiSvgIcon-root': { color: 'error.main' }
              }
            }}
          >
            <Stack direction="row" alignItems="center" spacing={3} sx={{ flex: 1 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 2,
                  bgcolor: 'error.light',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <BlockIcon sx={{ fontSize: 32, color: 'error.dark' }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight={700} mb={0.5}>
                  المستخدمون المحظورون
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  إدارة المستخدمين الذين قمت بحظرهم
                </Typography>
              </Box>
              <IconButton
                sx={{
                  transform: expandedSection === 'blocks' ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s',
                  bgcolor: expandedSection === 'blocks' ? 'error.light' : 'action.hover'
                }}
              >
                <ExpandMoreIcon />
              </IconButton>
            </Stack>
          </ListItemButton>
          
          <Collapse in={expandedSection === 'blocks'} timeout="auto" unmountOnExit>
            <Divider />
            <Box sx={{ p: 3, bgcolor: 'background.default' }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : blockedUsers.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  لا يوجد مستخدمون محظورون
                </Alert>
              ) : (
                <Stack spacing={2}>
                  {blockedUsers.map((user) => (
                    <Paper
                      key={user.id}
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: 'primary.main',
                          boxShadow: 2
                        }
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar
                          src={user.photo ? `${API_BASE}/${user.photo}` : undefined}
                          sx={{ 
                            width: 56, 
                            height: 56,
                            cursor: 'pointer',
                            border: '3px solid',
                            borderColor: 'divider',
                            '&:hover': { borderColor: 'primary.main' }
                          }}
                          onClick={() => navigate(`/profile/${user.username}`)}
                        >
                          {user.username?.[0]?.toUpperCase()}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography 
                            variant="h6" 
                            fontWeight={700}
                            sx={{ 
                              cursor: 'pointer',
                              '&:hover': { color: 'primary.main' }
                            }}
                            onClick={() => navigate(`/profile/${user.username}`)}
                          >
                            {user.username}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            محظور
                          </Typography>
                        </Box>
                        <Button
                          variant="contained"
                          color="primary"
                          size="medium"
                          onClick={() => {
                            setSelectedUser(user)
                            setUnblockDialogOpen(true)
                          }}
                          sx={{ 
                            minWidth: 120,
                            fontWeight: 600
                          }}
                        >
                          إلغاء الحظر
                        </Button>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Box>
          </Collapse>
        </Paper>
      </Stack>

      {/* Unblock Confirmation Dialog */}
      <Dialog
        open={unblockDialogOpen}
        onClose={() => !processing && setUnblockDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          إلغاء حظر المستخدم
        </DialogTitle>
        <DialogContent>
          <Typography>
            هل أنت متأكد من إلغاء حظر <strong>{selectedUser?.username}</strong>؟
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            سيتمكن هذا المستخدم من رؤية منشوراتك ومراسلتك مرة أخرى.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setUnblockDialogOpen(false)}
            disabled={processing}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleUnblock}
            variant="contained"
            color="primary"
            disabled={processing}
          >
            {processing ? 'جاري الإلغاء...' : 'نعم، إلغاء الحظر'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
