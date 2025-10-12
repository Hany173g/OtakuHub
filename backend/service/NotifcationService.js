
const {Notification} = require('../models/Relationships')




const Notificationsystem = async(service,user,serviceType,content) => {
      await Notification.create(
        {serviceId:service.id,
        userId:service.userId,
        content,
        serviceType,
        doAction:user.id
})
}







module.exports = {Notificationsystem}