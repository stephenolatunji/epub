const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema({
    user: {
        type: String,
        trim: true
    },
    
    bar: [
        {
            barName:{
                type: Schema.Types.ObjectId,
                ref: 'Pubs'
            },
            amount:{
                type: Number,
                required: true
            },

            quantity: {
                type: Number
            }
        }

    ],

    total: {
        type: Number,
        reqiured: true,
        trim: true
    },

    date: {
        type: Date,
        default: Date.now
    }
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;