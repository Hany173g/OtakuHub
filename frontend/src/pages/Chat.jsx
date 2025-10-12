import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Stack,
  Divider,
  Container,
  Chip
} from '@mui/material'
import {
  Send as SendIcon,
  Close as CloseIcon,
  Minimize as MinimizeIcon
} from '@mui/icons-material'
import { useSocket } from '../contexts/SocketContext'
import { getChat } from '../lib/api'

export default function Chat() {
  const { username } = useParams()
  const { joinChat, sendMessage, socket } = useSocket()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (username && username.trim() !== '') {
      loadChat()
      joinChat()
    } else {
      console.error('❌ No username provided in Chat page')
      setLoading(false)
    }
    
    // Listen for incoming messages
    if (socket) {
      socket.on('messageSend', (content) => {
        console.log('📨 Received message:', content)
        // Add received message to chat
        setMessages(prev => [...prev, {
          content,
          isOwner: false,
          createdAt: new Date().toISOString()
        }])
      })
    }

    return () => {
      if (socket) {
        socket.off('messageSend')
      }
    }
  }, [username, socket])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadChat = async () => {
    if (!username || username.trim() === '') {
      console.error('❌ Cannot load chat without username')
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      const response = await getChat(username)
      setMessages(response.data.allChat || [])
    } catch (err) {
      console.error('❌ خطأ في تحميل المحادثة:', err)
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = () => {
    if (!newMessage.trim()) return
    
    if (!username || username.trim() === '') {
      console.error('❌ Cannot send message without username')
      return
    }

    // Add message to UI immediately
    const messageData = {
      content: newMessage,
      isOwner: true,
      createdAt: new Date().toISOString()
    }
    
    setMessages(prev => [...prev, messageData])
    
    // Send via socket
    sendMessage(username, newMessage)
    
    setNewMessage('')
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography>جاري تحميل المحادثة...</Typography>
      </Container>
    )
  }

  return (
    <Box sx={{ 
      position: 'fixed',
      bottom: 0,
      right: 20,
      width: 320,
      height: isMinimized ? 56 : 450,
      bgcolor: 'white',
      borderRadius: '8px 8px 0 0',
      boxShadow: '0 -2px 12px rgba(0,0,0,0.15)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      transition: 'height 0.3s ease'
    }}>
      {/* Mini Chat Header */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 1.5, 
          bgcolor: '#1877f2',
          color: 'white',
          borderRadius: '8px 8px 0 0',
          cursor: isMinimized ? 'pointer' : 'default'
        }}
        onClick={isMinimized ? () => setIsMinimized(false) : undefined}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar 
              sx={{ 
                width: 32, 
                height: 32,
                bgcolor: 'white',
                color: '#1877f2',
                fontSize: '0.9rem',
                fontWeight: 600
              }}
            >
              {username?.charAt(0)?.toUpperCase()}
            </Avatar>
            <Typography variant="body2" fontWeight={600}>
              {username}
            </Typography>
          </Stack>
          
          <Stack direction="row" spacing={0.5}>
            <IconButton 
              size="small"
              onClick={(e) => {
                e.stopPropagation()
                setIsMinimized(!isMinimized)
              }}
              sx={{ 
                color: 'white', 
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                width: 28,
                height: 28
              }}
            >
              <MinimizeIcon sx={{ fontSize: 16 }} />
            </IconButton>
            <IconButton 
              size="small"
              onClick={() => window.history.back()}
              sx={{ 
                color: 'white', 
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                width: 28,
                height: 28
              }}
            >
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Stack>
        </Stack>
      </Paper>

      {/* Messages Container - Mini Style */}
      {!isMinimized && (
        <Box sx={{ 
          flex: 1, 
          overflowY: 'auto',
          px: 1.5,
          py: 1,
          bgcolor: '#f8f9fa'
        }}>
          {messages.length === 0 ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%',
              py: 4
            }}>
              <Typography variant="body2" color="#65676b" textAlign="center">
                ابدأ المحادثة مع {username}
              </Typography>
            </Box>
          ) : (
            messages.map((message, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: message.isOwner ? 'flex-end' : 'flex-start',
                  mb: 0.5
                }}
              >
                <Box
                  sx={{
                    maxWidth: '75%',
                    bgcolor: message.isOwner ? '#1877f2' : 'white',
                    color: message.isOwner ? 'white' : '#050505',
                    px: 1.5,
                    py: 0.8,
                    borderRadius: message.isOwner 
                      ? '16px 16px 4px 16px' 
                      : '16px 16px 16px 4px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    fontSize: '0.85rem'
                  }}
                >
                  <Typography variant="body2" sx={{ fontSize: '0.85rem', lineHeight: 1.3 }}>
                    {message.content}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontSize: '0.65rem',
                      opacity: 0.7,
                      display: 'block',
                      textAlign: message.isOwner ? 'right' : 'left',
                      mt: 0.3
                    }}
                  >
                    {formatTime(message.createdAt)}
                  </Typography>
                </Box>
              </Box>
            ))
          )}
          <div ref={messagesEndRef} />
        </Box>
      )}

      {/* Mini Message Input */}
      {!isMinimized && (
        <Box sx={{ 
          p: 1.5, 
          bgcolor: 'white',
          borderTop: '1px solid #e4e6ea'
        }}>
          <Stack direction="row" spacing={1} alignItems="flex-end">
            <TextField
              fullWidth
              multiline
              maxRows={3}
              placeholder="اكتب رسالة..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              variant="outlined"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '18px',
                  bgcolor: '#f0f2f5',
                  fontSize: '0.85rem',
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none'
                  },
                  '&.Mui-focused': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: '1px solid #1877f2'
                    }
                  }
                },
                '& .MuiInputBase-input': {
                  py: 1,
                  fontSize: '0.85rem'
                }
              }}
            />
            
            <IconButton
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              size="small"
              sx={{
                bgcolor: newMessage.trim() ? '#1877f2' : '#e4e6ea',
                color: 'white',
                width: 32,
                height: 32,
                '&:hover': {
                  bgcolor: newMessage.trim() ? '#166fe5' : '#e4e6ea'
                },
                '&:disabled': {
                  color: '#bcc0c4'
                }
              }}
            >
              <SendIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Stack>
        </Box>
      )}
    </Box>
  )
}
