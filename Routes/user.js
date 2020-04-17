const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');


const User = require('../Models/User');

// passport.use(User.createStrategy());
 
// use static serialize and deserialize of model for passport session support
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

// Register Route

router.route('/register')
  
    // @route       POST/User
    // @desc        Register new user
    // access       Public

    .post( 
        [
        check('firstname', 'Enter firstname').not().isEmpty(),
        check('lastname', 'Enter lastname').not().isEmpty(),
        check('password', 'Please enter a password with six or more character').isLength({ min: 6 }),
        check('email', 'Enter a valid email').isEmail()
        ], async (req, res) => {

        const errors = validationResult(req);
        if(!errors.isEmpty()){
            res.status(400).json({errors: errors.array()});

        }
        const { firstname, lastname, email, password } =  req.body;

        try{

            let user = await User.findOne({ email });
            if(user){
                return res.status(400).json({message: 'User already exists'})
            }

            user = new User({
                firstname,
                lastname,
                email,
                password
            })

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);

            await user.save();
            
            const payload = {
                user: {
                    id: user.id
                }
            }

            jwt.sign(payload, config.get('jwtSecret'), {
                expiresIn: 3600
            }, (err, token) => {
                if(err) throw err;
                res.json({ token });
            });
        }
        catch(err){
            res.status(500).json(err + 'Error')
        }
       
    })

    .get( async (req, res) => {
        try{
            const user = await User.find();
            res.json(user)
        }
        catch(err){
            res.status(500).json(err + 'Error')
        }
    })

    // Login Route
router.route('/login')

    .post( (req, res, next) => {
        passport.authenticate('local', {
            successRedirect: '/order',
            failureRedirect: '/User/login',
            failureFlash: true
        })(req, res, next);

});

module.exports = router;