const express = require('express');
const router = express.Router();
const auth = require('../middleware/oauth');

const Order = require('../Models/Order');
const Voucher = require('../Models/Voucher');

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

            res.json({
                success: true,
                order
            })

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