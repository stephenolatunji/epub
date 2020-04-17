const express = require('express');
const router = express.Router();
const auth = require('../middleware/oauth');


const Order = require('../Models/Order');
const User = require('../Models/User');
const Bar = require('../Models/Bar');

router.route('/')

    
    // @route       POST/User
    // @desc        Make new order
    // access       Private

    .post( auth, async (req, res) => {

        
        try{
            const order = new Order({ 
                name: user.name,
                user: req.user.id,
                bar: req.body.bar,
                amount: req.body.amount,
                quantity: req.body.quantity,
                total: req.body.total
            });

           const newOrder = await order.save();
           res.json(newOrder);

        }catch(err){
            res.status(500).json(err + 'Error')
        }

    })

    .get( auth, async (req, res) => {
         
        try{

            const order = await Order.find({ user: req.user.id})
            res.json(order)
        }
        catch(err){
            res.status(500).json(err + 'Error')
        }
    });

    module.exports = router;