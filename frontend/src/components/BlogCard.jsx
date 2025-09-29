import { useState } from 'react'
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
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import { reactAction, removeLike, removeDislike, addComment, deleteBlog, API_BASE } from '../lib/api'
import CommentsDialog from './CommentsDialog'

export default function BlogCard({ blog, isAuthed = false, onUpdateBlog, onAddComment, onDeleteBlog }) {
  const [busy, setBusy] = useState(false)
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'error' })
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const hasPhoto = !!blog.photo
  const likedByUser = blog.isLike
  const dislikedByUser = blog.isDislike
  const stats = blog.blogStats || blog.blogStat || {}
  const likeCount = Math.max(0, stats.likesNumber ?? 0)
  const dislikeCount = Math.max(0, stats.dislikeNumber ?? 0)
  const commentCount = Math.max(0, stats.commentsNumber ?? 0)
  const isOwner = blog.isOwner

  const ownerName = blog.userData?.username || 'مستخدم'
  const ownerInitials = (blog.userData?.username || 'U').slice(0, 2).toUpperCase()

  const showError = (err, fallback = 'تعذّر تنفيذ العملية') => {
    const status = err?.response?.status
    const msg = err?.response?.data?.message || (status === 400 || status === 401 ? 'يُرجى تسجيل الدخول للتفاعل' : fallback)
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
    
    // Update UI immediately (Optimistic Update)
    const updatedBlog = { ...blog }
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
    onUpdateBlog(updatedBlog)
    
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
      onUpdateBlog(blog)
      showError(err)
    }
  }

  const handleRemoveReact = async (type) => {
    if (busy) return
    try {
      setBusy(true)
      const action = type === 'like' ? removeLike : removeDislike
      const { data } = await action(blog.id)
      onUpdateBlog(data.updatedBlog)
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

  const handleAddComment = async (blogId, content) => {
    try {
      const { data } = await addComment(blogId, content)
      const newComment = {
        ...data.newComment,
        isLike: false,
        isDislike: false,
        commentStats: data.newComment?.commentStats ?? null,
        userData: {
          username: data.username || 'مستخدم',
          id: data.newComment.userId
        }
      }
      onUpdateBlog({
        ...blog,
        commentsBlogs: [newComment, ...(blog.commentsBlogs || [])],
        blogStats: { ...blog.blogStats, commentsNumber: (blog.blogStats?.commentsNumber ?? 0) + 1 }
      })
    } catch (err) {
      showError(err)
    }
  }

  const subheaderParts = []
  if (blog.userData?.username) subheaderParts.push(ownerName)
  if (blog.createdAt) subheaderParts.push(formatRelative(blog.createdAt))

  return (
    <>
      <Card sx={{ overflow: 'hidden', borderRadius: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', maxWidth: '100%', bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
        <CardHeader
          avatar={
            <Link to={`/profile/${ownerName}`} style={{ textDecoration: 'none' }}>
              <Avatar 
                src={blog.userData?.photo ? `http://localhost:5000/${blog.userData.photo}` : undefined}
                sx={{ bgcolor: 'primary.main', width: 48, height: 48, fontSize: '1.1rem' }}
              >
                {!blog.userData?.photo && ownerInitials}
              </Avatar>
            </Link>
          }
          title={
            <Link to={`/profile/${ownerName}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                {ownerName}
              </Typography>
            </Link>
          }
          subheader={<Typography variant="body2" color="text.secondary">{formatRelative(blog.createdAt)}</Typography>}
          action={
            isOwner && isAuthed && (
              <>
                <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
                  <MoreVertIcon />
                </IconButton>
                <Menu
                  anchorEl={menuAnchor}
                  open={Boolean(menuAnchor)}
                  onClose={() => setMenuAnchor(null)}
                >
                  <MenuItem onClick={handleDeleteClick}>
                    <DeleteIcon sx={{ mr: 1 }} />
                    حذف التدوينة
                  </MenuItem>
                </Menu>
              </>
            )
          }
          sx={{ pb: 1 }}
        />
        {hasPhoto && (
          <CardMedia component="img" height="400" image={`${API_BASE}/${blog.photo}`} alt={blog.title} sx={{ objectFit: 'cover' }} />
        )}
        <CardContent sx={{ pt: 2, pb: 2, px: 3 }}>
          <Typography sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '1rem', color: 'text.primary' }}>{blog.content}</Typography>
        </CardContent>

        {/* Reactions Bar */}
        <Box sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" spacing={0} alignItems="center" sx={{ width: '100%' }}>
            <Button
              color={likedByUser ? 'primary' : 'inherit'}
              onClick={() => handleReact('like')}
              sx={{
                flex: 1,
                borderRadius: 0,
                py: 1.5,
                fontSize: '0.9rem',
                fontWeight: likedByUser ? 600 : 500,
                color: likedByUser ? 'primary.main' : 'text.secondary',
                '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.04)' }
              }}
              startIcon={likedByUser ? <ThumbUpIcon /> : <ThumbUpOffAltIcon />}
            >
              إعجاب ({likeCount})
            </Button>

            <Button
              color={dislikedByUser ? 'secondary' : 'inherit'}
              onClick={() => handleReact('dislike')}
              sx={{
                flex: 1,
                borderRadius: 0,
                py: 1.5,
                fontSize: '0.9rem',
                fontWeight: dislikedByUser ? 600 : 500,
                color: dislikedByUser ? 'secondary.main' : 'text.secondary',
                '&:hover': { bgcolor: 'rgba(220, 0, 78, 0.04)' }
              }}
              startIcon={dislikedByUser ? <ThumbDownIcon /> : <ThumbDownOffAltIcon />}
            >
              عدم إعجاب ({dislikeCount})
            </Button>

            <Button
              onClick={() => setCommentsOpen(true)}
              sx={{
                flex: 1,
                borderRadius: 0,
                py: 1.5,
                fontSize: '0.9rem',
                fontWeight: 500,
                color: 'text.secondary',
                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
              }}
              startIcon={<ChatBubbleOutlineIcon />}
            >
              تعليقات ({commentCount})
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

      <CommentsDialog
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        blog={blog}
        onAddComment={handleAddComment}
      />

      <Snackbar open={snack.open} autoHideDuration={2500} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <MuiAlert elevation={6} variant="filled" severity={snack.severity} sx={{ width: '100%' }}>
          {snack.message}
        </MuiAlert>
      </Snackbar>
    </>
  )
}
