import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Box, Paper, Typography, TextField, Button, Stack, Alert } from '@mui/material'
import { resetPassword as resetPasswordApi } from '../lib/api'

export default function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    setLoading(true)
    try {
      await resetPasswordApi({ newPassword, token })
      setSuccess('تم تحديث كلمة المرور بنجاح')
      setTimeout(()=> navigate('/login'), 1000)
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
          <Typography variant="h5" fontWeight={700}>إعادة تعيين كلمة المرور</Typography>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}
          <TextField label="كلمة المرور الجديدة" type="password" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} required fullWidth />
          <Button type="submit" disabled={loading}>تحديث</Button>
        </Stack>
      </Paper>
    </Box>
  )
}
