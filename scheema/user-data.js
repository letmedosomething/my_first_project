const mongoose = require("mongoose");
const userdata = new mongoose.Schema({



    name: { type: String, required: true, unique: true },
    password: { type: String, required: true },


    latitude: Number,
    longitude: Number,
    accuracy: Number,
    timestamp: { type: Date, default: Date.now },
    userAgent: String


});

const data = mongoose.model('users-data', userdata);
module.exports = data;
