import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Navbar from './components/Navbar'
import FeedNew from './pages/FeedNew'
import Profile from './pages/Profile'
import Chat from './pages/Chat'
import Groups from './pages/Groups'
import GroupDetails from './pages/GroupDetails'
import Settings from './pages/Settings'
import FavoritesPage from './pages/FavoritesPage'
import GroupDashboard from './pages/GroupDashboard'
import GroupRules from './pages/GroupRules'
import SearchPage from './pages/SearchPage'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import { useEffect, useState } from 'react'
import { isAuth, addVisitorData, addLastSeen, setGlobalToast } from './lib/api'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import SnackbarProvider, { useToast } from './components/ui/SnackbarProvider'
import { SocketProvider } from './contexts/SocketContext'
import { ChatProvider } from './contexts/ChatContext'
import { ErrorProvider } from './contexts/ErrorContext'

const getTheme = () => createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#212121',
    },
  },
  shape: { borderRadius: 0 },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    h5: { fontWeight: 500 },
    button: { textTransform: 'none', fontWeight: 500 },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: '#ffffff',
          borderBottom: '1px solid #e0e0e0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          borderRadius: 0,
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          boxSizing: 'border-box',
        },
        html: {
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        body: {
          margin: 0,
          padding: 0,
          overflowX: 'hidden',
        },
        img: {
          maxWidth: '100%',
          height: 'auto',
          imageRendering: '-webkit-optimize-contrast',
          WebkitFontSmoothing: 'antialiased',
          backfaceVisibility: 'hidden',
          transform: 'translateZ(0)',
        }
      }
    },
    MuiContainer: { styleOverrides: { root: { paddingTop: 16, paddingBottom: 16 } } },
  },
})

function GuestOnly({ children }) {
  const [checking, setChecking] = useState(true)
  const [authed, setAuthed] = useState(false)
  const location = useLocation()

  useEffect(() => {
    let mounted = true
    isAuth().then(() => {
      if (mounted) setAuthed(true)
    }).catch(() => {
      if (mounted) setAuthed(false)
    }).finally(() => {
      if (mounted) setChecking(false)
    })
    return () => { mounted = false }
  }, [location.key])

  if (checking) return null
  if (authed) return <Navigate to="/" replace />
  return children
}

// Visitor Tracker Component
function VisitorTracker() {
  const location = useLocation()

  useEffect(() => {
    // Track page visit
    addVisitorData(location.pathname)
  }, [location.pathname])

  return null
}

// Session tracker for last seen
function SessionTracker() {
  useEffect(() => {
    // Check if this is a new session
    const sessionKey = 'otaku_session_' + Date.now()
    const existingSession = sessionStorage.getItem('otaku_current_session')
    
    console.log('🔍 Session check - existing session:', existingSession)
    
    if (!existingSession) {
      console.log('🆕 New session detected, setting up session tracking')
      // New session - record last seen
      sessionStorage.setItem('otaku_current_session', sessionKey)
      
      // Check if user is authenticated and record last seen
      isAuth().then(() => {
        console.log('✅ User authenticated, recording last seen')
        addLastSeen()
      }).catch(() => {
        console.log('❌ User not authenticated, skipping last seen')
      })
    } else {
      console.log('♻️ Existing session found, skipping last seen recording')
    }
  }, [])

  return null
}

// Toast setup component
function ToastSetup() {
  const toast = useToast()
  
  useEffect(() => {
    setGlobalToast(toast.show)
  }, [toast.show])
  
  return null
}

export default function App() {
  return (
    <ThemeProvider theme={getTheme()}>
      <CssBaseline />
      <SocketProvider>
        <ChatProvider>
          <ErrorProvider>
            <SnackbarProvider>
              <ToastSetup />
              <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
                <SessionTracker />
                <VisitorTracker />
                <Navbar />
              <Container maxWidth="lg" sx={{ py: { xs: 1, md: 2 }, px: { xs: 1, sm: 2, md: 3 } }}>
                <Routes>
                  <Route path="/" element={<FeedNew />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/groups" element={<Groups />} />
                  <Route path="/groups/:groupName" element={<GroupDetails />} />
                  <Route path="/groups/:groupName/dashboard" element={<GroupDashboard />} />
                  <Route path="/groups/:groupName/rules" element={<GroupRules />} />
                  <Route path="/profile/:username" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/favorites" element={<FavoritesPage />} />
                  <Route path="/chat/:username" element={<Chat />} />
                  <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
                  <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
                  <Route path="/forget-password" element={<ForgotPassword />} />
                  <Route path="/forget-password/:token" element={<ResetPassword />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Container>
            </Box>
            </SnackbarProvider>
          </ErrorProvider>
        </ChatProvider>
      </SocketProvider>
    </ThemeProvider>
  )
}
