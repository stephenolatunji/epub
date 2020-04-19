const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('config');

const Admin = require('../Models/Admin');
const Bar = require('../Models/Bar');

router.post('/register', async (req, res) => {
    const {email, password} = req.body;

    try {

        const prevAdmin = await Admin.findOne({email});
        if (prevAdmin) {
            return res.status(400).json({message: 'User already exists', success: false})
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);


        const admin = await Admin.create({
            email,
            password: hashedPassword
        });

        await admin.save();

        res.json({user: admin, success: true});

    } catch (err) {
        res.status(500).json({message: err + 'Error', success: false})
    }
});

router.post('/login', async (req, res) => {
    const {email, password} = req.body;

    const admin = await Admin.findOne({email});

    if (!admin) {
        return res.status(404).json({success: false, message: 'admin not found'})
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
        return res.status(401).json({success: false, message: 'Invalid details'})
    }

    const payload = {
        user: {
            id: admin.id
        },
        isAdmin: true
    };

    jwt.sign(payload, config.get('jwtSecret'), {
        expiresIn: 3600
    }, (err, token) => {
        if (err) throw err;
        res.json({token, admin, success: true});
    });
});

router.post('/toggle-confirm', async (req, res) => {
    const {barId,confirmed} = req.body;

    const bar = await Bar.findById(barId);

    if(!bar){
        return res.status(404).json({success: false, message: 'Bar not found'})
    }

    bar.confirmed = confirmed;

    await bar.save();

    res.json({success: true})
});

module.exports = router