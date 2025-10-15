const jwt = require('jsonwebtoken');




require("dotenv").config();





module.exports =  (token) => {
    if (!token) {
         return  next(createError("التوكن غير موجود",400))

    }

    try {
        let decoded = jwt.verify(token, process.env.JWT_SECERT);
        return decoded; 
    } catch (err) {
        next(err)
    }
}