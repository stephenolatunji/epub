const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const pubSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    address: {
        type: String,
        required: true,
        trim: true
    },

    location: {
        type: String,
        required: true,
        trim: true
    },

    picture: {
        type: String,
        required: true,
    },
    pubId: {
        type: String,
        required: true,
        trim: true,
        unique: true
    }
});

const Pub = mongoose.model('Pub', pubSchema);

module.exports = Pub;