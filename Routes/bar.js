const express = require('express');
const router = express.Router();
const {check, validationResult} = require('express-validator');
const nodemailer = require('nodemailer');
const randomize = require('randomatic');
const sendGridTransport = require('nodemailer-sendgrid-transport');

const Bar = require('../Models/Bar');
const Token = require('../Models/Token');


router.route('/')


    // @route       POST/
    // @desc        Register new bars
    // access       Public

    .post(
        [
            check('barName', 'Enter bar name').not().isEmpty(),
            check('city', 'Please select a city').not().isEmpty(),
            check('bvn', 'Please enter BVN').not().isEmpty()
        ], async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({errors: errors.array()})
            }

            const {
                barName,
                firstName,
                lastName,
                bvn,
                accountName,
                accountNumber,
                bankName,
                address,
                city,
                phone1,
                phone2,
                email
            } = req.body;

            try {
                const bar = new Bar({
                    barName,
                    address,
                    city,
                    firstName,
                    lastName,
                    bvn,
                    accountName,
                    accountNumber,
                    bankName,
                    phone1,
                    phone2,
                    email
                });

                await bar.save();

                const user = new Token({
                    bar: bar._id,
                    firstName,
                    lastName
                });

                await user.save();

                res.status(200).json({
                    message: 'A verification email has been sent to ' + bar.email + '.',
                    success: true
                });

                // const smtpTransport = nodemailer.createTransport({
                //     service: "gmail",
                //     host: "smtp.gmail.com",
                //     auth: {
                //         user: "addeufemy@gmail.com",
                //         pass: "P1SSWOR4!"
                //     }
                // });
                const smtpTransport = nodemailer.createTransport(sendGridTransport({
                    auth: {
                        api_key: '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'
                    }
                }));

                const mailOptions = {
                    to: bar.email,
                    from: 'deyeminifemi@gmail.com',
                    subject: 'Your Bar ID',
                    html: `
                        <h1>Congrats you have successfully signed up</h1>
                        <p>Kindly go to <a href="https://naijabarrescue.netlify.app/pub/create-password?id=${bar._id}">this</a> link to get started</p>
                    `
                };

                smtpTransport.sendMail(mailOptions, function (err) {
                    if (err) {
                        return res.status(500).send({message: err.message, success: false});
                    }
                });

            } catch (err) {
                res.status(500).json({message: err + 'Error', success: false})
            }
        })


    // @route       GET/
    // @desc        Fetch all bars
    // access       Public

    .get(async (req, res) => {

        try {

            const bar = await Bar.find().populate('bar', []);
            res.json(bar);
        } catch (err) {
            res.status(500).json(err + 'Error')
        }
    });


router.route('/:_id')
    // @route       GET/
    // @desc         Fetch a single bar
    // access       Public

    .get(async (req, res) => {

        try {
            const bar = await Bar.findById({_id: req.params._id});
            res.json(bar);
        } catch (err) {
            res.status(500).json(err + 'Error')
        }
    })


    // @route       PATCH/
    // @desc        Updates a specific bar
    // access       Public

    .patch(async (req, res) => {

        try {

            const bar = await Bar.update(
                {_id: req.params._id},
                {$set: req.body}
            );
            res.json(bar)
        } catch (err) {
            res.status(500).json(err + 'Error')
        }
    });

module.exports = router;