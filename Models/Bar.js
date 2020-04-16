const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const barSchema = new Schema({
    barName: {
        type: String,
        required: true,
        trim: true
    },

    firstName: {
        type: String,
        required: true,
        trim: true,
    },

    lastName: {
        type: String,
        required: true,
        trim: true,
    },

    bvn: {
        type: Number,
        required: true,
        trim: true,
    },

    accountName: {
        type: String,
        required: true,
        trim: true,
    },
    
    accountNumber:{
        type: Number,
        required: true,
        trim: true,
    },
    bankName: {
        type: String,
        required: true,
        trim: true,
    },

    address: {
        type: String,
        required: true,
        trim: true,
    },

    city: {
        type: String,
        required: true,
        trim: true
    },

    phone1: {
        type: Number,
        required: true,
        trim: true,
    },

    phone2: {
        type: Number,
        required: true,
        trim: true,
    },

    email: {
        type: String,
        required: true,
        trim: true,
    },

    // picture: {
    //     type: String,
    //     required: true,
    //     trim: true
    // },

    barId: {
        type: String,
        required: true,
        trim: true
    },

    isVerified: {
        type: Boolean
    },

    date: {
        type: Date,
        default: Date.now
    }
});

const Bar = mongoose.model('Bar', barSchema);

module.exports = Bar;