const jwt = require('jsonwebtoken');
const config = require('config');
const User = require('../Models/User');

module.exports = async function(req, res, next){

    // get token from header
    const token = req.header('x-auth-token');

    // Check token 
    if(!token){
        return res.status(401).json({message: 'Token not authorized'});
    }

    try{
        const confirmed = jwt.verify(token, config.get('jwtSecret'));
        const user = await User.findById(confirmed.id);
        if(user){
            req.user = user;
        }else{
            throw new Error()
        }
        next();
    }
    catch(err){
        res.status(401).json({message: 'Invalid Token'});
    }
};