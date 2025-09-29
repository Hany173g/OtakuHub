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
    MuiCard: { defaultProps: { elevation: 1 } }
  }
})

export default theme
