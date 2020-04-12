const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');


const Pub = require('../Models/Pubs');

router.route('/')

// @route           GET/pubs
// @desc            Fetch all pubs from the database
// @access          Public

    .get(async (req, res) => {
        try{

            const pub = await Pub.find();
            res.json(pub)
        }
    catch(err){
        res.status(400).json(err + 'Error')
    }
    })
    
    
    // @route           POST/pubs
    // @desc            Add pubs to the database
    // @access          Public

    .post( [
      check('name', 'Enter Pub name').not().isEmpty(),
      check('address', 'Enter address of Pub').not().isEmpty(),
      check('pubId', 'Enter pubId').not().isEmpty(),
      check('location', 'Enter location field').not().isEmpty  
    ], async (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({errors: errors.array()})
        }

        const { name, address, picture, pubId, location } = req.body;

        try{
            let pub = await Pub.findOne({ pubId });

            if(pub){
                return res.status(400).json({message: 'Pub already exists'});
            }

            pub = new Pub({
                name,
                address,
                picture,
                pubId,
                location
            });

            const newPub = await pub.save();
            res.json(newPub);

        }catch(err){
            res.status(500).json(err + 'Error')
        }
    });

    router.route('/_id')

            
        // @route           Get/pubs
        // @desc            Fetch a single pub from the database
        // @access          Public
        .get( async (req, res) => {
            try{
                const pub = await Pub.findOne({_id: req.params._id});
                res.json(pub)
            }catch(err){
                res.status(500).json(err + 'Error')
            }
        });


module.exports = router;   