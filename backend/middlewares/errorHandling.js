











module.exports = (err,req,res,next) => {
    let statusCode = err.statusCode || 500
    let isError = statusCode < 500
    let message = isError ? err.message : "عذرًا، حدث خطأ غير متوقع. برجاء المحاولة لاحقًا";
    res.status(statusCode).json({message})
}