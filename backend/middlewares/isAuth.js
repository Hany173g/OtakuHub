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
        let JWT_SECERT = process.env.JWT_SECERT;
        let decode = jwt.verify(token,JWT_SECERT)
        req.user = decode;
        next();
    }catch
    {
        req.user = null;
        next()
    }
}




module.exports = isAuth