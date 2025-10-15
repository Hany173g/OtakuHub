import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import CardMedia from '@mui/material/CardMedia'
import CardActions from '@mui/material/CardActions'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import {
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  ThumbUpAlt as ThumbUpOffAltIcon,
  ThumbDownAlt as ThumbDownOffAltIcon,
  ChatBubbleOutline as ChatBubbleOutlineIcon
} from '@mui/icons-material'
import Avatar from '@mui/material/Avatar'
import Snackbar from '@mui/material/Snackbar'
import MuiAlert from '@mui/material/Alert'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import DeleteIcon from '@mui/icons-material/Delete'
import ReportIcon from '@mui/icons-material/Report'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import { reactAction, removeLike, removeDislike, addComment, deleteBlog, storage, API_BASE, reportService } from '../lib/api'
import CommentsDialog from './CommentsDialog'

export default function BlogCard({ blog, isAuthed = false, onUpdateBlog, onAddComment, onDeleteBlog, userRole = 'guest', groupSettings = null }) {
  const [localBlog, setLocalBlog] = useState(blog)
  const [busy, setBusy] = useState(false)
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'error' })
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [reportContent, setReportContent] = useState('')
  const [reportLoading, setReportLoading] = useState(false)
  const hasPhoto = !!localBlog.photo
  const likedByUser = localBlog.isLike
  const dislikedByUser = localBlog.isDislike
  const stats = localBlog.blogStats || localBlog.blogStat || {}
  const likeCount = Math.max(0, stats.likesNumber ?? 0)
  const dislikeCount = Math.max(0, stats.dislikeNumber ?? 0)
  const commentCount = Math.max(0, stats.commentsNumber ?? 0)
  const isOwner = localBlog.isOwner
  const canDelete = isOwner || ['owner', 'admin', 'moderator'].includes(userRole?.toLowerCase())
  const canReport = !isOwner && isAuthed && (groupSettings?.allowReports !== false)
  const showMenu = (canDelete || canReport) && isAuthed

  const ownerName = blog.userData?.username || 'مستخدم'
  const ownerInitials = (blog.userData?.username || 'U').slice(0, 2).toUpperCase()

  // Update localBlog when blog prop changes
  useEffect(() => {
    setLocalBlog(blog)
  }, [blog])

  const showError = (err, fallback = 'تعذّر تنفيذ العملية') => {
    // الـ API interceptor بيرجع error.message مباشرة
    const msg = err.message || fallback
    setSnack({ open: true, message: msg, severity: 'error' })
  }

  const rtf = new Intl.RelativeTimeFormat('ar', { numeric: 'auto' })
  const formatRelative = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()  // Fixed: now - date for past time
    const absMs = Math.abs(diffMs)

    if (absMs < 60000) return rtf.format(0, 'second')
    if (absMs < 3600000) return rtf.format(-Math.floor(diffMs / 60000), 'minute')
    if (absMs < 86400000) return rtf.format(-Math.floor(diffMs / 3600000), 'hour')
    if (absMs < 2592000000) return rtf.format(-Math.floor(diffMs / 86400000), 'day')
    if (absMs < 31536000000) return rtf.format(-Math.floor(diffMs / 2592000000), 'month')
    return rtf.format(-Math.floor(diffMs / 31536000000), 'year')
  }

  const handleReact = async (type) => {
    if (busy) return
    setBusy(true)
    
    // Update UI immediately (Optimistic Update)
    const updatedBlog = { ...localBlog }
    if (type === 'like') {
      if (likedByUser) {
        // Remove like
        updatedBlog.isLike = false
        updatedBlog.blogStats = {
          ...updatedBlog.blogStats,
          likesNumber: Math.max(0, (updatedBlog.blogStats?.likesNumber || 0) - 1)
        }
      } else {
        // Add like
        updatedBlog.isLike = true
        updatedBlog.blogStats = {
          ...updatedBlog.blogStats,
          likesNumber: (updatedBlog.blogStats?.likesNumber || 0) + 1
        }
        // Remove dislike if exists
        if (updatedBlog.isDislike) {
          updatedBlog.isDislike = false
          updatedBlog.blogStats.dislikeNumber = Math.max(0, (updatedBlog.blogStats?.dislikeNumber || 0) - 1)
        }
      }
    } else if (type === 'dislike') {
      if (dislikedByUser) {
        // Remove dislike
        updatedBlog.isDislike = false
        updatedBlog.blogStats = {
          ...updatedBlog.blogStats,
          dislikeNumber: Math.max(0, (updatedBlog.blogStats?.dislikeNumber || 0) - 1)
        }
      } else {
        // Add dislike
        updatedBlog.isDislike = true
        updatedBlog.blogStats = {
          ...updatedBlog.blogStats,
          dislikeNumber: (updatedBlog.blogStats?.dislikeNumber || 0) + 1
        }
        // Remove like if exists
        if (updatedBlog.isLike) {
          updatedBlog.isLike = false
          updatedBlog.blogStats.likesNumber = Math.max(0, (updatedBlog.blogStats?.likesNumber || 0) - 1)
        }
      }
    }
    
    // Update UI immediately
    setLocalBlog(updatedBlog)
    onUpdateBlog?.(updatedBlog)
    
    // Send to backend in background
    try {
      if (type === 'like' && likedByUser) {
        await removeLike(blog.id)
      } else if (type === 'dislike' && dislikedByUser) {
        await removeDislike(blog.id)
      } else {
        await reactAction({ action: type, service: 'blogs', id: blog.id })
      }
    } catch (err) {
      // If backend fails, revert the UI change
      setLocalBlog(blog)
      onUpdateBlog?.(blog)
      showError(err)
    } finally {
      setBusy(false)
    }
  }

  const handleRemoveReact = async (type) => {
    if (busy) return
    try {
      setBusy(true)
      const action = type === 'like' ? removeLike : removeDislike
      const { data } = await action(blog.id)
      onUpdateBlog?.(data.updatedBlog)
    } catch (err) {
      showError(err)
    } finally {
      setBusy(false)
    }
  }

  const handleCommentReact = async (commentId, type) => {
    if (busy) return
    try {
      setBusy(true)
      await reactAction({ action: type, service: 'comments', id: commentId })
      
      // Update local state for comment
      const updatedComments = blog.commentsBlogs?.map(comment => {
        if (comment.id === commentId) {
          const updatedComment = { ...comment }
          
          if (type === 'like') {
            if (comment.isLike) {
              // Remove like
              updatedComment.isLike = false
              updatedComment.commentStats = {
                ...updatedComment.commentStats,
                likesNumber: Math.max(0, (updatedComment.commentStats?.likesNumber || 0) - 1)
              }
            } else {
              // Add like
              updatedComment.isLike = true
              updatedComment.commentStats = {
                ...updatedComment.commentStats,
                likesNumber: (updatedComment.commentStats?.likesNumber || 0) + 1
              }
              // Remove dislike if exists
              if (updatedComment.isDislike) {
                updatedComment.isDislike = false
                updatedComment.commentStats.dislikeNumber = Math.max(0, (updatedComment.commentStats?.dislikeNumber || 0) - 1)
              }
            }
          } else if (type === 'dislike') {
            if (comment.isDislike) {
              // Remove dislike
              updatedComment.isDislike = false
              updatedComment.commentStats = {
                ...updatedComment.commentStats,
                dislikeNumber: Math.max(0, (updatedComment.commentStats?.dislikeNumber || 0) - 1)
              }
            } else {
              // Add dislike
              updatedComment.isDislike = true
              updatedComment.commentStats = {
                ...updatedComment.commentStats,
                dislikeNumber: (updatedComment.commentStats?.dislikeNumber || 0) + 1
              }
              // Remove like if exists
              if (updatedComment.isLike) {
                updatedComment.isLike = false
                updatedComment.commentStats.likesNumber = Math.max(0, (updatedComment.commentStats?.likesNumber || 0) - 1)
              }
            }
          }
          
          return updatedComment
        }
        return comment
      }) || []
      
      onUpdateBlog({ ...blog, commentsBlogs: updatedComments })
    } catch (err) {
      showError(err)
    } finally {
      setBusy(false)
    }
  }

  const handleDeleteBlog = async () => {
    setMenuAnchor(null)
    setDeleteDialogOpen(false)
    
    try {
      setBusy(true)
      await deleteBlog(blog.id)
      setSnack({ open: true, message: 'تم حذف التدوينة بنجاح', severity: 'success' })
      // Call parent function to remove blog from list
      if (onDeleteBlog) {
        onDeleteBlog(blog.id)
      }
    } catch (err) {
      showError(err, 'فشل في حذف التدوينة')
    } finally {
      setBusy(false)
    }
  }

  const handleDeleteClick = () => {
    setMenuAnchor(null)
    setDeleteDialogOpen(true)
  }

  const handleReportClick = () => {
    setMenuAnchor(null)
    setReportDialogOpen(true)
  }

  const handleReportSubmit = async () => {
    if (!reportContent.trim()) {
      setSnack({ open: true, message: 'يرجى كتابة سبب البلاغ', severity: 'error' })
      return
    }

    try {
      setReportLoading(true)
      await reportService('blog', localBlog.id, reportContent.trim())
      setSnack({ open: true, message: 'تم إرسال البلاغ بنجاح', severity: 'success' })
      setReportDialogOpen(false)
      setReportContent('')
    } catch (err) {
      console.error('Error reporting blog:', err)
      setSnack({ 
        open: true, 
        message: err.message || 'فشل في إرسال البلاغ', 
        severity: 'error' 
      })
    } finally {
      setReportLoading(false)
    }
  }

  const handleAddComment = async (blogId, content) => {
    try {
      const result = await addComment(blogId, content)
      const { data } = result
      let currentUser = null
      try {
        currentUser = storage.user ? JSON.parse(storage.user) : null
      } catch (e) {
        currentUser = storage.user || null
      }
      const newComment = {
        ...data.newComment,
        isLike: false,
        isDislike: false,
        commentStats: data.newComment?.commentStats ?? null,
        userData: {
          username: data.username || currentUser?.username || 'مستخدم',
          photo: currentUser?.photo,
          id: data.newComment.userId
        }
      }
      // Update local state immediately
      const updatedBlog = {
        ...localBlog,
        commentsBlogs: [newComment, ...(localBlog.commentsBlogs || [])],
        blogStats: { ...localBlog.blogStats, commentsNumber: (localBlog.blogStats?.commentsNumber ?? 0) + 1 }
      }
      setLocalBlog(updatedBlog)
      onUpdateBlog?.(updatedBlog)
      return result // Return result for CommentsDialog
    } catch (err) {
      showError(err)
      throw err
    }
  }

  const subheaderParts = []
  if (blog.userData?.username) subheaderParts.push(ownerName)
  if (blog.createdAt) subheaderParts.push(formatRelative(blog.createdAt))

  return (
    <>
      <Card sx={{ 
        overflow: 'hidden', 
        borderRadius: '20px', 
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)', 
        maxWidth: '100%', 
        bgcolor: 'background.paper', 
        border: '1px solid rgba(0,0,0,0.05)',
        mb: 3,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.12)'
        }
      }}>
        <CardHeader
          avatar={
            <Link to={`/profile/${ownerName}`} style={{ textDecoration: 'none' }}>
              <Avatar 
                src={blog.userData?.photo ? `${API_BASE}/${blog.userData.photo}` : undefined}
                sx={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  width: 56, 
                  height: 56, 
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  border: '3px solid rgba(102, 126, 234, 0.2)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.1)',
                    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
                  }
                }}
              >
                {!blog.userData?.photo && ownerInitials}
              </Avatar>
            </Link>
          }
          title={
            <Link to={`/profile/${ownerName}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700, 
                  fontSize: '1.2rem',
                  fontFamily: '"Cairo", sans-serif',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  '&:hover': {
                    transform: 'translateX(5px)'
                  }
                }}
              >
                {ownerName}
              </Typography>
            </Link>
          }
          subheader={
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'text.secondary',
                fontWeight: 500,
                fontSize: '0.9rem',
                mt: 0.5
              }}
            >
              📅 {formatRelative(blog.createdAt)}
            </Typography>
          }
          action={
            showMenu && (
              <>
                <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
                  <MoreVertIcon />
                </IconButton>
                <Menu
                  anchorEl={menuAnchor}
                  open={Boolean(menuAnchor)}
                  onClose={() => setMenuAnchor(null)}
                >
                  {canDelete && (
                    <MenuItem onClick={handleDeleteClick}>
                      <DeleteIcon sx={{ mr: 1 }} />
                      حذف التدوينة
                    </MenuItem>
                  )}
                  {canReport && (
                    <MenuItem onClick={handleReportClick}>
                      <ReportIcon sx={{ mr: 1 }} />
                      إبلاغ عن التدوينة
                    </MenuItem>
                  )}
                </Menu>
              </>
            )
          }
          sx={{ pb: 1 }}
        />
        {hasPhoto && (
          <CardMedia 
            component="img" 
            height="450" 
            image={`${API_BASE}/${localBlog.photo}`} 
            alt={localBlog.title} 
            sx={{ 
              objectFit: 'cover',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.02)'
              }
            }} 
          />
        )}
        <CardContent sx={{ pt: 4, pb: 2, px: 4 }}>
          {blog.title && (
            <Typography 
              variant="h5"
              sx={{ 
                fontWeight: 700,
                mb: 2,
                color: 'text.primary',
                fontFamily: '"Cairo", sans-serif',
              }}
            >
              {blog.title}
            </Typography>
          )}
          <Typography 
            sx={{ 
              whiteSpace: 'pre-wrap', 
              lineHeight: 1.8, 
              fontSize: '1.1rem', 
              color: 'text.primary',
              fontFamily: '"Cairo", sans-serif',
              fontWeight: 500,
              letterSpacing: '0.3px'
            }}
          >
            {blog.content}
          </Typography>
        </CardContent>

        {/* Reactions Bar */}
        <Box sx={{ 
          px: 4, 
          py: 3, 
          borderTop: '1px solid rgba(0,0,0,0.08)',
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.02) 100%)'
        }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
            <Button
              onClick={() => handleReact('like')}
              sx={{
                flex: 1,
                borderRadius: '15px',
                py: 2,
                fontSize: '1rem',
                fontWeight: 600,
                fontFamily: '"Cairo", sans-serif',
                color: likedByUser ? '#667eea' : 'text.secondary',
                bgcolor: likedByUser ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
                border: likedByUser ? '2px solid rgba(102, 126, 234, 0.3)' : '2px solid transparent',
                transition: 'all 0.3s ease',
                '& .MuiButton-startIcon': {
                  marginRight: '10px'
                },
                '&:hover': { 
                  bgcolor: 'rgba(102, 126, 234, 0.1)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.2)'
                }
              }}
              startIcon={
                likedByUser ? 
                <ThumbUpIcon sx={{ color: '#667eea', fontSize: 22 }} /> : 
                <ThumbUpOffAltIcon sx={{ fontSize: 22 }} />
              }
            >
           إعجاب ( {likeCount} )
            </Button>

            <Button
              onClick={() => handleReact('dislike')}
              sx={{
                flex: 1,
                borderRadius: '15px',
                py: 2,
                fontSize: '1rem',
                fontWeight: 600,
                fontFamily: '"Cairo", sans-serif',
                color: dislikedByUser ? '#FF5722' : 'text.secondary',
                bgcolor: dislikedByUser ? 'rgba(255, 87, 34, 0.1)' : 'transparent',
                border: dislikedByUser ? '2px solid rgba(255, 87, 34, 0.3)' : '2px solid transparent',
                transition: 'all 0.3s ease',
                '& .MuiButton-startIcon': {
                  marginRight: '10px'
                },
                '&:hover': { 
                  bgcolor: 'rgba(255, 87, 34, 0.1)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(255, 87, 34, 0.2)'
                }
              }}
              startIcon={
                dislikedByUser ? 
                <ThumbDownIcon sx={{ color: '#FF5722', fontSize: 22 }} /> : 
                <ThumbDownOffAltIcon sx={{ fontSize: 22 }} />
              }
            >
               عدم إعجاب ( {dislikeCount} )
            </Button>

            <Button
              onClick={() => setCommentsOpen(true)}
              sx={{
                flex: 1,
                borderRadius: '15px',
                py: 2,
                fontSize: '1rem',
                fontWeight: 600,
                fontFamily: '"Cairo", sans-serif',
                color: 'text.secondary',
                border: '2px solid transparent',
                transition: 'all 0.3s ease',
                '&:hover': { 
                  bgcolor: 'rgba(0, 150, 136, 0.1)',
                  color: '#009688',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0, 150, 136, 0.2)'
                }
              }}
              startIcon={<ChatBubbleOutlineIcon sx={{ fontSize: 22 }} />}
            >
              💬 تعليقات ( {commentCount} )
            </Button>
          </Stack>
        </Box>
      </Card>

      {/* Custom Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 600 }}>
          تأكيد الحذف
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            هل أنت متأكد من حذف هذه التدوينة؟
          </Typography>
          <Typography variant="body2" color="text.secondary">
            لن تتمكن من استرداد التدوينة بعد حذفها
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            variant="outlined"
            sx={{ minWidth: 100 }}
          >
            إلغاء
          </Button>
          <Button 
            onClick={handleDeleteBlog}
            variant="contained"
            color="error"
            disabled={busy}
            sx={{ minWidth: 100 }}
          >
            {busy ? 'جاري الحذف...' : 'حذف'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Report Dialog */}
      <Dialog
        open={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 600 }}>
          إبلاغ عن التدوينة
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            يرجى كتابة سبب الإبلاغ عن هذه التدوينة
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="اكتب سبب البلاغ..."
            value={reportContent}
            onChange={(e) => setReportContent(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 3 }}>
          <Button 
            onClick={() => {
              setReportDialogOpen(false)
              setReportContent('')
            }}
            variant="outlined"
            sx={{ minWidth: 100 }}
          >
            إلغاء
          </Button>
          <Button 
            onClick={handleReportSubmit}
            variant="contained"
            color="error"
            disabled={reportLoading || !reportContent.trim()}
            sx={{ minWidth: 100 }}
          >
            {reportLoading ? 'جاري الإرسال...' : 'إرسال البلاغ'}
          </Button>
        </DialogActions>
      </Dialog>

      <CommentsDialog
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        blog={blog}
        onAddComment={handleAddComment}
        userRole={userRole}
      />

      <Snackbar open={snack.open} autoHideDuration={2500} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <MuiAlert elevation={6} variant="filled" severity={snack.severity} sx={{ width: '100%' }}>
          {snack.message}
        </MuiAlert>
      </Snackbar>
    </>
  )
}
