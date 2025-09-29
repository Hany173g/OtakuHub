const jwt = require('jsonwebtoken');




require("dotenv").config();





module.exports =  (token) => {
    if (!token) {
        throw new Error("التوكن غير موجود");
    }

    try {
        let decoded = jwt.verify(token, process.env.JWT_SECERT);
        return decoded; 
    } catch (err) {
        throw new Error("التوكن غير صالح أو انتهت صلاحيته");
    }
}