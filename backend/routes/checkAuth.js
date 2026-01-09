
const router = require('express').Router();







router.get('/isAuth',(req,res) => {
    if (!req.user)
    {
      return  res.status(200).json({isUser:null})
    }
    res.status(200).json({isUser:req.user})
    
})


module.exports = router