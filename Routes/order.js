const express = require('express');
const router = express.Router();
const auth = require('../middleware/oauth');
const nodemailer = require('nodemailer');

const Order = require('../Models/Order');
const Voucher = require('../Models/Voucher');
const User = require('../Models/User');
const Bar = require('../Models/Bar');

router.route('/')


    // @route       POST/User
    // @desc        Make new order
    // access       Private

    // .post(auth, async (req, res) => {
    .post(async (req, res) => {

        const {reference, userId, barId, vouchers} = req.body;

        //Verify reference using https://api.paystack.co/transaction/verify/refId


        try {
            const vouchersMapped = vouchers.map(({price, quantity}) => ({
                price,
                quantity,
                userId,
                barId,
                total: quantity * price
            }));

            const vouchersDb = await Voucher.create(vouchersMapped);


            const order = new Order({
                userId,
                barId,
                vouchers: vouchersDb,
                total: vouchersMapped.reduce((currentTotal, {total}) => currentTotal + total, 0)
            });

            const smtpTransport = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: 465,
                secure: true,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASSWORD
                }
            });

            const user = await User.findById(userId);
            const bar = await Bar.findById(barId);

            const vouchersHtml = vouchersDb.map(({_id, price, quantity,total}) => (
                `
                    <div>
                        <h4>${bar.barName}</h4>
                        <p><b>Voucher ID: </b>${_id}</p>
                        <p><b>Quantity: </b>${quantity}</p>
                        <p><b>Price: </b>${price}</p>
                        <p><b>Total: </b>${total}</p>
                    </div>
                `
            )).join('');

            const mailOptions = {
                to: user.email,
                from: process.env.SMTP_USER,
                subject: 'Bought Vouchers!',
                html: `
                        <h1>Congrats you have successfully purchased vouchers.</h1>
                        <h3>
                         Kindly find the details below
                        </h3>
                        ${vouchersHtml}
                    `
            };

            smtpTransport.sendMail(mailOptions, function (err) {
                if (err) {
                    return res.status(500).send({message: err.message, success: false});
                }
                res.json({
                    success: true,
                    order
                })
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Error: ' + err
            })
        }

    })

    .get(auth, async (req, res) => {

        try {

            const order = await Order.find({user: req.user.id});
            res.json(order)
        } catch (err) {
            res.status(500).json(err + 'Error')
        }
    });

module.exports = router;