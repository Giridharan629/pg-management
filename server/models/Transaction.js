const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    
    transactionType: { 
        type: String, 
        // strictly limited to your business model
        enum: ['Room_Rent', 'Current_Bill', 'Security_Deposit', 'Refund'], 
        required: true 
    },
    
    amount: { type: Number, required: true },
    
    paymentMode: { 
        type: String, 
        // strictly limited to your payment methods
        enum: ['Cash', 'Online'], 
        required: true 
    },
    
    // If Online, you MUST log the transaction ID to prevent disputes
    transactionReferenceId: { type: String, default: 'N/A' }, 
    
    paymentDate: { type: Date, default: Date.now },
    
    billingCycle: { type: String }, // e.g., "March 2026"
    remarks: { type: String }

}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);