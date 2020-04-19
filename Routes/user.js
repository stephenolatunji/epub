const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const {check, validationResult} = require('express-validator');
const randomize = require('randomatic');
const {APP_URL, smtpTransport} = require('../utils');
const moment = require('moment');

const User = require('../Models/User');

// Register Route

router.route('/')

    // @route       POST/User
    // @desc        Register new user
    // access       Public

    .post(
        [
            check('firstname', 'Enter firstname').not().isEmpty(),
            check('lastname', 'Enter lastname').not().isEmpty(),
            check('password', 'Please enter a password with six or more character').isLength({min: 6}),
            check('email', 'Enter a valid email').isEmail()
        ], async (req, res) => {

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({message: errors.array(), success: false});

            }
            const {firstname, lastname, email, password} = req.body;

            try {

                let user = await User.findOne({email});
                if (user) {
                    return res.status(400).json({message: 'User already exists', success: false})
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

                const payload = {
                    user: {
                        id: user.id
                    }
                };

                jwt.sign(payload, config.get('jwtSecret'), {
                    expiresIn: 3600
                }, (err, token) => {
                    if (err) throw err;
                    res.json({token, user, success: true});
                });
            } catch (err) {
                res.status(500).json({message: err + 'Error', success: false})
            }

        })

    .get(async (req, res) => {
        try {
            const user = await User.find();
            res.json(user)
        } catch (err) {
            res.status(500).json(err + 'Error')
        }
    });

router.route('/login').post(async (req, res) => {
    const {email, password} = req.body;

    const user = await User.findOne({email});

    if (!user) {
        return res.status(404).json({success: false, message: 'User not found'})
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        return res.status(401).json({success: false, message: 'Invalid details'})
    }

    const payload = {
        user: {
            id: user.id
        }
    };

    jwt.sign(payload, config.get('jwtSecret'), {
        expiresIn: 3600
    }, (err, token) => {
        if (err) throw err;
        res.json({token, user, success: true});
    });
});

router.post('/reset-password', async (req, res) => {
    try {
        const {email} = req.body;

        const user = await User.findOne({email});

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
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
                        Follow <a href="${APP_URL}/pub/set-password?token=${token}">this</a> link to reset your password
                    </h3>
                    <h5>
                        It expires at ${moment().format('MMMM Do YYYY, h:mm:ss a')}
                    </h5>
                `
        };

        smtpTransport.sendMail(mailOptions,(err) => {
            if (err) {
                return res.status(500).send({message: err.message, success: false});
            }

            res.json({
                success: true
            });
        });
    } catch (e) {
        console.log(e);
        res.status(500).json({success: false})
    }
});

router.post('/new-password', async (req,res) => {
    try {
        const {email, token, password} = req.body;

        const user = await User.findOne({email});

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            })
        }

        if(!(
            user.reset &&
            user.reset.token === token &&
            moment().isBefore(moment(user.reset.expiryDate))
        )){
            return res.status(400).json({success: false})
        }


        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        res.json({
            success: true
        })
    }catch (e) {
        console.log(e);
        res.status(500).json({success: false})
    }
});

module.exports = router;