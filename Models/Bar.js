const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const barSchema = new Schema({
    barName: {
        type: String,
        required: true,
        trim: true
    },

    address: {
        type: String,
        required: true,
        trim: true,
    },

    location: {
        type: String,
        required: true,
        trim: true
    },

    picture: {
        type: String,
        required: true,
        trim: true
    },

    barId: {
        type: String,
        required: true,
        trim: true
    },

    date: {
        type: Date,
        default: Date.now
    }
});

const Bar = mongoose.model('Bar', barSchema);

module.exports = Bar;