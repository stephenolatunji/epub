const jwt = require('jsonwebtoken');
const config = require('config');
const User = require('../Models/User');
const BarOwner = require('../Models/BarOwner');

module.exports = (pubRoute = false, adminRoute = false) => {
    return async function(req, res, next){

        // get token from header
        const token = req.header('x-auth-token');

        // Check token
        if(!token){
            return res.status(401).json({message: 'Token not authorized'});
        }

        try{
            const payload = jwt.verify(token, config.get('jwtSecret'));

            //If the payload doesnt contain bar owner and it's a pub route then it's invalid
            if(pubRoute && !payload.barOwner){
                return res.status(401).json({success: 'false', message: 'Invalid token'})
            }

            //If the payload doesnt contain is admin and it's an admin route then it's invalid
            if(adminRoute && !payload.isAdmin){
                return res.status(401).json({success: 'false', message: 'Invalid token'})
            }

            if(payload.barOwner){
                const owner = await BarOwner.findById(payload.user.id);

                if(owner){
                    req.user = owner;
                    next()
                }else{
                    return res.status(401).json({message: 'Token not authorized'});
                }
            }else {
                const user = await User.findById(payload.id);
                if (user) {
                    req.user = user;
                } else {
                    return res.status(401).json({message: 'Token not authorized'});
                }
                next();
            }
        }
        catch(err){
            res.status(401).json({message: 'Invalid Token'});
        }
    }
};
