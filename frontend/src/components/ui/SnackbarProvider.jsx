import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'

const SnackbarContext = createContext({
  show: (message, severity = 'info', duration = 2500) => {},
})

export function useToast() {
  return useContext(SnackbarContext)
}

export default function SnackbarProvider({ children }) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [severity, setSeverity] = useState('info')
  const [duration, setDuration] = useState(2500)

  const show = useCallback((msg, sev = 'info', dur = 2500) => {
    setMessage(msg)
    setSeverity(sev)
    setDuration(dur)
    setOpen(true)
  }, [])

  const value = useMemo(() => ({ show }), [show])

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={duration}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setOpen(false)} severity={severity} variant="filled" sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  )
}
