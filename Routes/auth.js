const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const {check, validationResult} = require('express-validator');
const auth = require('../middleware/oauth');


const User = require('../Models/User');

router.post('/',
    [
        check('password', 'Please enter a password with six or more character').isLength({min: 6}),
        check('email', 'Enter a valid email').isEmail()
    ], async (req, res) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({errors: errors.array()});

        }

        const {email, password} = req.body;

        try {

            let user = await User.findOne({email});

            if (!user) {
                return res.status(400).json({message: 'Invalid Credentials'});
            }

            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return res.status(400).json({message: 'Invalid Credentials'});
            }

            const payload = {
                user: {
                    id: user.id
                }
            }

            jwt.sign(payload, config.get('jwtSecret'), {
                expiresIn: 3600
            }, (err, token) => {
                if (err) throw err;
                res.json({token});
            });

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error')
        }
    })

module.exports = router;