
import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { storage } from '../lib/api'

const SocketContext = createContext()

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [friendRequestStatus, setFriendRequestStatus] = useState(null)
  const [lastRequestTime, setLastRequestTime] = useState(0)
  const [isRequestPending, setIsRequestPending] = useState(false)

  useEffect(() => {
    if (storage.token) {
      const newSocket = io('http://localhost:5000', {
        auth: {
          token: storage.token
        }
      })

      newSocket.on('connect', () => {
        console.log('✅ Connected to server:', newSocket.id)
        setSocket(newSocket)
        setIsConnected(true)
        // Join notification room after connection
        console.log('🔔 Joining notification room with token')
        newSocket.emit('joinNotificationRoom', storage.token)
        
        // Send online status with token
        console.log('🟢 Setting user online with token')
        newSocket.emit('onlineUser', storage.token)
        
        newSocket.on('goOnline', (response) => {
          if (response.success) {
            console.log('✅ Successfully joined notification room')
          } else {
            console.log('❌ Failed to join notification room')
          }
        })
      })

      newSocket.on('joinNotificationRoomFailed', () => {
        console.log('Failed to join notification room')
      })

      // Listen for new friend requests
      newSocket.on('sentNewNotification', (data) => {
        console.log('🔔 New friend request received:', data)
        
        // Check if data structure is correct
        const userData = data.data || data
        
        if (userData && userData.username) {
          setNotifications(prev => [...prev, {
            id: Date.now(),
            type: 'friendRequest',
            from: userData,
            message: `${userData.username} أرسل لك طلب صداقة`,
            timestamp: new Date()
          }])
        } else {
          console.log('❌ Invalid notification data:', data)
        }
      })
      
      // Listen for new message notifications
      newSocket.on('messageSend', (data) => {
        console.log('💬 New message notification:', data)
        
        if (data && data.fromUsername) {
          setNotifications(prev => [...prev, {
            id: Date.now(),
            type: 'message',
            from: {
              username: data.fromUsername,
              id: data.fromUserId,
              photo: data.photo
            },
            message: `${data.fromUsername}: ${data.content}`,
            content: data.content,
            timestamp: new Date(data.timestamp)
          }])
        }
      })

      // Listen for friend request sent confirmation
      newSocket.on('requestSent', (data) => {
        console.log('📤 Friend request sent:', data)
        setIsRequestPending(false)
        
        if (data.success) {
          setFriendRequestStatus('sent')
        } else {
          console.error('❌ Friend request failed:', data.error)
        }
      })


      newSocket.on('disconnect', () => {
        console.log('Disconnected from server')
        setIsConnected(false)
      })

      setSocket(newSocket)

      return () => {
        newSocket.close()
      }
    }
  }, [])

  const sendFriendRequest = (friendUsername) => {
    const now = Date.now()
    
    // Prevent duplicate requests within 2 seconds
    if (now - lastRequestTime < 2000) {
      console.log('⏰ Request blocked - too soon after last request')
      return
    }
    
    if (socket && isConnected && !isRequestPending) {
      console.log('👥 Sending friend request to username:', friendUsername)
      
      setIsRequestPending(true)
      setLastRequestTime(now)
      
      // Send friend request with token and username  
      socket.emit('sendFriendRequest', storage.token, friendUsername)
    } else {
      console.log('❌ Socket not connected or request pending. Connected:', isConnected, 'Socket:', !!socket, 'Pending:', isRequestPending)
    }
  }

  const clearNotifications = () => {
    setNotifications([])
  }
  
  const clearMessageNotifications = () => {
    setNotifications(prev => prev.filter(n => n.type !== 'message'))
  }

  // Chat functions
  const joinChat = () => {
    if (socket && isConnected) {
      console.log('💬 Joining chat room')
      socket.emit('joinChat', storage.token)
    }
  }

  const sendMessage = (friendUsername, content) => {
    if (socket && isConnected) {
      console.log('📤 Sending message to:', friendUsername)
      socket.emit('sendMessage', storage.token, friendUsername, content)
    }
  }

  const removeNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
  }

  const value = {
    socket,
    isConnected,
    notifications,
    friendRequestStatus,
    isRequestPending,
    sendFriendRequest,
    clearNotifications,
    clearMessageNotifications,
    removeNotification,
    setFriendRequestStatus,
    joinChat,
    sendMessage
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}
