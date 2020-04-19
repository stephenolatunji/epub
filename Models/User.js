const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    firstname: {
        type: String,
        required: true,
        trim: true
    },
    lastname: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        trim: true
    },
    
    date: {
        type: Date,
        default: Date.now
    },

    reset: {
        token: String,
        expiryDate: Date
    },

    vouchersUsed: {
        type: Number,
        default: 0
    }
});


const User = mongoose.model('User', userSchema);
module.exports = User;