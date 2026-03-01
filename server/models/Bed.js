const mongoose = require('mongoose');

const bedSchema = new mongoose.Schema({
    bedNumber: { type: String, required: true, unique: true }, // e.g., "101-A", "101-B"
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    
    isOccupied: { type: Boolean, default: false },
    currentTenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', default: null },
    
    monthlyRentPrice: { type: Number, required: true } // Different beds might have different prices
}, { timestamps: true });

module.exports = mongoose.model('Bed', bedSchema);