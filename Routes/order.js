const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');


const Order = require('../Models/Order');
const User = require('../Models/User');
const Bar = require('../Models/Bar');

router.route('/')

    .post( ensureAuthenticated, async (req, res) => {

        
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

    .get(ensureAuthenticated, async (req, res) => {
         
        try{

            const order = await Order.find({ user: req.user.id})
            res.json(order)
        }
        catch(err){
            res.status(500).json(err + 'Error')
        }
    });

    module.exports = router;