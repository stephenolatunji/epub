const express = require('express');
const router = express.Router();
const {check, validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const mongoose = require('mongoose');

const Token = require('../Models/Token');

router.route('/register')

    .post(
        [
            check('barId', 'Enter Bar ID').not().isEmpty(),
            check('password', 'Password must be six or more characters').isLength({min: 6})
        ], async (req, res) => {

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({errors: errors.array()})
            }

            try {

                const {barId, password} = req.body;

                const owner = await Token.findOne({bar: barId}).populate('bar');
                if (!owner) {
                    return res.status(400).json({message: 'User does not exist', success: false})
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

                jwt.sign(payload, config.get('jwtSecret'), {
                    expiresIn: 3600
                }, (err, token) => {
                    if(err) throw err;
                    res.json({ token, owner: ownerObj, success: true });
                });
            } catch (err) {
                res.status(500).json({message: err + 'Error', success: false})
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
                res.status(400).json({errors: errors.array()});
            }

            const {barId, password} = req.body;
            try {

                let owner;

                if(isObjectId(barId)){
                    owner = await Token.findById(barId).populate('bar');
                }else{
                    owner = await Token.findOne({email: barId}).populate('bar');
                }

                if(!owner){
                    return res.status(400).json({message: 'Invalid Credentials', success: false});
                }

                const isMatch = await bcrypt.compare(password, owner.password);

                if (!isMatch) {
                    return res.status(400).json({message: 'Invalid password', success: false});
                }

                const ownerObj = owner.toObject();
                delete ownerObj.password;

                const payload = {
                    user: {
                        id: owner._id
                    },
                    barOwner: true
                };

                jwt.sign(payload, config.get('jwtSecret'), {
                    expiresIn: 3600
                }, (err, token) => {
                    if(err) throw err;
                    res.json({ token, owner: ownerObj, success: true });
                });

            } catch (err) {
                res.status(500).json({message: err + 'Error', success: false})
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