const jwt = require('jsonwebtoken');

require('dotenv').config();

// Dashboard authentication middleware
let dashboardAuth = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization']
        if (!authHeader) {
            req.user = null;
            return next();
        }
        
        let token = authHeader;
        let JWT_SECRET = process.env.JWT_SECERT_ACCESS_TOKEN_DASHBOARD;
        
        let decode = jwt.verify(token, JWT_SECRET)
        req.user = decode;
        
        next();
    } catch (err) {
        req.user = null;
        next()
    }
}

module.exports = dashboardAuth
