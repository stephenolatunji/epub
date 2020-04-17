const jwt = require('jsonwebtoken');
const config = require('config');


module.exports = function(req, res, next){

    // get token from header
    const token = req.header('x-auth-token');

    // Check token 
    if(!token){
        return res.status(401).json({message: 'Token not authorized'});
    }

    try{
        const confirmed = jwt.verify(token, config.get('jwtSecret'));
        req.user = confirmed.user;
        next();
    }
    catch(err){
        res.status(401).json({message: 'Invalid Token'});
    }
};