const { Op } = require('sequelize');
const {bannedUser} = require('../models/bannedUserModel')
const { createError } = require('../utils/createError')
const moment = require('moment');
require('moment-duration-format');

const checkIsBanned = async(req,res,next) => {
    try{
   
        if (req.user && req.user.id) {
            let isBanned = await bannedUser.findOne({
                where: {
                    userId: req.user.id,
                    groupId: null,
                    timeBanned: { [Op.ne]: null }
                }
            });

      
            if (isBanned) {
                 
                let timeBanned = isBanned.timeBanned
                let remainingMs = timeBanned - Date.now();
         
                if (remainingMs > 0) {

                    let duration = moment.duration(remainingMs);
                    let years = duration.years();
                    let months = duration.months();
                    let days = duration.days();
                    let hours = duration.hours();
                    let minutes = duration.minutes();

                    let message = `قام المشرف بحظرك لمدة ${years} سنة, ${months} شهر, ${days} يوم, ${hours} ساعة, ${minutes} دقيقة`;
                                        
                    throw createError(message, 403)
                } else {
                  
                    await isBanned.destroy(); 
                }
                }
        }
        
    
        next()
    } catch(err) {
        console.log(err.message)
        next(err)
    }
  
}





module.exports = checkIsBanned





