const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tokenSchema = new Schema({
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
    }
});

const Token = mongoose.model('Token', tokenSchema);

module.exports = Token;