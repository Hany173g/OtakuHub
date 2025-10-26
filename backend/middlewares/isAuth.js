const jwt = require('jsonwebtoken');


require('dotenv').config();

 // check if user login or guest
let isAuth = (req,res,next) => {
    try{
        const authHeader = req.headers['authorization']
        if (!authHeader)
        {
            req.user = null;
            return next();
        }
        let token = authHeader;
        
        // Check if this is a dashboard route
        let JWT_SECRET;
        if (req.originalUrl && req.originalUrl.includes('/dashboard')) {
            JWT_SECRET = process.env.JWT_SECERT_ACCESS_TOKEN_DASHBOARD;
        } else {
            JWT_SECRET = process.env.JWT_SECERT_ACCESS_TOKEN;
        }
        
        // Only verify token if we have one
        if (token && JWT_SECRET) {
            let decode = jwt.verify(token, JWT_SECRET)
            req.user = decode;
        } else {
            req.user = null;
        }
        
        next();
    }catch(err)
    {
        req.user = null;
        next()
    }
}

module.exports = isAuth