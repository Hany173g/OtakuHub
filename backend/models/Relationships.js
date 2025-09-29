const {User} = require('./userModel')
const {BlogStats} = require('./BlogStatsModel');
const {Blogs} = require('./blogsModel')
const {commentsBlogs} = require('./commentsBlogsModel')
const {dislikesBlogs} = require('./dislikesBlogsModel')
const {likesBlogs} = require('./likesBlogsModel')
const {likesComments} = require('./likeCommentModel')
const {dislikeComments} = require('./dislikesCommentModel')
const {commentStats} = require('./commentStatsModel')

const {nestedComments} = require('./nestedCommentModel')

const {Profile} = require('./profileModel')
const {friends} = require('./friendModel')
const{privateMessage} = require('./privateMessageModel')



const sequelize = require('../config/database');







const {requestFriend} = require('./requestFriendModel')

// Users ReelationShips


        // RelationShip User To Blogs



        User.hasMany(Blogs,{foreignKey:'userId',onDelete:'CASCADE'});

        Blogs.belongsTo(User,{foreignKey:'userId'});





        // ReelationShip User to likesBlogs



        User.hasMany(likesBlogs,{foreignKey:'userId',onDelete:'CASCADE'});

        likesBlogs.belongsTo(User,{foreignKey:'userId'});





        // ReelationShip User to dislikesBlogs


        User.hasMany(dislikesBlogs,{foreignKey:'userId',onDelete:'CASCADE'});

        dislikesBlogs.belongsTo(User,{foreignKey:'userId'});




        // ReelationShip User to commentsBlogs


        User.hasMany(commentsBlogs,{foreignKey:'userId',onDelete:'CASCADE'});

        commentsBlogs.belongsTo(User,{foreignKey:'userId'});

          // Relationship comment to likes
        User.hasMany(likesComments,{foreignKey:"userId",onDelete:'CASCADE'})
        likesComments.belongsTo(User,{foreignKey:"userId"})

        // relationship comment to dislikes
        User.hasMany(dislikeComments,{foreignKey:"userId",onDelete:'CASCADE'})
        dislikeComments.belongsTo(User,{foreignKey:"userId"})

        // realtionship user to nestedComments

        User.hasMany(nestedComments,{foreignKey:'userId',onDelete:'CASCADE'});
        nestedComments.belongsTo(User,{foreignKey:'userId'})

        // realtionship user to profile
        User.hasOne(Profile,{foreignKey:'userId',onDelete:'CASCADE'})
        Profile.belongsTo(User,{foreignKey:'userId'})


        // relationship user to friendRequest
        User.hasMany(requestFriend, { foreignKey: 'userId', as: 'sentRequests' ,onDelete:'CASCADE'});
        requestFriend.belongsTo(User, { foreignKey: 'userId', as: 'sender' });

        User.hasMany(requestFriend, { foreignKey: 'friendId', as: 'receivedRequests' ,onDelete:'CASCADE'});
        requestFriend.belongsTo(User, { foreignKey: 'friendId', as: 'receiver' });
        

        // Relationship user to friends

        User.hasMany(friends,{foreignKey:'userId',onDelete:'CASCADE'});
        friends.belongsTo(User,{foreignKey:'userId'})


        // Relationhip user to senderMessage
        User.hasMany(privateMessage,{foreignKey:'senderId',as:"sentMessage",onDelete:'CASCADE'});
        privateMessage.belongsTo(User,{foreignKey:'senderId'});

        // relationship user to recviceMessage

        User.hasMany(privateMessage,{foreignKey:'receiveId',as:"receivedMessage",onDelete:'CASCADE'})
        privateMessage.belongsTo(User,{foreignKey:'receiveId'})

//Blogs ReelationShips



            // ReelationShip Blogs to commentsBlogs


            Blogs.hasMany(commentsBlogs,{foreignKey:'blogId',onDelete:'CASCADE'})
            commentsBlogs.belongsTo(Blogs,{foreignKey:'blogId'});



            // ReelationShip Blogs to Likes


            Blogs.hasMany(likesBlogs,{foreignKey:'blogId',onDelete:'CASCADE'})
            likesBlogs.belongsTo(Blogs,{foreignKey:'blogId'});



            // RealationShip Blogs To dislikes




            Blogs.hasMany(dislikesBlogs,{foreignKey:'blogId',onDelete:'CASCADE'})
            dislikesBlogs.belongsTo(Blogs,{foreignKey:'blogId'});
          
            

            Blogs.hasOne(BlogStats,{foreignKey:'blogId',onDelete:'CASCADE'})
            BlogStats.belongsTo(Blogs,{foreignKey:'blogId'})


// comment RelationShips

        // Relationship comment to likes
        commentsBlogs.hasMany(likesComments,{foreignKey:"commentId",onDelete:'CASCADE'})
        likesComments.belongsTo(commentsBlogs,{foreignKey:"commentId"})

        // relationship comment to dislikes
        commentsBlogs.hasMany(dislikeComments,{foreignKey:"commentId",onDelete:'CASCADE'})
        dislikeComments.belongsTo(commentsBlogs,{foreignKey:"commentId"})

        // relationship comments to commentStats
        
        commentsBlogs.hasOne(commentStats,{foreignKey:'commentId',onDelete:'CASCADE'});
        commentStats.belongsTo(commentStats,{foreignKey:'commentId'})
        

        // relation comments to nestedComments

        commentsBlogs.hasMany(nestedComments,{foreignKey:'commentId',onDelete:'CASCADE'});
        nestedComments.belongsTo(commentsBlogs,{foreignKey:'commentId'});


        // relation nestedComments
        // nestedComments.hasMany(nestedComments,{ as: 'Replies',foreignKey:'commentId',onDelete:'CASCADE'});
        // nestedComments.belongsTo(nestedComments,{ as: 'Parent',foreignKey:'commentId'})


module.exports = {User,Blogs,dislikesBlogs,friends,likesBlogs,privateMessage,Profile,commentsBlogs,BlogStats,requestFriend,likesComments,dislikeComments,commentStats,nestedComments}