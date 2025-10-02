const {checkData,checkPhoto,checkBlog,checkComment,checkAction} =require('../utils/checkData')


const{blogs} = require('../models/Relationships')






const createBlog = async(Data,photo,user,id) => {
   let data = checkData(Data); 
 
    
    let newBlog ;
    let groupId = id === undefined ? null : id;
    if (photo)
    {  
     
        checkPhoto(photo)
        newBlog = await user.createBlog({
            content:data.content
            ,title:data.title
            ,photo:photo.filename,groupId
        })
       
    }
    else 
    {
         newBlog = await user.createBlog(
            {
                content:data.content,
                title:data.title,groupId
            })
    }
    return newBlog;
}







module.exports = {createBlog};