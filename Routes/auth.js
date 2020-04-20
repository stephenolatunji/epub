const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const {check, validationResult} = require('express-validator');
const {responseCodes} = require('../utils');


const User = require('../Models/User');

router.post('/',
    [
        check('password', 'Please enter a password with six or more character').isLength({min: 6}),
        check('email', 'Enter a valid email').isEmail()
    ], async (req, res) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({errors: errors.array(), code: responseCodes.INVALID_FIELDS});
        }

        const {email, password} = req.body;

        try {

            let user = await User.findOne({email});

            if (!user) {
                return res.status(400).json({message: 'Invalid Credentials', code: responseCodes.USER_NOT_FOUND});
            }

            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return res.status(400).json({message: 'Invalid Credentials', code: responseCodes.INVALID_CREDENTIALS});
            }

            const payload = {
                user: {
                    id: user.id
                }
            }

            jwt.sign(payload, config.get('jwtSecret'), {
                expiresIn: 3600
            }, (err, token) => {
                if (err) {
                    return res.status(500).send({success: false, code: responseCodes.SERVER_ERROR});
                }
                res.json({token});
            });

        } catch (err) {
            res.status(500).send({success: false, code: responseCodes.SERVER_ERROR});
        }
    })

module.exports = router;