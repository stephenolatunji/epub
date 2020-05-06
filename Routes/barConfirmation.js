const express = require('express');
const router = express.Router();
const {check, validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
require('dotenv').config();
const mongoose = require('mongoose');
const {APP_URL, smtpTransport, responseCodes} = require('../utils');
const moment = require('moment');
const randomize = require('randomatic');
const BarOwner = require('../Models/BarOwner');

router.route('/register')

    .post(
        [
            check('barId', 'Enter Bar ID').not().isEmpty(),
            check('password', 'Password must be six or more characters').isLength({min: 6})
        ], async (req, res) => {

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({errors: errors.array(), code: responseCodes.INVALID_FIELDS})
            }

            try {

                const {barId, password} = req.body;

                const owner = await BarOwner.findOne({bar: barId}).populate('bar');
                if (!owner) {
                    return res.status(400).json({message: 'User does not exist', success: false, code: responseCodes.USER_NOT_FOUND})
                }

                if(!owner.bar.confirmed){
                    return res.status(401).json({message: 'User not confirmed', success: false, code: responseCodes.USER_NOT_CONFIRMED})
                }

                const salt = await bcrypt.genSalt(10);
                owner.password = await bcrypt.hash(password, salt);

                await owner.save();

                const ownerObj = owner.toObject();
                delete ownerObj.password;

                const payload = {
                    user: {
                        id: owner._id
                    },
                    barOwner: true
                };

                jwt.sign(payload, process.env.JWT_SECRET, {
                    expiresIn: 3600
                }, (err, token) => {
                    if(err){
                        return res.status(500).send({success: false, code: responseCodes.SERVER_ERROR});
                    }
                    res.json({ token, owner: ownerObj, success: true });
                });
            } catch (err) {
                res.status(500).send({success: false, code: responseCodes.SERVER_ERROR});
            }

        });

router.route('/login')
    .post(
        [
            check('barId', 'Enter Bar ID').not().isEmpty(),
            check('password', 'Please enter a password with six or more characters').isLength({min: 6})
        ], async (req, res) => {

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({errors: errors.array(), code: responseCodes.INVALID_FIELDS});
            }

            const {barId, password} = req.body;
            try {

                let owner;

                if(isObjectId(barId)){
                    owner = await BarOwner.findById(barId).populate('bar');
                }else{
                    owner = await BarOwner.findOne({email: barId}).populate('bar');
                }

                if(!owner){
                    return res.status(400).json({message: 'Invalid Credentials', success: false, code: responseCodes.USER_NOT_FOUND});
                }

                if(!owner.bar.confirmed){
                    return res.status(401).json({message: 'User not confirmed', success: false, code: responseCodes.USER_NOT_CONFIRMED})
                }

                const isMatch = await bcrypt.compare(password, owner.password);

                if (!isMatch) {
                    return res.status(400).json({message: 'Invalid password', success: false, code: responseCodes.INVALID_CREDENTIALS});
                }

                const ownerObj = owner.toObject();
                delete ownerObj.password;

                const payload = {
                    user: {
                        id: owner._id
                    },
                    barOwner: true
                };

                jwt.sign(payload, process.env.JWT_SECRET, {
                    expiresIn: 3600
                }, (err, token) => {
                    if(err){
                        return res.status(500).send({success: false, code: responseCodes.SERVER_ERROR});
                    }
                    res.json({ token, owner: ownerObj, success: true });
                });

            } catch (err) {
                res.status(500).send({success: false, code: responseCodes.SERVER_ERROR});
            }
        });

router.post('/reset-password', async (req, res) => {
    try {
        const {email} = req.body;

        const owner = await BarOwner.findOne({email});

        if (!owner) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
                code: responseCodes.USER_NOT_FOUND
            })
        }

        const token = randomize('Aa0', 10);
        const expiryDate = new Date().getTime() + (36000 * 1000); //10 hours from now

        owner.reset = {
            token,
            expiryDate
        };

        await owner.save();

        const mailOptions = {
            to: owner.email,
            from: process.env.SMTP_USER,
            subject: 'Your Bar ID',
            html: `
                    <h1>Password Reset</h1>
                    <h3>
                        Follow <a href="${APP_URL}/bar/new-password?token=${token}">this</a> link to reset your password
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
        res.status(500).send({success: false, code: responseCodes.SERVER_ERROR});
    }
});

router.post('/new-password', async (req,res) => {
    try {
        const {email, token, password} = req.body;

        const owner = await BarOwner.findOne({email});

        if (!owner) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
                code: responseCodes.USER_NOT_FOUND
            })
        }

        if(!(
            owner.reset &&
            owner.reset.token === token &&
            moment().isBefore(moment(owner.reset.expiryDate))
        )){
            return res.status(400).json({success: false, code: responseCodes.INVALID_RESET_TOKEN})
        }


        const salt = await bcrypt.genSalt(10);
        owner.password = await bcrypt.hash(password, salt);

        await owner.save();

        res.json({
            success: true
        })
    }catch (e) {
        res.status(500).send({success: false, code: responseCodes.SERVER_ERROR});
    }
});

const isObjectId = (str) => {
    try{
        return str === new mongoose.Types.ObjectId(str)
    }catch (e) {
        return false
    }
};

module.exports = router;