const express = require('express');
const router = express.Router();


const Order = require('../Models/Order');

router.route('/')

    .post( async (req, res) => {
        try{
            
        }catch(err){
            res.status(500).json(err + 'Error')
        }
    })