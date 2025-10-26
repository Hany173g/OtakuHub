const {Visits} = require('../models/visitsModel')


const { createError } = require('../utils/createError')














const addVistorData = async(req,res,next) => {
    try{
        const {url} = req.body;
    
        let userId = req.user?.id ? req.user.id.toString() : "Guest";
        let agent = req.headers["user-agent"];
   
        let ip = req.ip
 
        if (!userId || !url || !ip || !agent)
        {
           throw createError("البينات ليست كامله")
        }
        await Visits.create({userId,url,agent,ip})
        res.status(200).json()
    }catch(err)
    {
        console.log(err.message)
        next(err)
    }
}











module.exports = addVistorData