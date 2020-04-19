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
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now()
    },
    isGuest: {
        type: Boolean,
        default: false
    },
    guestData: {
        firstname: {
            type: String,
            trim: true
        },
        lastname: {
            type: String,
            trim: true
        },
        email: {
            type: String,
            trim: true
        }
    }
});

module.exports = mongoose.model('Voucher', voucherSchema);