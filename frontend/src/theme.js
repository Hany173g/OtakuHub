import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  direction: 'rtl',
  palette: {
    mode: 'light',
    primary: { main: '#7c3aed' }, // purple accent (pleasant, readable)
    secondary: { main: '#ff6f61' }, // warm coral for actions
    background: { default: '#f7f7fb', paper: '#ffffff' }, // light, clean background
    text: { primary: '#111827', secondary: '#374151' }
  },
  typography: {
    fontFamily: [
      'Cairo',
      'Inter',
      'Segoe UI',
      'Roboto',
      'Arial',
      'sans-serif'
    ].join(','),
    h1: { fontWeight: 800 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    body1: { lineHeight: 1.7 },
    body2: { lineHeight: 1.7 }
  },
  shape: { borderRadius: 12 },
  components: {
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiAppBar: { defaultProps: { color: 'primary', elevation: 1 } },
    MuiButton: { defaultProps: { variant: 'contained' } },
    MuiCard: { defaultProps: { elevation: 1 } },
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          scrollBehavior: 'smooth',
        },
        body: {
          scrollBehavior: 'smooth',
          // Custom scrollbar styles
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: '10px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'linear-gradient(45deg, #7c3aed, #a855f7)',
            borderRadius: '10px',
            '&:hover': {
              background: 'linear-gradient(45deg, #6d28d9, #9333ea)',
            }
          },
          // For all scrollable elements
          '*::-webkit-scrollbar': {
            width: '6px',
            height: '6px',
          },
          '*::-webkit-scrollbar-track': {
            background: 'rgba(0,0,0,0.1)',
            borderRadius: '10px',
          },
          '*::-webkit-scrollbar-thumb': {
            background: 'linear-gradient(45deg, #7c3aed, #a855f7)',
            borderRadius: '10px',
            '&:hover': {
              background: 'linear-gradient(45deg, #6d28d9, #9333ea)',
            }
          },
          '*::-webkit-scrollbar-corner': {
            background: 'transparent',
          },
          // Smooth scrolling for all elements
          '*': {
            scrollBehavior: 'smooth',
          },
          // Better scrolling on mobile
          '@media (max-width: 768px)': {
            '*::-webkit-scrollbar': {
              width: '4px',
              height: '4px',
            }
          }
        }
      }
    }
  }
})

export default theme
