const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const {check, validationResult} = require('express-validator');
const randomize = require('randomatic');
const {APP_URL, smtpTransport, responseCodes} = require('../utils');
const moment = require('moment');

const User = require('../Models/User');

// Register Route


// @route       POST/User
// @desc        Register new user
// access       Public

router.post('/',
    [
        check('firstname', 'Enter firstname').not().isEmpty(),
        check('lastname', 'Enter lastname').not().isEmpty(),
        check('password', 'Please enter a password with six or more character').isLength({min: 6}),
        check('email', 'Enter a valid email').isEmail()
    ], async (req, res) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({message: errors.array(), success: false, code: responseCodes.INVALID_FIELDS});

        }
        const {firstname, lastname, email, password} = req.body;

        try {

            let user = await User.findOne({email});
            if (user) {
                return res.status(400).json({message: 'User already exists', success: false, code: responseCodes.USER_ALREADY_EXISTS})
            }

            user = new User({
                firstname,
                lastname,
                email,
                password
            });

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);

            await user.save();

            let userObj = user.toObject();

            const payload = {
                user: {
                    id: userObj._id
                }
            };

            userObj = {
                ...userObj,
                vouchersUsed: 0,
                orders: 0
            };

            jwt.sign(payload, config.get('jwtSecret'), {
                expiresIn: 3600
            }, (err, token) => {
                if (err){
                    return res.status(500).send({success: false, code: responseCodes.SERVER_ERROR});
                }
                res.json({token, userObj, success: true});
            });
        } catch (err) {
            res.status(500).send({success: false, code: responseCodes.SERVER_ERROR});
        }
    });

router.route('/login').post(async (req, res) => {
    try {
        const {email, password} = req.body;

        const user = await User.findOne({email});

        if (!user) {
            return res.status(404).json({success: false, message: 'User not found', code: responseCodes.USER_NOT_FOUND})
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid details',
                code: responseCodes.INVALID_CREDENTIALS
            })
        }

        const payload = {
            user: {
                id: user._id
            }
        };

        jwt.sign(payload, config.get('jwtSecret'), {
            expiresIn: 3600
        }, (err, token) => {
            if (err) {
                return res.status(500).send({success: false, code: responseCodes.SERVER_ERROR});
            }
            res.json({token, user, success: true});
        });
    }catch (e) {
        res.status(500).send({success: false, code: responseCodes.SERVER_ERROR});
    }
});

router.post('/reset-password', async (req, res) => {
    try {
        const {email} = req.body;

        const user = await User.findOne({email});

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
                code: responseCodes.USER_NOT_FOUND
            })
        }

        const token = randomize('Aa0', 10);
        const expiryDate = new Date().getTime() + (36000 * 1000) //10 hours from now

        user.reset = {
            token,
            expiryDate
        };

        await user.save();

        const mailOptions = {
            to: user.email,
            from: process.env.SMTP_USER,
            subject: 'Your Bar ID',
            html: `
                    <h1>Password Reset</h1>
                    <h3>
                        Follow <a href="${APP_URL}/pub/new-password?token=${token}">this</a> link to reset your password
                    </h3>
                    <h5>
                        It expires at ${moment().format('MMMM Do YYYY, h:mm:ss a')}
                    </h5>
                `
        };

        smtpTransport.sendMail(mailOptions, (err) => {
            if (err) {
                return res.status(500).send({success: false, code: responseCodes.SERVER_ERROR});
            }

            res.json({
                success: true
            });
        });
    } catch (e) {
        res.status(500).send({success: false, code: responseCodes.SERVER_ERROR});
    }
});

router.post('/new-password', async (req, res) => {
    try {
        const {email, token, password} = req.body;

        const user = await User.findOne({email});

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
                code: responseCodes.USER_NOT_FOUND
            })
        }

        if (!(
            user.reset &&
            user.reset.token === token &&
            moment().isBefore(moment(user.reset.expiryDate))
        )) {
            return res.status(400).json({success: false, code: responseCodes.INVALID_RESET_TOKEN})
        }


        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        res.json({
            success: true
        })
    } catch (e) {
        res.status(500).send({success: false, code: responseCodes.SERVER_ERROR});
    }
});

module.exports = router;