const express = require('express');
const router = express.Router();
const auth = require('../middleware/oauth');
const nodemailer = require('nodemailer');
const moment = require('moment');
const path = require('path');
const Email = require('email-templates');
const randomize = require('randomatic');

const Order = require('../Models/Order');
const Voucher = require('../Models/Voucher');
const User = require('../Models/User');
const Bar = require('../Models/Bar');
const Total = require('../Models/Total');

const {default: HTMLToPDF} = require('convert-html-to-pdf');

const {htmlToPdf, responseCodes} = require('../utils');

const emailRender = new Email({
    juice: true,
    juiceResources: {
        preserveImportant: true,
        webResources: {
            relativeTo: path.resolve('emails')
        }
    },
});

const getVoucherHTML = (options) => {
    return emailRender.render('voucher/html', options)
};


// @route       POST/User
// @desc        Make new order
// access       Private

router.post('/', async (req, res) => {

    const {reference, userId, vouchers, isGuest = false, guestData} = req.body;

    //Verify reference using https://api.paystack.co/transaction/verify/refId


    try {
        const user = await User.findById(userId);

        let vouchersMapped;

        const voucherBars = {};

        const today = moment().endOf('day');
        const lastWeek = moment().subtract(7,'d');

        if (isGuest) {
            vouchersMapped = await Promise.all(
                vouchers.map(async ({price, quantity, barId}) => {
                    const bar = await Bar.findById(barId);
                    if (bar && bar.amountMade < 500000) {
                        //If valid increase amount made
                        voucherBars[barId] = (voucherBars[barId] + price * quantity) || price * quantity;
                        return ({
							_id: randomize('Aa0', 8),
                            price,
                            quantity,
                            isGuest,
                            guestData,
                            barId,
                            total: quantity * price
                        })
                    }
                    return null
                })
            );
        } else {
            const prevOrders = await Order.countDocuments({
                date: {
                    $gte: lastWeek,
                    $lte: today
                },
                userId
            });

            if(prevOrders >= 2){
                return res.status(400).json({success: false, code: responseCodes.MAX_ORDERS_FOR_WEEK})
            }

            vouchersMapped = await Promise.all(
                vouchers.map(async ({price, quantity, barId}) => {
                    const bar = await Bar.findById(barId);
                    if (bar && bar.amountMade < 500000) {
                        //If valid increase amount made
                        voucherBars[barId] = (voucherBars[barId] + price * quantity) || price * quantity;
                        return ({
                            _id: randomize('Aa0', 8),
                            price,
                            quantity,
                            userId,
                            barId,
                            total: quantity * price
                        })
                    }
                    return null
                })
            );
        }

        vouchersMapped = vouchersMapped.filter(voucher => voucher !== null);

        const ordersTotal = vouchersMapped.reduce((currentTotal, {total}) => currentTotal + total, 0);

        if (ordersTotal > 45000) {
            return res.status(400).json({
                success: false,
                message: 'Orders should not be more than 9000',
                code: responseCodes.ORDER_REACHED_LIMIT
            })
        }

        if (!isGuest && user.vouchersUsed >= 15) {
            return res.status(400).json({
                success: false,
                message: 'User has bought max vouchers',
                code: responseCodes.VOUCHER_REACHED_LIMIT
            })
        }

        let vouchersDb = await Voucher.create(vouchersMapped);
        vouchersDb = vouchersDb || [];

        const order = await Order.create({
            userId,
            vouchers: vouchersDb,
            total: ordersTotal
        });

        await Promise.all(
            Object.entries(voucherBars)
                .map(([barId, amountMade]) => {
                        return Bar.updateOne({_id: barId}, {amountMade})
                    }
                )
        );

        const smtpTransport = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: 465,
            secure: true,
            auth: {
                user: process.env.SMTP_CONSUMER_USER,
                pass: process.env.SMTP_CONSUMER_PASSWORD
            }
        });

        const vouchersMail = await Promise.all(
            vouchers.map(async ({quantity, price, barId}) => {
                const bar = await Bar.findById(barId);
                return {
                    title: `${bar.barName} x ${quantity}`,
                    price,
                    image: bar.image
                }
            })
        );


        //TODO: Refractor to prevent fetching bar twice
        const attachments = await Promise.all(
            vouchersDb.map(async ({quantity, price, barId, _id}) => {
                const bar = await Bar.findById(barId);
                const voucherHTML = await getVoucherHTML({
                    price: `${price} x ${quantity}`,
                    address: bar.address,
                    name: bar.barName,
                    id: _id
                });
                const pdf = await htmlToPdf(voucherHTML);
                return {
                    content: pdf,
                    contentType: 'application/pdf',
                    contentDisposition: 'attachment',
                    fileName: `${bar.barName} * ${quantity}.pdf`
                };
            })
        );

        const mailOptions = {
            to: isGuest ? guestData.email : user.email,
            from: process.env.SMTP_CONSUMER_USER,
            subject: 'Bought Vouchers!',
            attachments
        };


        const email = new Email({
            juice: true,
            juiceResources: {
                preserveImportant: true,
                webResources: {
                    relativeTo: path.resolve('emails')
                }
            },
            transport: smtpTransport,
            //Uncomment this line to make it send mails in development
            // send: true
        });

        await email.send({
            message: mailOptions,
            template: 'order',
            locals: {
                orderId: `#${order._id}`.toUpperCase(),
                vouchers: vouchersMail
            }
        });


        res.json({
            success: true,
            order
        })
    } catch (err) {
        console.log(err);
        res.status(500).send({success: false, code: responseCodes.SERVER_ERROR});
    }

});


router.route('/use-voucher/:_id')
    .get(auth(true), async (req, res) => {

        try {

            const verifyVoucher = await Voucher.findById(req.params._id);
            if (!verifyVoucher) {
                return res.status(404).json({
                    message: 'Voucher does not exist',
                    success: false,
                    code: responseCodes.VOUCHER_NOT_FOUND
                })
            } else if (verifyVoucher.used) {
                return res.status(404).json({
                    message: 'Voucher has been used',
                    success: false,
                    code: responseCodes.VOUCHER_USED
                })
            } else {
                verifyVoucher.used = true;
                await verifyVoucher.save();
                return res.json({
                    success: true,
                    message: 'Voucher found!'
                });
            }
        } catch (err) {
            res.status(500).send({success: false, code: responseCodes.SERVER_ERROR});
        }
    });

router.get('/byUser/:userId', auth(), async (req, res) => {
    try {
        const vouchers = await Voucher.find({userId: req.params.userId});
        res.json({
            success: true,
            vouchers
        })
    } catch (e) {
        res.status(500).send({success: false, code: responseCodes.SERVER_ERROR});
    }
});

router.get('/byOwner/:barId', auth(true), async (req, res) => {
    let {page = 1, pageSize = 10} = req.query;

    pageSize = Number(pageSize);
    page = Number(page);

    try {
        let vouchers = await Voucher.find(
            {
                barId: req.params.barId
            },
            null,
            {
                skip: (page - 1) * pageSize,
                limit: pageSize
            }
        ).populate('userId').lean();

        const count = await Voucher.countDocuments({
            barId: req.params.barId
        });

        vouchers = vouchers.map(({userId, isGuest, guestData, ...fields}) => {
            if (isGuest) {
                return {
                    ...fields,
                    user: guestData
                }
            } else {
                return {
                    ...fields,
                    user: userId
                }
            }
        });
        res.json({
            success: true,
            vouchers,
            totalPages: Math.ceil(count / pageSize),
            currentPage: page
        })
    } catch (e) {
        res.status(500).send({success: false, code: responseCodes.SERVER_ERROR});
    }
});

module.exports = router;