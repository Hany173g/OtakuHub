import { createContext, useContext, useState } from 'react'
import { Alert, Box } from '@mui/material'

const ErrorContext = createContext()

export const useError = () => {
  const context = useContext(ErrorContext)
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider')
  }
  return context
}

export const ErrorProvider = ({ children }) => {
  const [errors, setErrors] = useState([])

  const showError = (message, duration = 5000) => {
    // Check if same message already exists
    const messageExists = errors.some(error => error.message === message)
    if (messageExists) {
      return // Don't add duplicate message
    }
    
    const error = {
      id: Date.now(),
      message,
      timestamp: new Date()
    }
    
    setErrors(prev => [...prev, error])
    
    // Auto remove after duration
    setTimeout(() => {
      removeError(error.id)
    }, duration)
    
    return error.id
  }

  const removeError = (errorId) => {
    setErrors(prev => prev.filter(err => err.id !== errorId))
  }

  const clearAllErrors = () => {
    setErrors([])
  }

  const value = {
    errors,
    showError,
    removeError,
    clearAllErrors
  }

  return (
    <ErrorContext.Provider value={value}>
      {children}
      
      {/* Error Display - Fixed position in center of screen */}
      {errors.length > 0 && (
        <Box
          sx={{
            position: 'fixed',
            top: '70%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10000,
            width: '90%',
            maxWidth: '500px',
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}
        >
          {errors.map((error) => (
            <Alert 
              key={error.id}
              severity="error" 
              onClose={() => removeError(error.id)}
              sx={{ 
                fontSize: '1rem',
                fontWeight: 500,
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(244, 67, 54, 0.3)'
              }}
            >
              {error.message}
            </Alert>
          ))}
        </Box>
      )}
    </ErrorContext.Provider>
  )
}
