import { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Stack,
  Chip,
  Avatar,
  IconButton,
  InputAdornment
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  People as PeopleIcon,
  Lock as LockIcon,
  Public as PublicIcon
} from '@mui/icons-material'
import { storage, createGroup, getAllGroups, API_BASE } from '../lib/api'
import { useNavigate } from 'react-router-dom'

export default function Groups() {
  const navigate = useNavigate()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState({
    groupName: '',
    description: '',
    privacy: 'public',
    photo: null
  })
  const [formError, setFormError] = useState('')
  const [creating, setCreating] = useState(false)

  const isAuthed = !!storage.token

  useEffect(() => {
    loadGroups()
  }, [])

  const loadGroups = async () => {
    try {
      setLoading(true)
      const { data } = await getAllGroups()
      setGroups(data.groups || [])
    } catch (err) {
      console.error('Error loading groups:', err)
      setGroups([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGroup = async () => {
    try {
      setFormError('')
      setCreating(true)

      if (!formData.groupName || !formData.description || !formData.photo) {
        setFormError('جميع الحقول مطلوبة')
        return
      }

      const formDataToSend = new FormData()
      formDataToSend.append('groupName', formData.groupName)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('privacy', formData.privacy)
      formDataToSend.append('photo', formData.photo)

      await createGroup(formDataToSend)

      setCreateDialogOpen(false)
      setFormData({
        groupName: '',
        description: '',
        privacy: 'public',
        photo: null
      })
      loadGroups()
    } catch (err) {
      setFormError(err.message || 'حدث خطأ أثناء إنشاء المجموعة')
    } finally {
      setCreating(false)
    }
  }

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, photo: e.target.files[0] })
    }
  }

  const filteredGroups = groups.filter(group =>
    group.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 }, px: { xs: 1, sm: 2 } }}>
      {/* Header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={2}
        sx={{ mb: 4 }}
      >
        <Typography variant={{ xs: 'h5', md: 'h4' }} fontWeight={700}>
          المجموعات
        </Typography>
        {isAuthed && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{ borderRadius: 2 }}
          >
            إنشاء مجموعة
          </Button>
        )}
      </Stack>

      {/* Search */}
      <TextField
        fullWidth
        placeholder="ابحث عن مجموعة..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 4 }}
      />

      {/* Groups Grid */}
      {loading ? (
        <Typography textAlign="center" py={4}>جاري التحميل...</Typography>
      ) : filteredGroups.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <PeopleIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            لا توجد مجموعات بعد
          </Typography>
          {isAuthed && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{ mt: 2 }}
            >
              أنشئ أول مجموعة
            </Button>
          )}
        </Box>
      ) : (
        <Grid container spacing={2}>
          {filteredGroups.map((group) => (
            <Grid item xs={12} sm={6} md={4} key={group.id}>
              <Card 
                sx={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 2,
                  overflow: 'hidden',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }
                }}
              >
                <CardMedia
                  component="img"
                  image={`${API_BASE}/${group.photo}`}
                  alt={group.name}
                  sx={{ 
                    height: 180,
                    objectFit: 'cover',
                    backgroundColor: '#f5f5f5'
                  }}
                />
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="h6" fontWeight={600} mb={1.5}>
                    {group.name}
                  </Typography>
                  
                  <Stack spacing={1}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      {group.privacy === 'private' ? (
                        <>
                          <LockIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            خاصة
                          </Typography>
                        </>
                      ) : (
                        <>
                          <PublicIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            عامة
                          </Typography>
                        </>
                      )}
                    </Stack>
                    
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <PeopleIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {group.numberMembers || 0} عضو
                      </Typography>
                    </Stack>
                  </Stack>
                </CardContent>
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button 
                    fullWidth 
                    variant="contained"
                    onClick={() => navigate(`/groups/${group.name}`)}
                    sx={{ borderRadius: 1.5 }}
                  >
                    عرض المجموعة
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Group Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>إنشاء مجموعة جديدة</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            {formError && (
              <Typography color="error" variant="body2">
                {formError}
              </Typography>
            )}

            <TextField
              label="اسم المجموعة"
              fullWidth
              value={formData.groupName}
              onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
              required
            />

            <TextField
              label="الوصف"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />

            <FormControl component="fieldset">
              <FormLabel component="legend">الخصوصية</FormLabel>
              <RadioGroup
                value={formData.privacy}
                onChange={(e) => setFormData({ ...formData, privacy: e.target.value })}
              >
                <Stack direction="row" spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Radio value="public" />
                    <PublicIcon sx={{ mr: 1 }} />
                    <Typography>عامة</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Radio value="private" />
                    <LockIcon sx={{ mr: 1 }} />
                    <Typography>خاصة</Typography>
                  </Box>
                </Stack>
              </RadioGroup>
            </FormControl>

            <Button
              variant="outlined"
              component="label"
              fullWidth
            >
              {formData.photo ? formData.photo.name : 'اختر صورة للمجموعة'}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handlePhotoChange}
              />
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>إلغاء</Button>
          <Button
            variant="contained"
            onClick={handleCreateGroup}
            disabled={creating}
          >
            {creating ? 'جاري الإنشاء...' : 'إنشاء'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
