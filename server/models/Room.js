const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    roomNumber: { type: String, required: true, unique: true },
    floor: { type: Number, required: true },
    roomType: { type: String, enum: ['Non-AC', 'AC'], required: true }
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);