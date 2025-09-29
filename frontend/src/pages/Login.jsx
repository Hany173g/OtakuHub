import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Box, Paper, Typography, TextField, Button, Stack, Alert } from '@mui/material'
import { login, storage } from '../lib/api'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await login({ email, password })
      storage.token = data.token
      storage.user = data.user // حفظ بيانات المستخدم
      navigate('/')
    } catch (err) {
      setError(err?.response?.data?.message || 'حدث خطأ ما')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ display: 'grid', placeItems: 'center' }}>
      <Paper sx={{ p: 4, maxWidth: 420, width: '100%' }}>
        <Stack spacing={2} component="form" onSubmit={onSubmit}>
          <Typography variant="h5" fontWeight={700}>تسجيل الدخول</Typography>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="البريد الإلكتروني" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required fullWidth />
          <TextField label="كلمة المرور" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required fullWidth />
          <Button type="submit" disabled={loading}>دخول</Button>
          <Stack direction="row" justifyContent="space-between">
            <Button component={Link} to="/register" color="secondary">إنشاء حساب</Button>
            <Button component={Link} to="/forget-password" color="inherit">نسيت كلمة المرور؟</Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  )
}
