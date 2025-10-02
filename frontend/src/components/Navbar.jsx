import { useState, useEffect } from 'react'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Avatar from '@mui/material/Avatar'
import Badge from '@mui/material/Badge'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemText from '@mui/material/ListItemText'
import NotificationsIcon from '@mui/icons-material/Notifications'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import PeopleIcon from '@mui/icons-material/People'
import { Link, useNavigate } from 'react-router-dom'
import { storage, getFriendsRequest, acceptFriendRequest, rejectFriendRequest } from '../lib/api'
import { useSocket } from '../contexts/SocketContext'
import { useChat } from '../contexts/ChatContext'

export default function Navbar() {
  const navigate = useNavigate()
  const isAuthed = !!storage.token
  const { notifications, isConnected, socket, clearMessageNotifications } = useSocket()
  const { openChat } = useChat()
  
  // Notification states
  const [notificationAnchor, setNotificationAnchor] = useState(null)
  const [friendRequests, setFriendRequests] = useState([])
  
  // Friends states
  const [friendsAnchor, setFriendsAnchor] = useState(null)
  const [friends, setFriends] = useState([])
  const [totalNotifications, setTotalNotifications] = useState(0)

  // Load friend requests from API and join notification room
  useEffect(() => {
    if (isAuthed) {
      loadFriendRequests()
      
      // Join notification room when navbar loads
      if (socket && isConnected) {
        socket.emit('joinNotificationRoom', storage.token)
      }
    }
  }, [isAuthed, socket, isConnected])

  // Update total notifications when socket notifications change
  useEffect(() => {
    setTotalNotifications(friendRequests.length + notifications.length)
  }, [friendRequests.length, notifications.length])

  const loadFriendRequests = async () => {
    try {
      const { data } = await getFriendsRequest()
      setFriendRequests(data.allUsersReceived || [])
    } catch (err) {
      console.error('Error loading friend requests:', err)
    }
  }

  const handleNotificationClick = (event) => {
    setNotificationAnchor(event.currentTarget)
  }

  const handleNotificationClose = () => {
    setNotificationAnchor(null)
    // Clear message notifications when closing the menu
    clearMessageNotifications()
  }

  const handleAcceptFriendRequest = async (username) => {
    try {
      console.log('🔄 قبول طلب صداقة من:', username)
      await acceptFriendRequest(username)
      
      // إزالة الطلب من القائمة
      setFriendRequests(prev => prev.filter(req => req.username !== username))
      console.log('✅ تم قبول طلب الصداقة')
    } catch (err) {
      console.error('❌ خطأ في قبول الطلب:', err)
    }
  }

  const handleRejectFriendRequest = async (username) => {
    try {
      console.log('🔄 رفض طلب صداقة من:', username)
      // إرسال service = "rejectRequest" كما طلبت
      await rejectFriendRequest(username, "rejectRequest")
      
      // إزالة الطلب من القائمة
      setFriendRequests(prev => prev.filter(req => req.username !== username))
      console.log('✅ تم رفض طلب الصداقة')
    } catch (err) {
      console.error('❌ خطأ في رفض الطلب:', err)
    }
  }

  const loadFriends = () => {
    if (socket && isConnected) {
      console.log('👥 Loading friends list...')
      socket.emit('getFriends', storage.token)
    }
  }

  // Listen for friends response
  useEffect(() => {
    if (socket) {
      socket.on('sendFriends', (friendsData) => {
        console.log('👥 Received friends:', friendsData)
        setFriends(friendsData || [])
      })

      return () => {
        socket.off('sendFriends')
      }
    }
  }, [socket])

  const handleFriendsClick = (event) => {
    setFriendsAnchor(event.currentTarget)
    loadFriends()
  }

  const handleFriendsClose = () => {
    setFriendsAnchor(null)
  }

  const handleLogout = () => {
    storage.token = null
    storage.user = null
    navigate('/login')
  }
  return (
    <AppBar 
      position="sticky" 
      sx={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(102, 126, 234, 0.2)',
        borderBottom: 'none'
      }}
    >
      <Toolbar sx={{ 
        display: 'flex', 
        gap: { xs: 1, sm: 2 }, 
        justifyContent: 'space-between', 
        px: { xs: 1, sm: 2, md: 3 }, 
        py: 1,
        minHeight: { xs: '56px !important', sm: '64px !important', md: '70px !important' },
        flexWrap: 'nowrap'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 2 } }}>
          <Typography 
            variant={{ xs: 'h6', sm: 'h5' }} 
            sx={{ 
              fontWeight: 800, 
              color: 'white',
              fontFamily: '"Poppins", "Cairo", sans-serif',
              letterSpacing: '0.5px',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              fontSize: { xs: '1rem', sm: '1.3rem', md: '1.5rem' }
            }}
          >
            🌟 OtakuHub
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1, md: 2 } }}>
          <Button 
            component={Link} 
            to="/" 
            sx={{
              color: 'white',
              fontWeight: 600,
              px: { xs: 1, sm: 2, md: 3 },
              py: { xs: 0.5, sm: 1 },
              fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
              borderRadius: '25px',
              display: { xs: 'none', sm: 'flex' },
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)'
              }
            }}
          >
            🏠 الرئيسية
          </Button>
          <Button 
            component={Link} 
            to="/groups" 
            sx={{
              color: 'white',
              fontWeight: 600,
              px: { xs: 1, sm: 2, md: 3 },
              py: { xs: 0.5, sm: 1 },
              fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
              borderRadius: '25px',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)'
              }
            }}
          >
            👥 المجموعات
          </Button>
          {!isAuthed ? (
            <>
              <Button 
                component={Link} 
                to="/login" 
                variant="outlined" 
                sx={{ 
                  color: 'white',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  borderRadius: '25px',
                  px: { xs: 1.5, sm: 2, md: 3 },
                  py: { xs: 0.5, sm: 1 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                دخول
              </Button>
              <Button 
                component={Link} 
                to="/register" 
                variant="contained" 
                sx={{ 
                  bgcolor: 'white',
                  color: '#667eea',
                  borderRadius: '25px',
                  px: { xs: 1.5, sm: 2, md: 3 },
                  py: { xs: 0.5, sm: 1 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
                  fontWeight: 700,
                  boxShadow: '0 4px 15px rgba(255, 255, 255, 0.3)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(255, 255, 255, 0.4)'
                  }
                }}
              >
                تسجيل
              </Button>
            </>
          ) : (
            <>
              <Button 
                component={Link} 
                to={`/profile/${storage.user?.username || 'user'}`} 
                sx={{
                  color: 'white',
                  fontWeight: 600,
                  px: { xs: 1, sm: 2, md: 3 },
                  py: { xs: 0.5, sm: 1 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
                  borderRadius: '25px',
                  display: { xs: 'none', sm: 'flex' },
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)'
                  }
                }}
              >
                👤 الملف
              </Button>
              
              {/* Friends Icon */}
              <IconButton 
                onClick={handleFriendsClick} 
                sx={{
                  color: 'white',
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '15px',
                  p: { xs: 0.8, sm: 1.2, md: 1.5 },
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    transform: 'scale(1.05)'
                  }
                }}
              >
                <Badge 
                  badgeContent={friends.filter(f => f.isOnline).length} 
                  sx={{
                    '& .MuiBadge-badge': {
                      bgcolor: '#4CAF50',
                      color: 'white',
                      fontWeight: 600
                    }
                  }}
                >
                  <PeopleIcon sx={{ fontSize: 24 }} />
                </Badge>
              </IconButton>
              
              {/* Notification Icon */}
              <IconButton 
                onClick={handleNotificationClick} 
                sx={{
                  color: 'white',
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '15px',
                  p: 1.5,
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    transform: 'scale(1.05)'
                  }
                }}
              >
                <Badge 
                  badgeContent={totalNotifications} 
                  sx={{
                    '& .MuiBadge-badge': {
                      bgcolor: '#FF5722',
                      color: 'white',
                      fontWeight: 600,
                      animation: totalNotifications > 0 ? 'pulse 2s infinite' : 'none'
                    }
                  }}
                >
                  <NotificationsIcon sx={{ fontSize: 24 }} />
                </Badge>
              </IconButton>

              <Button 
                onClick={handleLogout} 
                variant="outlined" 
                sx={{ 
                  color: 'white',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  borderRadius: '25px',
                  px: 3,
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: '#FF5722',
                    bgcolor: 'rgba(255, 87, 34, 0.1)',
                    color: '#FF5722'
                  }
                }}
              >
                🚪 خروج
              </Button>
            </>
          )}
        </Box>
      </Toolbar>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={handleNotificationClose}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 400,
            overflow: 'auto'
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight={600}>
            الإشعارات
          </Typography>
        </Box>
        <Divider />
        
        {/* Real-time Notifications */}
        {notifications.length > 0 && (
          <>
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <NotificationsIcon color="secondary" />
              <Typography variant="subtitle2" fontWeight={600}>
                إشعارات جديدة ({notifications.length})
              </Typography>
            </Box>
            <List sx={{ py: 0 }}>
              {notifications.map((notification) => (
                <ListItem key={notification.id} sx={{ py: 1, bgcolor: 'action.hover' }}>
                  <ListItemAvatar>
                    <Avatar 
                      src={notification.from?.photo ? `http://localhost:5000/${notification.from.photo}` : undefined}
                      sx={{ width: 40, height: 40 }}
                    >
                      {!notification.from?.photo && notification.from?.username?.slice(0, 2).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Link 
                        to={`/profile/${notification.from?.username}`} 
                        style={{ textDecoration: 'none', color: 'inherit' }}
                        onClick={handleNotificationClose}
                      >
                        <Typography variant="body2" fontWeight={600}>
                          {notification.from?.username}
                        </Typography>
                      </Link>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="primary.main" sx={{ display: 'block', fontSize: '0.7rem' }}>
                          • جديد
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
            <Divider />
          </>
        )}

        {/* Friend Requests Section */}
        {friendRequests.length > 0 && (
          <>
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonAddIcon color="primary" />
              <Typography variant="subtitle2" fontWeight={600}>
                طلبات الصداقة ({friendRequests.length})
              </Typography>
            </Box>
            <List sx={{ py: 0 }}>
              {friendRequests.map((request, index) => (
                <ListItem key={index} sx={{ py: 1 }}>
                  <ListItemAvatar>
                    <Avatar 
                      src={request.photo ? `http://localhost:5000/${request.photo}` : undefined}
                      sx={{ width: 40, height: 40 }}
                    >
                      {!request.photo && request.username?.slice(0, 2).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Link 
                        to={`/profile/${request.username}`} 
                        style={{ textDecoration: 'none', color: 'inherit' }}
                        onClick={handleNotificationClose}
                      >
                        <Typography variant="body2" fontWeight={600}>
                          {request.username}
                        </Typography>
                      </Link>
                    }
                    secondary="أرسل لك طلب صداقة"
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      size="small" 
                      variant="contained" 
                      color="primary"
                      onClick={() => handleAcceptFriendRequest(request.username)}
                    >
                      قبول
                    </Button>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      color="secondary"
                      onClick={() => handleRejectFriendRequest(request.username)}
                    >
                      رفض
                    </Button>
                  </Box>
                </ListItem>
              ))}
            </List>
          </>
        )}

        {/* No Notifications */}
        {friendRequests.length === 0 && notifications.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              لا توجد إشعارات جديدة
            </Typography>
          </Box>
        )}
      </Menu>

      {/* Friends Menu */}
      <Menu
        anchorEl={friendsAnchor}
        open={Boolean(friendsAnchor)}
        onClose={handleFriendsClose}
        PaperProps={{
          sx: {
            width: 320,
            maxHeight: 400,
            overflow: 'auto'
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight={600}>
            الأصدقاء ({friends.length})
          </Typography>
        </Box>
        <Divider />
        
        {friends.length > 0 ? (
          <List sx={{ py: 0 }}>
            {friends.map((friend, index) => (
              <ListItem 
                key={index} 
                sx={{ 
                  py: 1, 
                  display: 'flex', 
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  pr: 1
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <ListItemAvatar>
                    <Avatar 
                      src={friend.photo ? `http://localhost:5000/${friend.photo}` : undefined}
                      sx={{ width: 40, height: 40 }}
                    >
                      {!friend.photo && friend.username?.slice(0, 2).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Link 
                        to={`/profile/${friend.username}`} 
                        style={{ textDecoration: 'none', color: 'inherit' }}
                        onClick={handleFriendsClose}
                      >
                        <Typography variant="body2" fontWeight={600}>
                          {friend.username}
                        </Typography>
                      </Link>
                    }
                    secondary={
                      <Typography variant="caption" color={friend.isOnline ? 'success.main' : 'text.secondary'}>
                        {friend.isOnline ? '🟢 متصل الآن' : '⚫ غير متصل'}
                      </Typography>
                    }
                  />
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    openChat(friend.username, friend.photo)
                    handleFriendsClose()
                  }}
                  sx={{ 
                    minWidth: 'auto', 
                    px: 1.5,
                    py: 0.5,
                    fontSize: '0.75rem',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)'
                    }
                  }}
                >
                  رسالة
                </Button>
              </ListItem>
            ))}
          </List>
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <PeopleIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              لا يوجد أصدقاء بعد
            </Typography>
          </Box>
        )}
      </Menu>
    </AppBar>
  )
}
