const express = require('express');


const path = require('path')

const app = express()

const socketIo = require('socket.io')

const cors = require('cors');
const rateLimiting = require('./utils/rateLimiting')




//web socket settings
const server = require('http').createServer(app)

const io = socketIo(server, {
  cors: {
    origin: [ "http://localhost:3000","https://319f6634ee93.ngrok-free.app"], // رابط الفرونت اند
    methods: ["GET", "POST"],
    credentials: true
  }
});


io.OnlineUsers = {};
require('./sockets/notificationSystem')(io)

io.on('connection', socket => {
  require('./sockets/requestFriend')(io,socket)
  require('./sockets/chat')(io,socket)
  require('./sockets/Friends')(io,socket)
})





app.use(cors({
  origin: ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(rateLimiting) 

app.use(express.json()); // can sent json data
app.use(express.urlencoded({extended:true})) // read requests
 // statics Folders
app.use(express.static(path.join(__dirname,'uploads'))) 
 

require('dotenv').config()

// dotenv varibles

let PORT = process.env.PORT






//middlewares


app.use(require('./middlewares/isAuth'))


//routes


let registerRoute = require('./routes/registerRoute')
let loginRoute = require('./routes/loginRoute');
let forgetPasswordRoute = require('./routes/forgetPasswordRoute')
let blogRoute = require('./routes/blogRoute')
let isAuth = require('./routes/checkAuth')
let profileRoute = require('./routes/profileRoute');
let NotificationsRoute = require('./routes/NotificationRoute')
let messageRoute = require('./routes/messageRoute')
let groupRoute = require('./routes/groupRoute')


app.use('/api/auth',registerRoute)
app.use('/api/auth',loginRoute)
app.use('/api/auth/forget-password',forgetPasswordRoute)
app.use('/api/',blogRoute)
app.use('/api/',isAuth)
app.use('/api',profileRoute)
app.use('/api',NotificationsRoute)
app.use('/api',messageRoute)
app.use('/api',groupRoute)







 // running server
server.listen(PORT,() => {
    console.log("Server Is Running...")
})






