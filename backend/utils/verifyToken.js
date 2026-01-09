const jwt = require('jsonwebtoken');




require("dotenv").config();



const{createError} = require('./createError')





module.exports =  (token) => {
    if (!token) {
        throw createError("التوكن غير موجود",400)

    }

    try {
        let decoded = jwt.verify(token, process.env.JWT_SECERT_ACCESS_TOKENl);
        return decoded; 
    } catch (err) {
        console.log(err.message)
        throw createError("حصل خطاء غير متوقع",500)
    }
}