import { useState } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Stack, Snackbar, Alert as MuiAlert, Box, Typography, IconButton } from '@mui/material'
import { createBlog, addGroupPost, storage } from '../lib/api'
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate'
import CloseIcon from '@mui/icons-material/Close'

export default function CreateBlogDialog({ open, onClose, onCreated, groupName, groupSettings = null }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'error' })

  const reset = () => { setTitle(''); setContent(''); setFile(null) }

  const submit = async () => {
    if (!title || !content) { setSnack({ open: true, message: 'من فضلك أدخل العنوان والمحتوى', severity: 'warning' }); return }
    if (!storage.token) { setSnack({ open: true, message: 'يجب تسجيل الدخول لنشر تدوينة', severity: 'error' }); return }
    setLoading(true)
    try {
      let response;
      if (groupName) {
        // Post to group
        const formData = new FormData()
        formData.append('groupName', groupName)
        formData.append('title', title)
        formData.append('content', content)
        if (file) formData.append('photo', file)
        response = await addGroupPost(formData)
      } else {
        // Post to home feed
        response = await createBlog({ title, content, photo: file })
      }
      
      // Show message based on backend response
      let successMessage = 'تم نشر التدوينة بنجاح'
      
      // إذا النشر متوقف في المجموعة
      if (groupName && response?.data?.groupSettingPublish === false) {
        successMessage = 'تم إرسال المنشور للمراجعة'
      }
      
      // إذا الـ reports ممنوعة في المجموعة
      if (groupName && response?.data?.groupSettingsReport === false) {
        successMessage += ' • الإبلاغات معطلة في هذه المجموعة'
      }
      
      setSnack({ open: true, message: successMessage, severity: 'success' })
      
      // أخر الـ refresh عشان المستخدم يشوف الرسالة الأول
      setTimeout(() => {
        onCreated?.()
        reset()
        onClose?.()
      }, 2000) // ينتظر ثانيتين
    } catch (err) {
      const msg = err.message || 'تعذّر إنشاء التدوينة'
      setSnack({ open: true, message: msg, severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 0 } }}>
      <DialogTitle sx={{ pb: 2, pt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={600}>إنشاء تدوينة جديدة</Typography>
          <IconButton onClick={onClose} size="large" sx={{
            '&:hover': {
              bgcolor: 'rgba(220, 0, 78, 0.1)'
            }
          }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ px: 4, py: 3 }}>
        <Stack spacing={4}>
          <TextField
            label="عنوان التدوينة"
            value={title}
            onChange={(e)=>setTitle(e.target.value)}
            fullWidth
            variant="outlined"
            placeholder="اكتب عنواناً جذاباً..."
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 0,
                '&.Mui-focused': {
                  boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)'
                }
              },
              '& .MuiInputLabel-root': {
                fontWeight: 600,
                color: 'text.secondary'
              }
            }}
          />
          <TextField
            label="محتوى التدوينة"
            value={content}
            onChange={(e)=>setContent(e.target.value)}
            fullWidth
            multiline
            minRows={8}
            variant="outlined"
            placeholder="شارك أفكارك وخبراتك..."
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 0,
                '&.Mui-focused': {
                  boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)'
                }
              },
              '& .MuiInputLabel-root': {
                fontWeight: 600,
                color: 'text.secondary'
              }
            }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Button
              component="label"
              variant="outlined"
              startIcon={<AddPhotoAlternateIcon />}
              sx={{
                borderRadius: 0,
                px: 4,
                py: 2,
                border: '2px dashed',
                borderColor: 'primary.main',
                '&:hover': {
                  borderColor: 'primary.dark',
                  bgcolor: 'rgba(25, 118, 210, 0.05)'
                }
              }}
            >
              <Typography sx={{ fontWeight: 600, color: 'primary.main' }}>
                اختر صورة (اختياري)
              </Typography>
              <input type="file" name="photo" hidden accept="image/png, image/jpeg" onChange={(e)=> setFile(e.target.files?.[0] || null)} />
            </Button>
            {file && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  تم اختيار: {file.name}
                </Typography>
                <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>
                  ✓ تم الرفع
                </Typography>
              </Box>
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 4, pb: 4, pt: 2, gap: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderRadius: 0,
            px: 4,
            py: 1.5,
            fontWeight: 600,
            border: '2px solid',
            '&:hover': {
              bgcolor: 'rgba(0, 0, 0, 0.04)'
            }
          }}
        >
          إلغاء
        </Button>
        <Button
          onClick={submit}
          disabled={loading}
          variant="contained"
          sx={{
            borderRadius: 0,
            px: 6,
            py: 1.5,
            fontWeight: 600,
            fontSize: '1.1rem',
            '&:hover': {
              bgcolor: 'primary.dark'
            },
            '&:disabled': {
              bgcolor: 'rgba(25, 118, 210, 0.3)',
              color: 'rgba(255,255,255,0.7)'
            }
          }}
        >
          {loading ? 'جاري النشر...' : 'نشر التدوينة'}
        </Button>
      </DialogActions>

      <Snackbar open={snack.open} autoHideDuration={2500} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <MuiAlert elevation={6} variant="filled" severity={snack.severity} sx={{ width: '100%', borderRadius: 0 }}>
          {snack.message}
        </MuiAlert>
      </Snackbar>
    </Dialog>
  )
}
