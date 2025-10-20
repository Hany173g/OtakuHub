const jwt = require('jsonwebtoken');




require("dotenv").config();



const{createError} = require('./createError')





module.exports =  (token) => {
    if (!token) {
        throw createError("التوكن غير موجود",400)

    }

    try {
        let decoded = jwt.verify(token, process.env.JWT_SECERT);
        return decoded; 
    } catch (err) {
        next(err)
    }
}