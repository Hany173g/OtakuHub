const {
  User,
  Blogs,
  nestedComments,
  Groups,
  penningBlogs,
  dislikesBlogs,
  BlogStats,
  commentsBlogs,
  commentStats,
  likesComments,
  likesBlogs,
  dislikeComments
} = require('../models/Relationships');

const { Op } = require('sequelize');

const getBlogs = async (req, res, service, user, group,blogsData) => {
  const{lastNumber} = req.body;
  let blogs;

  if (service === 'home') {
    blogs = await Blogs.findAll({
      where: { groupId: { [Op.is]: null } },
      include: [commentsBlogs],
      offset:lastNumber,
      limit: 10,
      order:[['createdAt','DESC']]
    });
  } else if (service === 'group') {
    blogs = await group.getBlogs({ offset:lastNumber,limit: 10, include: [commentsBlogs] });
    const blogsIds = blogs.map(b => b.id);
    const penningBlog = await penningBlogs.findAll({ where: { blogId: blogsIds} });
    const penningBlogIds = new Set(penningBlog.map(pb => pb.blogId));
    blogs = blogs.filter(blog => !penningBlogIds.has(blog.id));
  }
  else if(service === "search")
    {
      blogs = blogsData
    } else {
    blogs = await Blogs.findAll({
      where: { userId: user.id, groupId: { [Op.is]: null } },
      include: [commentsBlogs],
      limit: 20
    });
  }

  // جمع الـ IDs مرة واحدة
  const blogIds = blogs.map(b => b.id);
  const commentIds = blogs.flatMap(b => b.commentsBlogs.map(c => c.id));
  const userIdsFromComments = blogs.flatMap(b => b.commentsBlogs.map(c => c.userId));

  // جلب البيانات مرة واحدة
  const [
    users,
    commentsLike,
    dislikesCommentsData,
    likeBlogs,
    dislikeBlogsData,
    blogStats,
    commentStatsData,
    usersComments
  ] = await Promise.all([
    User.findAll({ where: { id: blogs.map(b => b.userId) } }),
    likesComments.findAll({ where: { commentId: commentIds }, attributes: ['commentId', 'userId'] }),
    dislikeComments.findAll({ where: { commentId: commentIds }, attributes: ['commentId', 'userId'] }),
    likesBlogs.findAll({ where: { blogId: blogIds }, attributes: ['blogId', 'userId'] }),
    dislikesBlogs.findAll({ where: { blogId: blogIds }, attributes: ['blogId', 'userId'] }),
    BlogStats.findAll({ where: { blogId: blogIds } }),
    commentStats.findAll({ where: { commentId: commentIds } }),
    User.findAll({ where: { id: userIdsFromComments }, attributes: ['username', 'id', 'photo'] })
  ]);

  // تحويل البيانات لـ lookup objects عشان الوصول O(1)
  const usersMap = Object.fromEntries(users.map(u => [u.id, u]));
  const usersCommentsMap = Object.fromEntries(usersComments.map(u => [u.id, u]));
  const commentsLikeMap = commentsLike.reduce((acc, l) => {
    if (!acc[l.commentId]) acc[l.commentId] = new Set();
    acc[l.commentId].add(l.userId);
    return acc;
  }, {});
  const dislikesCommentsMap = dislikesCommentsData.reduce((acc, d) => {
    if (!acc[d.commentId]) acc[d.commentId] = new Set();
    acc[d.commentId].add(d.userId);
    return acc;
  }, {});
  const likeBlogsMap = likeBlogs.reduce((acc, l) => {
    if (!acc[l.blogId]) acc[l.blogId] = new Set();
    acc[l.blogId].add(l.userId);
    return acc;
  }, {});
  const dislikeBlogsMap = dislikeBlogsData.reduce((acc, d) => {
    if (!acc[d.blogId]) acc[d.blogId] = new Set();
    acc[d.blogId].add(d.userId);
    return acc;
  }, {});
  const blogStatsMap = Object.fromEntries(blogStats.map(b => [b.blogId, b]));
  const commentStatsMap = Object.fromEntries(commentStatsData.map(c => [c.commentId, c]));

  // بناء البيانات النهائية
  const allBlogs = blogs.map(blog => {
    const blogPlain = blog.get({ plain: true });
    blogPlain.userData = usersMap[blog.userId];

    blogPlain.commentsBlogs = blogPlain.commentsBlogs.map(comment => {
      comment.isLike = req.user ? !!(commentsLikeMap[comment.id]?.has(req.user.id)) : false;
      comment.isDislike = req.user ? !!(dislikesCommentsMap[comment.id]?.has(req.user.id)) : false;
      comment.isOwnerComment = req.user ? comment.userId === req.user.id : false;
      comment.commentStats = commentStatsMap[comment.id];
      comment.userData = usersCommentsMap[comment.userId];
      return comment;
    });

    if (req.user) {
      blogPlain.isLike = !!(likeBlogsMap[blog.id]?.has(req.user.id));
      blogPlain.isDislike = !!(dislikeBlogsMap[blog.id]?.has(req.user.id));
      blogPlain.isOwner = blog.userId === req.user.id;
    }

    blogPlain.blogStats = blogStatsMap[blog.id];

    return blogPlain;
  });

  return allBlogs;
};

module.exports = { getBlogs };
