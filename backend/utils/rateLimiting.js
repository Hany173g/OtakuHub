const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // 500 requests per 15 min لكل IP (للتطوير)
    message: "Too many requests from this IP, please try again after 15 minutes",
});

module.exports = limiter;
