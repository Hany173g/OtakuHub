const {lastSeen} = require('../models/lastSeenModel')













exports.addLastSeen = async(req, res) => {
    try {
        if (req.user) {
            await lastSeen.create({
                userId: req.user.id,
                seenAt: new Date()
            })
            
            res.status(200).json({
                success: true,
                message: 'Last seen recorded successfully'
            })
        } else {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            })
        }
    } catch (error) {
      
        res.status(500).json({
            success: false,
            message: 'Failed to record last seen'
        })
    }
}





