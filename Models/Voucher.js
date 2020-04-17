const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const voucherSchema = new Schema({
    barId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Bar'
    },
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    total: {
        total: Number,
        required: true
    }
});

module.exports = mongoose.model('Voucher', voucherSchema);