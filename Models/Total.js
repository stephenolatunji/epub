const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const totalSchema = new Schema({
    currentTotal: {
        type: Number,
        required: true,
        default: 0
    }
});

module.exports = mongoose.model('Total', totalSchema);