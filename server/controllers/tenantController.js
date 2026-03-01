const Tenant = require('../models/Tenant');
const cloudinary = require('../config/cloudinary');

// Modern helper function to stream files from memory to Cloudinary
const uploadToCloudinary = (fileBuffer, folderName) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: folderName },
            (error, result) => {
                if (error) reject(error);
                else resolve(result.secure_url);
            }
        );
        uploadStream.end(fileBuffer);
    });
};

const enrollTenant = async (req, res) => {
    try {
        const { fullName, phoneNumber, emergencyContact, permanentAddress, bloodGroup, aadhaarNumber, agreedToTerms } = req.body;

        // 1. Prevent Duplicates
        const tenantExists = await Tenant.findOne({ aadhaarNumber });
        if (tenantExists) return res.status(400).json({ message: 'Tenant with this Aadhaar already exists' });

        // 2. Upload files directly from Memory to Cloudinary
        let photoUrl = '', aadhaarFrontUrl = '', aadhaarBackUrl = '';

        if (req.files['photo']) {
            photoUrl = await uploadToCloudinary(req.files['photo'][0].buffer, 'pg_photos');
        }
        if (req.files['aadhaarFront']) {
            aadhaarFrontUrl = await uploadToCloudinary(req.files['aadhaarFront'][0].buffer, 'pg_kyc');
        }
        if (req.files['aadhaarBack']) {
            aadhaarBackUrl = await uploadToCloudinary(req.files['aadhaarBack'][0].buffer, 'pg_kyc');
        }

        // 3. Save to Database
        const tenant = await Tenant.create({
            fullName, phoneNumber, emergencyContact, permanentAddress, bloodGroup,
            aadhaarNumber, photoUrl, aadhaarFrontUrl, aadhaarBackUrl,
            agreedToTerms: agreedToTerms === 'true',
            applicationIpAddress: req.ip
        });

        res.status(201).json({ message: 'Application submitted successfully', tenantId: tenant._id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const checkStatus = async (req, res) => {
    try {
        const tenant = await Tenant.findOne({ phoneNumber: req.params.phone }).select('fullName status assignedBed');
        if (!tenant || tenant.status === 'Exited') {
            return res.status(404).json({ message: 'Record not found or access denied' });
        }
        res.json({ name: tenant.fullName, status: tenant.status });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { enrollTenant, checkStatus };