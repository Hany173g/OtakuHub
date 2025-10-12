import { createContext, useContext, useState } from 'react'
import ChatWidget from '../components/ChatWidget'

const ChatContext = createContext()

export const useChat = () => {
  const context = useContext(ChatContext)
  if (!context) {
    // Return dummy functions during development hot-reload
    return {
      openChats: [],
      openChat: () => {},
      closeChat: () => {}
    }
  }
  return context
}

export const ChatProvider = ({ children }) => {
  const [openChats, setOpenChats] = useState([])

  const openChat = (username, userPhoto = null) => {
    // Validate username
    if (!username || typeof username !== 'string' || username.trim() === '') {
      return
    }
    
    // Close all existing chats first
    setOpenChats([])
    
    // Open new chat
    const newChat = {
      id: Date.now(),
      username: username.trim(),
      userPhoto,
      style: {
        right: '20px',
        bottom: '20px'
      }
    }
    
    setOpenChats([newChat])
  }

  const closeChat = (chatId) => {
    setOpenChats(prev => prev.filter(chat => chat.id !== chatId))
  }

  const value = {
    openChats,
    openChat,
    closeChat
  }

  return (
    <ChatContext.Provider value={value}>
      {children}
      {/* Render all open chat widgets */}
      {openChats.map((chat, index) => (
        <ChatWidget
          key={chat.id}
          username={chat.username}
          userPhoto={chat.userPhoto}
          style={chat.style}
          onClose={() => closeChat(chat.id)}
        />
      ))}
    </ChatContext.Provider>
  )
}
