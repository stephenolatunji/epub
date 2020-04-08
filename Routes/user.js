const express = require('express');
const Router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const { check, validationResult } = require('express-validator');


const User = require('../Models/User');

// Register Route

Router.route('/register')

    // @route       POST/User
    // @desc        Register new user
    // access       Public
    .post( [
        check('firstname', 'Enter firstname').not().isEmpty(),
        check('lastname', 'Enter lastname').not().isEmpty(),
        check('username', 'Please enter a username').not().isEmpty(),
        check('password', 'Please enter a password with six or more character').isLength({ min: 6 }),
        check('email', 'Enter a valid email').isEmail()
    ], async (req, res) => {

        const errors = validationResult(req);
        if(!errors.isEmpty()){
            res.status(400).json({errors: errors.array()});
        }

        const { firstname, lastname, username, eamil, password } =  req.body;

        try{

            let user = await User.findOne({ username });
            if(user){
                return res.status(400).json({ message: 'User already exists'})
            }
            user = new User({
                firstname,
                lastname,
                username,
                eamil,
                password
            });

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);

            const newN
        }
        catch(err){
            res.status(500).json(err + 'Error')
        }
    })

    .get()








    // Login Route
    Router.route('/login')

        .post()

    module.exports = router;