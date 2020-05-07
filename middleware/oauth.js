const jwt = require('jsonwebtoken');
const config = require('config');
const User = require('../Models/User');
const BarOwner = require('../Models/BarOwner');
const {responseCodes} = require('../utils');

module.exports = (pubRoute = false, adminRoute = false) => {
    return async function (req, res, next) {

        // get token from header
        const token = req.header('x-auth-token');

        // Check token
        if (!token) {
            return res.status(401).json({
                message: 'Token not authorized',
                success: false,
                code: responseCodes.INVALID_TOKEN
            });
        }

        try {
            const payload = jwt.verify(token, process.env.JWT_SECRET);

            //If the payload doesnt contain bar owner and it's a pub route then it's invalid
            if (pubRoute && !payload.barOwner) {
                return res.status(401).json({message: 'Token not authorized', code: responseCodes.INVALID_TOKEN});
            }
            //If the payload doesnt contain is admin and it's an admin route then it's invalid
            if (adminRoute && !payload.isAdmin) {
                return res.status(401).json({message: 'Token not authorized', code: responseCodes.INVALID_TOKEN});
            }

            if (payload.barOwner) {
                const owner = await BarOwner.findById(payload.user.id);

                if (owner) {
                    req.user = owner;
                    next()
                } else {
                    return res.status(401).json({
                        message: 'Token not authorized',
                        success: false,
                        code: responseCodes.INVALID_TOKEN
                    });
                }
            } else if (!payload.isAdmin) {
                const user = await User.findById(payload.user.id);
                if (user) {
                    req.user = user;
                } else {
                    return res.status(401).json({message: 'Token not authorized', code: responseCodes.INVALID_TOKEN});
                }
                next();
            }else{
                next();
            }
        } catch (err) {
            return res.status(401).json({message: 'Token not authorized', code: responseCodes.INVALID_TOKEN});
        }
    }
};
