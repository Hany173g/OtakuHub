import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Box, Paper, Typography, TextField, Button, Stack, Alert } from '@mui/material'
import { register as registerApi } from '../lib/api'

export default function Register() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    setLoading(true)
    try {
      await registerApi({ username, email, password })
      setSuccess('تم إنشاء الحساب بنجاح، يمكنك تسجيل الدخول الآن')
      setTimeout(()=> navigate('/login'), 800)
    } catch (err) {
      // الـ API interceptor بيرجع error.message مباشرة
      setError(err.message || 'حدث خطأ ما')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ display: 'grid', placeItems: 'center' }}>
      <Paper sx={{ p: 4, maxWidth: 480, width: '100%' }}>
        <Stack spacing={2} component="form" onSubmit={onSubmit}>
          <Typography variant="h5" fontWeight={700}>إنشاء حساب</Typography>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}
          <TextField label="اسم المستخدم" value={username} onChange={(e)=>setUsername(e.target.value)} required fullWidth />
          <TextField label="البريد الإلكتروني" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required fullWidth />
          <TextField label="كلمة المرور" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required fullWidth />
          <Button type="submit" disabled={loading}>إنشاء</Button>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="body2">لديك حساب بالفعل؟</Typography>
            <Button component={Link} to="/login" color="secondary">تسجيل الدخول</Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  )
}
