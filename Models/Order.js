const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema({
    date: {
        type: Date,
        default: Date.now()
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    vouchers: [
        {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'Voucher'
        }
    ],
    total: {
        type: Number,
        required: true
    },
    reference: {
        type: String,
        required: true
    }
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;