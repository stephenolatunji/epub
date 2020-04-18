const jwt = require('jsonwebtoken');
const config = require('config');
const User = require('../Models/User');
const Token = require('../Models/Token');

module.exports = async function(req, res, next){

    // get token from header
    const token = req.header('x-auth-token');

    // Check token 
    if(!token){
        return res.status(401).json({message: 'Token not authorized'});
    }

    try{
        const payload = jwt.verify(token, config.get('jwtSecret'));
        if(payload.barOwner){
            const owner = await Token.findById(payload.user.id);

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
};