const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');


const Bar = require('../Models/Bar');


router.route('/')


    // @route       POST/
    // @desc        Register new bars
    // access       Public

    .post(
        [
            check('barName', 'Enter bar name').not().isEmpty(),
            check('location', 'Please select a location').not().isEmpty(),
            check('barId', 'Enter bar ID').not().isEmpty()
        ], async (req, res) => {

            const errors = validationResult(req)
            if(!errors.isEmpty()){
                return res.status(400).json({ errors: errors.array()})
            }

        const { barName, address, location, picture, barId } = req.body;

        try{

            let bar = await Bar.findOne({ barId })
            
            if(bar){
                return res.status(400).json({ message: 'bar already exists'})
            }
            
                bar = new Bar({
                barName,
                address,
                location,
                picture,
                barId
            })

            const newBar = await bar.save();
            res.json(newBar);
        }
        catch(err){
            res.status(500).json(err + 'Error')
        }

    })

    // @route       GET/
    // @desc        Fetch all bars
    // access       Public

    .get( async (req, res) => {

        try{

            const bar = await Bar.find()
            res.json(bar);
        }
        catch(err){
            res.status(500).json(err + 'Error')
        }
    });



router.route('/:_id')
    // @route       GET/
    // @desc         Fetch a single bar
    // access       Public

    .get( async (req, res) => {

        try{
        const bar = await Bar.findById({_id: req.params._id});
        res.json(bar);
        }
        catch(err){
            res.status(500).json(err + 'Error')
        }
    })


    // @route       PATCH/
    // @desc        Updates a specific bar
    // access       Public

    .patch( async (req, res) => {

        try{

            const bar = await Bar.update(
                {_id: req.params._id},
                {$set: req.body}
            )
            res.json(bar)
        }
        catch(err){
            res.status(500).json(err + 'Error')
        }
    });

    module.exports = router;