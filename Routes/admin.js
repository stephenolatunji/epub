const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const auth = require('../middleware/oauth');
const Admin = require('../Models/Admin');
const Bar = require('../Models/Bar');
const BarOwner = require('../Models/BarOwner');
const Order = require('../Models/Order');

const {smtpTransport, APP_URL, responseCodes, verifyOrder} = require('../utils');


router.post('/login', async (req, res) => {
    try {
        const {email, password} = req.body;

        const admin = await Admin.findOne({email});

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'admin not found',
                code: responseCodes.USER_NOT_FOUND
            })
        }

        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid details',
                code: responseCodes.INVALID_CREDENTIALS
            })
        }

        const payload = {
            user: {
                id: admin._id
            },
            isAdmin: true
        };

        jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: 3600
        }, (err, token) => {
            if (err) {
                return res.status(500).send({success: false, code: responseCodes.SERVER_ERROR});
            }

            res.json({token, admin, success: true});
        });
    }catch (e) {
        res.status(500).send({success: false, code: responseCodes.SERVER_ERROR});
    }
});

router.post('/toggle-confirm', auth(false, true), async (req, res) => {
    try {
        const {barId, confirmed} = req.body;

        const bar = await Bar.findById(barId);

        if (!bar) {
            return res.status(404).json({success: false, message: 'Bar not found', code: responseCodes.BAR_NOT_FOUND})
        }

        bar.confirmed = confirmed;

        await bar.save();

        const barOwner = await BarOwner.findOne({bar: barId});

        const confirmMessage = `
        <img style="display: block; margin-bottom: 20px" src="https://res.cloudinary.com/dpgdjfckl/image/upload/v1587481918/BAR/bar_lxlwze.png" alt="Logo" class="logo">
        <h1>
            Thank you for using for the Naija Bar Rescue Initiative. Your account has been activated. Now your consumers will be able to see your bar on the platform and buy vouchers.
        </h1>
        <h3>
         Follow <a href="${APP_URL}/bar/create-password?id=${bar._id}">this</a> link to sign in to your profile where you can see a list of vouchers purchased at your bar.
        </h3>
     `;

        const reConfirmMessage = `
        <img style="display: block; margin-bottom: 20px" src="https://res.cloudinary.com/dpgdjfckl/image/upload/v1587481918/BAR/bar_lxlwze.png" alt="Logo" class="logo">
        <h1>
            Thank you for using for the Naija Bar Rescue Initiative. Your account has been re-activated. Now your consumers will be able to see your bar on the platform and buy vouchers.
        </h1>
        <h3>
         You can proceed to the <a href="${APP_URL}/bar/login">login</a> page to view your dashboard
        </h3>
     `;

        const disableMessage = `
        <img style="display: block; margin-bottom: 20px" src="https://res.cloudinary.com/dpgdjfckl/image/upload/v1587481918/BAR/bar_lxlwze.png" alt="Logo" class="logo">
        <h1> 
            Your Naija Bar Rescue Initiative account has been de-activated .
        </h1>
        <h3>
            Kindly contact us at support@naijabarrescue.com or call 09062829447 to get more details on how to reactivate your account.
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
                return res.status(500).send({success: false, code: responseCodes.SERVER_ERROR});
            }
            res.json({success: true});
        });
    }catch (e) {
        res.status(500).send({success: false, code: responseCodes.SERVER_ERROR});
    }
});

router.post('/generate-order', auth(false, true), async (req, res) => {
    try {
        const { reference } = req.params;

        const order = await Order.findOne({ reference })

        if(order){
            return res.status(400).send({
                success: false,
                code: responseCodes.ORDER_ALREADY_EXISTS
            })
        }

        const paystackData = await verifyOrder(reference)

        if(!paystackData.status){
            return res.status(400).json({
                message: 'Order not valid',
                code: responseCodes.INVALID_ORDER
            })
        }

        const { userId, userDetails, vouchers } = paystackData.data.metadata

        const orderObj = {
            reference,
            vouchers,
        }

        if(userId === 'guest'){
            orderObj.isGuest = true
            orderObj.guestData = userDetails
        }else{
            orderObj.userId = userId
        }

        return res.status(200).send({
            success: true,
            order: orderObj
        })
    } catch (e) {
        return res.status(500).send({
            success: false,
            code: responseCodes.SERVER_ERROR
        })
    }
})

module.exports = router;