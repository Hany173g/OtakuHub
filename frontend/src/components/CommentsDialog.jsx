import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Typography,
  IconButton,
  Avatar,
  Box,
  Divider,
  Menu,
  MenuItem
} from '@mui/material'
import {
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  ThumbUpAlt as ThumbUpOffAltIcon,
  ThumbDownAlt as ThumbDownOffAltIcon,
  Close as CloseIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Verified as VerifiedIcon
} from '@mui/icons-material'
import { reactAction, deleteComment, storage } from '../lib/api'
import { addComment } from '../lib/api'
import { formatNumber } from '../utils/formatNumber'

export default function CommentsDialog({ open, onClose, blog, onAddComment, userRole = 'guest', isAuthed = false }) {
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [localBlog, setLocalBlog] = useState(blog)
  const [menuAnchor, setMenuAnchor] = useState(null)
  const [selectedCommentId, setSelectedCommentId] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0) // لإجبار re-render

  // Update local blog data when blog prop changes
  useEffect(() => {
    setLocalBlog(blog)
    setRefreshKey(prev => prev + 1) // Force re-render when blog changes
  }, [blog])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!comment.trim() || busy) return

    try {
      setBusy(true)
      const result = await onAddComment(localBlog.id, comment)
      
      // Update local blog data with new comment immediately
      if (result && result.data) {
        let currentUser = null
        try {
          currentUser = storage.user ? JSON.parse(storage.user) : null
        } catch (e) {
          currentUser = storage.user || null
        }
        const newComment = {
          ...result.data.newComment,
          isLike: false,
          isDislike: false,
          isOwnerComment: true, // أي تعليق جديد = owner دائماً
          commentStats: result.data.newComment?.commentStats ?? null,
          userData: {
            username: result.data.username || currentUser?.username || 'مستخدم',
            photo: currentUser?.photo,
            id: result.data.newComment.userId
          }
        }
        
        // Update local state immediately
        setLocalBlog(prev => ({
          ...prev,
          commentsBlogs: [newComment, ...(prev.commentsBlogs || [])],
          blogStats: {
            ...prev.blogStats,
            commentsNumber: (prev.blogStats?.commentsNumber ?? 0) + 1
          }
        }))
        
        // Force re-render
        setRefreshKey(prev => prev + 1)
      }
      setComment('')
    } catch (err) {
      console.error('Failed to add comment:', err)
    } finally {
      setBusy(false)
    }
  }

  const handleDeleteComment = async () => {
    setMenuAnchor(null)
    setDeleteDialogOpen(false)
    if (!selectedCommentId) return
    
    try {
      setBusy(true)
      await deleteComment(selectedCommentId)
      
      // Remove comment from local state
      setLocalBlog(prev => ({
        ...prev,
        commentsBlogs: prev.commentsBlogs?.filter(c => c.id !== selectedCommentId) || []
      }))
      
      setSelectedCommentId(null)
    } catch (err) {
      console.error('Failed to delete comment:', err)
    } finally {
      setBusy(false)
    }
  }

  const handleDeleteClick = () => {
    setMenuAnchor(null)
    setDeleteDialogOpen(true)
  }

  const handleCommentReact = async (commentId, type) => {
    if (busy) return
    setBusy(true)
    
    // Check if user is authenticated before doing anything
    if (!isAuthed) {
      setBusy(false)
      return // Don't do anything for guests
    }
    
    // Update UI immediately (Optimistic Update)
    setLocalBlog(prev => ({
      ...prev,
      commentsBlogs: prev.commentsBlogs?.map(comment => {
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
    }))
    
    // Send to backend in background
    try {
      console.log('Reacting to comment:', { commentId, type, service: 'comments' })
      await reactAction({ action: type, service: 'comments', id: commentId })
      console.log('Comment reaction successful')
    } catch (err) {
      console.error('Failed to react to comment:', err)
      console.error('Error details:', err.message)
      // If backend fails, we could revert the change here if needed
      // But for now, we'll keep the optimistic update
    } finally {
      setBusy(false)
    }
  }

  const formatRelative = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()  // Fixed: now - date for past time
    const absMs = Math.abs(diffMs)

    const rtf = new Intl.RelativeTimeFormat('ar', { numeric: 'auto' })

    if (absMs < 60000) return rtf.format(0, 'second')
    if (absMs < 3600000) return rtf.format(-Math.floor(diffMs / 60000), 'minute')
    if (absMs < 86400000) return rtf.format(-Math.floor(diffMs / 3600000), 'hour')
    if (absMs < 2592000000) return rtf.format(-Math.floor(diffMs / 86400000), 'day')
    if (absMs < 31536000000) return rtf.format(-Math.floor(diffMs / 2592000000), 'month')
    return rtf.format(-Math.floor(diffMs / 31536000000), 'year')
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: {
          height: '80vh',
          maxHeight: '80vh',
          borderRadius: 0,
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <DialogTitle sx={{
        pb: 2,
        pt: 3,
        px: 3,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Typography variant="h6" fontWeight={600}>
          التعليقات
        </Typography>
        <IconButton onClick={onClose} size="large" sx={{
          '&:hover': {
            bgcolor: 'rgba(220, 0, 78, 0.1)'
          }
        }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{
        p: 0,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Post Header */}
        <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Link to={`/profile/${localBlog.userData?.username}`} style={{ textDecoration: 'none' }}>
              <Avatar 
                src={localBlog.userData?.photo ? `http://localhost:5000/${localBlog.userData.photo}` : undefined}
                sx={{
                  bgcolor: 'primary.main',
                  width: 48,
                  height: 48,
                  fontSize: '1.1rem',
                  fontWeight: 500
                }}
              >
                {!localBlog.userData?.photo && (localBlog.userData?.username || 'U').slice(0, 2).toUpperCase()}
              </Avatar>
            </Link>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                {localBlog.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                <Link to={`/profile/${localBlog.userData?.username}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  {localBlog.userData?.username || 'مستخدم'}
                </Link>
                {' • '}
                {localBlog.createdAt ? formatRelative(localBlog.createdAt) : ''}
              </Typography>
            </Box>
          </Stack>
          {localBlog.photo && (
            <Box sx={{
              width: '100%',
              height: 120,
              backgroundImage: `url(${localBlog.photo})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: 4,
              mb: 2
            }} />
          )}
          <Typography sx={{
            whiteSpace: 'pre-wrap',
            lineHeight: 1.6,
            fontSize: '1rem',
            color: 'text.primary'
          }}>
            {localBlog.content}
          </Typography>
        </Box>

        {/* Comments List */}
        <Box sx={{
          flex: 1,
          overflow: 'auto',
          p: 3,
          backgroundColor: 'background.default'
        }}>
          <Stack spacing={3}>
            {(localBlog.commentsBlogs || []).map((c) => {
              const commentLikeCount = c.commentStats?.likesNumber ?? 0
              const commentDislikeCount = c.commentStats?.dislikeNumber ?? 0
              const commentUserName = c.userData?.username || 'مستخدم'
              
              // Debug log
              if (c.content && c.content.includes('تجربة')) {
                console.log('🔥 Comment "تجربة" isOwnerComment:', c.isOwnerComment)
              }
              
              return (
                <Stack
                  key={`${c.id}-${refreshKey}`}
                  sx={{
                    bgcolor: 'background.paper',
                    borderRadius: 8,
                    p: 3,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                  spacing={2}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Stack direction="row" spacing={1.5} sx={{ flex: 1 }}>
                      <Link to={`/profile/${commentUserName}`} style={{ textDecoration: 'none' }}>
                        <Avatar 
                          src={c.userData?.photo ? `http://localhost:5000/${c.userData.photo}` : undefined}
                          sx={{ width: 36, height: 36, fontSize: '0.9rem', bgcolor: 'secondary.main' }}
                        >
                          {!c.userData?.photo && commentUserName.slice(0, 2).toUpperCase()}
                        </Avatar>
                      </Link>
                      <Box sx={{ flex: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Link to={`/profile/${commentUserName}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography variant="body2" fontWeight={600}>
                                {commentUserName}
                              </Typography>
                              {c.userData?.verified && (
                                <VerifiedIcon 
                                  sx={{ 
                                    color: '#1DA1F2', 
                                    fontSize: '0.9rem',
                                    filter: 'drop-shadow(0 1px 2px rgba(29, 161, 242, 0.3))'
                                  }} 
                                />
                              )}
                            </Box>
                          </Link>
                          <Typography variant="caption" color="text.secondary">
                            {c.createdAt ? formatRelative(c.createdAt) : ''}
                          </Typography>
                        </Stack>
                        {/* Comment content */}
                        <Typography sx={{
                          lineHeight: 1.5,
                          fontSize: '0.95rem',
                          color: 'text.primary',
                          mt: 1
                        }}>
                          {c.content}
                        </Typography>
                        {/* Like/Dislike buttons */}
                        <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <IconButton 
                              size="small" 
                              color={c.isLike ? 'primary' : 'default'}
                              onClick={() => handleCommentReact(c.id, 'like')}
                            >
                              {c.isLike ? <ThumbUpIcon sx={{ fontSize: 14 }} /> : <ThumbUpOffAltIcon sx={{ fontSize: 14 }} />}
                            </IconButton>
                            <Typography variant="caption" color="text.secondary" fontWeight={500}>
                              {formatNumber(commentLikeCount)}
                            </Typography>
                          </Stack>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <IconButton 
                              size="small" 
                              color={c.isDislike ? 'secondary' : 'default'}
                              onClick={() => handleCommentReact(c.id, 'dislike')}
                            >
                              {c.isDislike ? <ThumbDownIcon sx={{ fontSize: 14 }} /> : <ThumbDownOffAltIcon sx={{ fontSize: 14 }} />}
                            </IconButton>
                            <Typography variant="caption" color="text.secondary" fontWeight={500}>
                              {formatNumber(commentDislikeCount)}
                            </Typography>
                          </Stack>
                        </Stack>
                      </Box>
                    </Stack>
                    
                    {/* 3 dots menu for comment owner or moderators */}
                    {(c.isOwnerComment || ['owner', 'admin', 'moderator'].includes(userRole?.toLowerCase())) && (
                      <IconButton 
                        size="small" 
                        onClick={(e) => {
                          setSelectedCommentId(c.id)
                          setMenuAnchor(e.currentTarget)
                        }}
                        sx={{ ml: 1 }}
                      >
                        <MoreVertIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    )}
                  </Stack>
                </Stack>
              )
            })}

            {(!localBlog.commentsBlogs || localBlog.commentsBlogs.length === 0) && (
              <Box sx={{
                textAlign: 'center',
                py: 4,
                bgcolor: 'background.paper',
                borderRadius: 8,
                border: '2px dashed',
                borderColor: 'divider'
              }}>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  لا توجد تعليقات بعد 💬
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  كن أول من يعلق على هذه التدوينة!
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>

        {/* Add Comment Form */}
        <Box sx={{
          p: 3,
          borderTop: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper'
        }}>
          <Stack component="form" onSubmit={handleSubmit} direction="row" spacing={3}>
            <TextField
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="اكتب تعليقك هنا..."
              fullWidth
              multiline
              minRows={2}
              maxRows={4}
              disabled={busy}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 8,
                  bgcolor: 'background.default',
                  '&:hover': {
                    bgcolor: 'rgba(25, 118, 210, 0.02)'
                  },
                  '&.Mui-focused': {
                    bgcolor: 'rgba(25, 118, 210, 0.05)'
                  }
                }
              }}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={busy || !comment.trim()}
              sx={{
                borderRadius: 8,
                px: 4,
                py: 2,
                fontWeight: 600,
                fontSize: '1rem',
                minWidth: 120,
                '&:hover': {
                  bgcolor: 'primary.dark'
                },
                '&:disabled': {
                  bgcolor: 'rgba(25, 118, 210, 0.3)',
                  color: 'rgba(255,255,255,0.7)'
                }
              }}
            >
              {busy ? 'جاري النشر...' : 'نشر'}
            </Button>
          </Stack>
        </Box>

        {/* Menu for deleting comments */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
        >
          <MenuItem onClick={handleDeleteClick}>
            <DeleteIcon sx={{ mr: 1 }} />
            حذف التعليق
          </MenuItem>
        </Menu>

        {/* Delete Confirmation Dialog */}
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
              هل أنت متأكد من حذف هذا التعليق؟
            </Typography>
            <Typography variant="body2" color="text.secondary">
              لن تتمكن من استرداد التعليق بعد حذفه
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
              onClick={handleDeleteComment}
              variant="contained"
              color="error"
              disabled={busy}
              sx={{ minWidth: 100 }}
            >
              {busy ? 'جاري الحذف...' : 'حذف'}
            </Button>
          </DialogActions>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}
