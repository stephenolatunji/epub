const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    pub: [
        {
            name:{
                type: Schema.Types.ObjectId,
                ref: 'Pubs'
            },
            amount:{
                type: Number,
                required: true
            }
        },

    ],

    total: {
        type: Number,
        reqiured: true,
        trim: true
    }
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;