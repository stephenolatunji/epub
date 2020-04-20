const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('config');

const Admin = require('../Models/Admin');
const Bar = require('../Models/Bar');
const BarOwner = require('../Models/BarOwner');

const {smtpTransport, APP_URL} = require('../utils');

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
    const {barId, confirmed} = req.body;

    const bar = await Bar.findById(barId);

    if (!bar) {
        return res.status(404).json({success: false, message: 'Bar not found'})
    }

    bar.confirmed = confirmed;

    await bar.save();

    const barOwner = await BarOwner.findOne({bar: barId});

    const confirmMessage = `
        <h1>
            Thank you for using for the Naija Bar Rescue Initiative. Your account has been activated. Now your consumers will be able to see your bar on the platform and buy vouchers.
        </h1>
        <h3>
         Follow <a href="${APP_URL}/pub/create-password?id=${bar._id}">this</a> link to sign in to your profile where you can see a list of vouchers purchased at your bar.
        </h3>
     `;

    const reConfirmMessage = `
        <h1>
            Thank you for using for the Naija Bar Rescue Initiative. Your account has been re-activated. Now your consumers will be able to see your bar on the platform and buy vouchers.
        </h1>
        <h3>
         You can proceed to the <a href="${APP_URL}/pub/login">login</a> page to view your dashboard
        </h3>
     `;

    const disableMessage = `
        <h1> 
            Your Naija Bar Rescue Initiative account has been de-activated .
        </h1>
        <h3>
            Kindly contact us at support@naijabarrescue.com or call 09062820138 to get more details on how to reactivate your account.
        </h3>
     `;

    let email;

    if (confirmed) {
        //If the bar owner has a password then they've logged in before so send reconfirm mail else send confirm message
        email = (barOwner && barOwner.password) ? reConfirmMessage : confirmMessage
    } else {
        email = disableMessage
    }

    const mailOptions = {
        to: bar.email,
        from: process.env.SMTP_USER,
        subject: 'Bar Status',
        html: email
    };

    smtpTransport.sendMail(mailOptions, function (err) {
        if (err) {
            return res.status(500).send({message: err.message, success: false});
        }
        res.json({success: true});
    });
});

module.exports = router;