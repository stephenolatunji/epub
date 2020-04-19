const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const barOwnerSchema = new Schema({
    bar: {
        type: Schema.Types.ObjectId,
        ref: 'Bar'
    },

    firstName: {
        type: String,
    },

    lastName: {
        type: String,
    },

    password: {
        type: String,
    },

    date: {
        type: Date,
        default: Date.now
    },

    email: {
        type: String
    },

    reset: {
        token: String,
        expiryDate: Date
    }
});

const BarOwner = mongoose.model('BarOwner', barOwnerSchema);

module.exports = BarOwner;