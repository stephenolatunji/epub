const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const multer = require("multer");
const moment = require("moment");
const cloudinary = require("cloudinary");
const cloudinaryStorage = require("multer-storage-cloudinary");
const {responseCodes, smtpTransport} = require('../utils');
const auth = require('../middleware/oauth');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDNARY_SECRET
});

const storage = cloudinaryStorage({
    cloudinary: cloudinary,
    folder: "BAR",
    allowedFormats: ["jpg", "png", "jpeg"],
    transformation: [{width: 400, height: 400, crop: "limit"}]
});

const parser = multer({storage: storage});


const Bar = require('../Models/Bar');
const BarOwner = require('../Models/BarOwner');


router.route('/')


    // @route       POST/
    // @desc        Register new bars
    // access       Public

    .post(
        parser.single('image'),
        async (req, res) => {
            const image = {};
            image.url = req.file.url;
            image.id = req.file.public_id;

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
                const prevBar = await Bar.findOne({email});

                if(prevBar){
                    return res.status(400).json({success: false, message: 'User already exists', code: responseCodes.USER_ALREADY_EXISTS})
                }

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
                    email,
                    image: image.url
                });

                await bar.save();

                const user = new BarOwner({
                    bar: bar._id,
                    firstName,
                    lastName,
                    email
                });

                await user.save();

                const mailOptions = {
                    to: bar.email,
                    from: process.env.SMTP_USER,
                    subject: 'Congrats! You have successfully signed up',
                    html: `
                        <img style="display: block; margin-bottom: 20px" src="https://res.cloudinary.com/dpgdjfckl/image/upload/v1587481918/BAR/bar_lxlwze.png" alt="Logo" class="logo">
                        <h1>Congrats you have successfully signed up</h1>                      
                        <h3>
                            Thank you for joining the Naija Bar Rescue Initiative.
                            Your details will be reviewed by our team and you will be contacted once validated.
                        </h3>
                        <h3>
                            For more information, please contact us - support@naijabarrescue.com or call 09062829447
                        </h3>
                    `
                };

                smtpTransport.sendMail(mailOptions, function (err) {
                    if (err) {
                        return res.status(500).send({success: false, code: responseCodes.SERVER_ERROR});
                    }
                    res.status(200).json({
                        message: 'A verification email has been sent to ' + bar.email + '.',
                        success: true
                    });
                });
            } catch (err) {
                await BarOwner.deleteOne({email});
                await Bar.deleteOne({email});
                res.status(500).send({success: false, code: responseCodes.SERVER_ERROR});
            }
        })


    // @route       GET/
    // @desc        Fetch all bars
    // access       Public
    .get(async (req, res) => {
        let {
            page = 1,
            sort = '',
            state = null,
            pageSize = 8,
            search = null,
            returnConfirmed = true,
            returnConfirmedCount = false,
            startDate = null,
            endDate = null,
            date = null
        } = req.query;

        pageSize = Number(pageSize);
        page = Number(page);

        let query = {
            skip: (page - 1) * pageSize,
            limit: pageSize
        };

        const filter = {};

        if(returnConfirmed !== 'false'){
            filter.confirmed = true;
        }

        if(sort && sort.slice(1) === 'name'){
            query.sort = { barName: sort.slice(0,1) === '+' ? 1 : -1 }
        }

        if(sort && sort === '+confirmed'){
            query.sort = { confirmed: 1, barName: 1 }
        }

        if(state){
            filter.city = new RegExp(state, 'i');
        }

        if(search){
            filter.barName = new RegExp(search,'i')
            query.sort = {
                ...query.sort,
                date: 1
            }
        }

        if(startDate && endDate){
            filter.date = {
                $gte: moment(startDate).startOf('day'),
                $lte: moment(endDate).endOf('day'),
            };
            query.sort = {
                date: -1
            }
        }

        if(date){
            filter.date = {
                $gte: moment(date).startOf('day'),
                $lte: moment(date).endOf('day')
            };
            query.sort = {
                date: -1
            }
        }

        try {
            const bars = await Bar.find(filter, null, query).select('barName address city image', function(err, ba){
                if(err){
                    console.log(err)
                }
                console.log(ba)
            }).lean();

            const count = await Bar.countDocuments(filter);

            const returnPayload = {
                success: true,
                bars,
                totalPages: Math.ceil(count / pageSize),
                currentPage: page
            };

            if(returnConfirmedCount){
                returnPayload.confirmedBars = await Bar.countDocuments({confirmed: true})
            }

            res.json(returnPayload);
        } catch (err) {
            res.status(500).send({success: false, code: responseCodes.SERVER_ERROR});
        }
    });


router.route('/:_id')
    // @route       GET/
    // @desc         Fetch a single bar
    // access       Public

    .get(async (req, res) => {

        try {
            const bar = await Bar.findById({_id: req.params._id}, 'barName address city image', function (err, ba){
                if(err){
                    console.log(err)
                }
                console.log(ba)
            });
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


    router.get('/admin', auth(false, true), async (req, res) => {

        let {
            page = 1,
            sort = '',
            state = null,
            pageSize = 8,
            search = null,
            returnConfirmed = true,
            returnConfirmedCount = false,
            startDate = null,
            endDate = null,
            date = null
        } = req.query;

        pageSize = Number(pageSize);
        page = Number(page);

        let query = {
            skip: (page - 1) * pageSize,
            limit: pageSize
        };

        const filter = {};

        if(returnConfirmed !== 'false'){
            filter.confirmed = true;
        }

        if(sort && sort.slice(1) === 'name'){
            query.sort = { barName: sort.slice(0,1) === '+' ? 1 : -1 }
        }

        if(sort && sort === '+confirmed'){
            query.sort = { confirmed: 1, barName: 1 }
        }

        if(state){
            filter.city = new RegExp(state, 'i');
        }

        if(search){
            filter.barName = new RegExp(search,'i')
            query.sort = {
                ...query.sort,
                date: 1
            }
        }

        if(startDate && endDate){
            filter.date = {
                $gte: moment(startDate).startOf('day'),
                $lte: moment(endDate).endOf('day'),
            };
            query.sort = {
                date: -1
            }
        }

        if(date){
            filter.date = {
                $gte: moment(date).startOf('day'),
                $lte: moment(date).endOf('day')
            };
            query.sort = {
                date: -1
            }
        }

        try {
            const bars = await Bar.find(filter, null, query).lean();

            const count = await Bar.countDocuments(filter);

            const returnPayload = {
                success: true,
                bars,
                totalPages: Math.ceil(count / pageSize),
                currentPage: page
            };

            if(returnConfirmedCount){
                returnPayload.confirmedBars = await Bar.countDocuments({confirmed: true})
            }

            res.json(returnPayload);
        } catch (err) {
            res.status(500).send({success: false, code: responseCodes.SERVER_ERROR});
        }
    });

    router.route('/:_id/admin')
    // @route       GET/
    // @desc        Fetch a single bar by admin. Request populates all the info about a bar
    // access       Public

    .get( auth(false, true), async (req, res) => {

        try {
            const bar = await Bar.findById({_id: req.params._id});
            res.json(bar);
        } catch (err) {
            res.status(500).json(err + 'Error')
        }
    })

//Endpoint to verify that the bar still exists and it's amount made is below the threshold
router.post('/verify', async (req,res) => {
    const barIds = req.body;
    const response = {};
    await Promise.all(
        barIds.map(async id => {
            const bar = await Bar.findOne({_id: id}).lean();
            if(bar){
                bar.valid = bar.amountMade < 500000 && bar.confirmed;
            }
            response[id] = bar || false;
        })
    );
    res.status(200).json(response)
});

module.exports = router;