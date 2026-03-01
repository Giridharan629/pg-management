const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
    // Personal Details
    fullName: { type: String, required: true },
    phoneNumber: { type: String, required: true, unique: true },
    emergencyContact: { type: String, required: true },
    permanentAddress: { type: String, required: true },
    bloodGroup: { type: String },

    // Legal & KYC
    aadhaarNumber: { type: String, required: true, unique: true },
    aadhaarFrontUrl: { type: String, required: true },
    aadhaarBackUrl: { type: String, required: true },
    photoUrl: { type: String },
    
    // Digital Consent
    agreedToTerms: { type: Boolean, required: true },
    applicationIpAddress: { type: String }, 

    // Admin Control Flags
    status: { 
        type: String, 
        enum: ['Applied', 'Verified', 'Active', 'Notice_Period', 'Exited', 'Rejected'], 
        default: 'Applied' 
    },
    policeVerificationDone: { type: Boolean, default: false },
    
    // Accommodation Reference
    assignedBed: { type: mongoose.Schema.Types.ObjectId, ref: 'Bed', default: null },
    
    // Core Financials
    securityDeposit: { type: Number, default: 0 },
    monthlyRent: {
        type: Number,
        default: 0
    },
    dateOfJoining: { type: Date, default: null },
    dateOfExit: { type: Date, default: null }

}, { timestamps: true });

module.exports = mongoose.model('Tenant', tenantSchema);