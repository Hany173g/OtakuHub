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

const {Groups} = require('./Groups')
const {GroupMember} = require('./groupMember');

const sequelize = require('../config/database');

const {pendingRequestsGroup} = require('./pendingRequestsGroupModel')
const {loggerGroup} = require('./loggerGroupModel')


const {historyDeleteGroup} = require('./historyDeleteGroupModel');


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



        // relationship User && Groups Many To Many
        User.belongsToMany(Groups, { through: 'GroupMember', foreignKey: 'userId', otherKey: 'groupId', onDelete: 'CASCADE' });
        Groups.belongsToMany(User, { through: 'GroupMember', foreignKey: 'groupId', otherKey: 'userId', onDelete: 'CASCADE' });


        
        User.belongsToMany(Groups,{through:"pendingRequestsGroup", as: "PendingGroups",foreignKey:'userId',otherKey:'groupId',onDelete:'CASCADE'});
        Groups.belongsToMany(User, { through: 'pendingRequestsGroup', foreignKey: 'groupId' , as: "PendingUsers",   otherKey: 'userId', onDelete: 'CASCADE' });


        
    
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

// Group

        //relation ship group to loggerGroup



        Groups.hasMany(loggerGroup,{foreignKey:'groupId',as:"loggerGroup",onDelete:'CASCADE'})
        loggerGroup.belongsTo(Groups,{foreignKey:'groupId'})

        //relation groups to blogs

        Groups.hasMany(Blogs,{foreignKey:'groupId',onDelete:'CASCADE'});

        Blogs.belongsTo(Groups,{foreignKey:'groupId'});

        //relation group to histroyDeleteGroup

        Groups.hasMany(historyDeleteGroup,{foreignKey:'groupId',onDelete:'CASCADE'});
        historyDeleteGroup.belongsTo(Groups,{foreignKey:'groupId'})







module.exports = {User,Blogs,dislikesBlogs,historyDeleteGroup,loggerGroup,pendingRequestsGroup,friends,Groups,GroupMember,likesBlogs,privateMessage,Profile,commentsBlogs,BlogStats,requestFriend,likesComments,dislikeComments,commentStats,nestedComments}