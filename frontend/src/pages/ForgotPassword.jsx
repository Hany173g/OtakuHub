import { useState } from 'react'
import { Box, Paper, Typography, TextField, Button, Stack, Alert } from '@mui/material'
import { requestReset } from '../lib/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    setLoading(true)
    try {
      await requestReset({ email })
      setSuccess('تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني')
    } catch (err) {
      setError(err.message || 'حدث خطأ ما')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ display: 'grid', placeItems: 'center' }}>
      <Paper sx={{ p: 4, maxWidth: 460, width: '100%' }}>
        <Stack spacing={2} component="form" onSubmit={onSubmit}>
          <Typography variant="h5" fontWeight={700}>نسيت كلمة المرور</Typography>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}
          <TextField label="البريد الإلكتروني" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required fullWidth />
          <Button type="submit" disabled={loading}>إرسال</Button>
        </Stack>
      </Paper>
    </Box>
  )
}
