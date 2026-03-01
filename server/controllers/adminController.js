const Tenant = require('../models/Tenant');
const Bed = require('../models/Bed');
const Transaction = require('../models/Transaction');
const jwt = require('jsonwebtoken');
const cloudinary = require('../config/cloudinary'); // Add this near the top
const Room = require('../models/Room')

// @desc    Admin Login
// @route   POST /api/admin/login
const adminLogin = (req, res) => {
    const { username, password } = req.body;

    // Check against the secure environment variables
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        // Generate a token valid for 1 day
        const token = jwt.sign(
            { role: 'admin' }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
        );
        res.json({ message: 'Login successful', token });
    } else {
        res.status(401).json({ message: 'Invalid admin credentials' });
    }
};

// ... keep your existing approveTenant and logPayment functions below ...
const approveTenant = async (req, res) => {
    try {
        // 1. Extract monthlyRent from the frontend request
        const { bedId, securityDeposit, monthlyRent } = req.body;

        const bed = await Bed.findById(bedId);
        if (!bed || bed.isOccupied) return res.status(400).json({ message: 'Bed is unavailable' });

        // 2. Make sure monthlyRent is included in this update object!
        const tenant = await Tenant.findByIdAndUpdate(req.params.id, {
            status: 'Active', 
            assignedBed: bedId, 
            securityDeposit, 
            monthlyRent, // <--- THIS IS CRITICAL
            dateOfJoining: Date.now(), 
            policeVerificationDone: true
        }, { returnDocument: 'after' });

        // Update bed status...
        bed.isOccupied = true;
        bed.currentTenant = tenant._id;
        await bed.save();

        res.json({ message: 'Tenant approved successfully', tenant });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const logPayment = async (req, res) => {
    try {
        const { tenantId, transactionType, amount, paymentMode, transactionReferenceId, billingCycle } = req.body;
        const transaction = await Transaction.create({
            tenantId, transactionType, amount, paymentMode, transactionReferenceId, billingCycle
        });
        res.status(201).json({ message: 'Payment logged securely', transaction });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getTenants = async (req, res) => {
    try {
        const tenants = await Tenant.find().sort({ createdAt: -1 }).populate('assignedBed');
        const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

        const tenantsWithStatus = await Promise.all(tenants.map(async (tenant) => {
            // Check Rent
            const paidThisMonth = await Transaction.exists({
                tenantId: tenant._id, transactionType: 'Room_Rent', billingCycle: currentMonth
            });
            // NEW: Check Electricity Bill (EB)
            const ebPaidThisMonth = await Transaction.exists({
                tenantId: tenant._id, transactionType: 'Current_Bill', billingCycle: currentMonth
            });
            
            return { 
                ...tenant.toObject(), 
                paidThisMonth: !!paidThisMonth,
                ebPaidThisMonth: !!ebPaidThisMonth // Attach EB status
            };
        }));

        res.json(tenantsWithStatus);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getRooms = async (req, res) => {
    try {
        const rooms = await Room.find().sort({ floor: 1, roomNumber: 1 });
        const beds = await Bed.find().populate('currentTenant', 'fullName');
        
        const roomsWithBeds = rooms.map(room => {
            return {
                ...room.toObject(),
                beds: beds.filter(b => b.roomId.toString() === room._id.toString())
            };
        });
        res.json(roomsWithBeds);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getBeds = async (req, res) => {
    try {
        const beds = await Bed.find({ isOccupied: false }); // Only show empty beds
        res.json(beds);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @route   POST /api/admin/checkout/:id
const checkoutTenant = async (req, res) => {
    try {
        const tenantId = req.params.id;
        const tenant = await Tenant.findById(tenantId);
        
        if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

        // 1. Free up the bed first
        if (tenant.assignedBed) {
            await Bed.findByIdAndUpdate(tenant.assignedBed, {
                isOccupied: false,
                currentTenant: null
            }, { returnDocument: 'after' });
        }

        // 2. Archive the tenant legally
        tenant.status = 'Exited';
        tenant.assignedBed = null;
        tenant.dateOfExit = Date.now();
        await tenant.save();

        res.json({ message: 'Tenant successfully checked out. Bed is now available.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Get all transactions for a specific tenant
// @route   GET /api/admin/transactions/:id
const getTenantTransactions = async (req, res) => {
    try {
        // Find all transactions for this tenant ID and sort by newest first
        const transactions = await Transaction.find({ tenantId: req.params.id }).sort({ paymentDate: -1 });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Add a new Room and automatically generate its Beds
// @route   POST /api/admin/add-room
const addRoomWithBeds = async (req, res) => {
    try {
        const { roomNumber, floor, roomType, totalCapacity, monthlyRentPrice } = req.body;

        // 1. Check if room already exists to prevent duplicates
        const existingRoom = await Room.findOne({ roomNumber });
        if (existingRoom) return res.status(400).json({ message: 'Room number already exists!' });

        // 2. Create the Room
        const room = await Room.create({ 
            roomNumber, 
            floor, 
            roomType, 
            totalCapacity 
        });

        // 3. Automatically generate the Beds (A, B, C, D...)
        const bedLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']; // Supports up to 8-sharing
        const bedsToCreate = [];
        
        for (let i = 0; i < totalCapacity; i++) {
            bedsToCreate.push({
                bedNumber: `${roomNumber}-${bedLetters[i]}`,
                roomId: room._id,
                monthlyRentPrice: monthlyRentPrice // Default rent for beds in this room
            });
        }

        await Bed.insertMany(bedsToCreate);

        res.status(201).json({ message: `Room ${roomNumber} and ${totalCapacity} beds added successfully!` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAllTransactions = async (req, res) => {
    try {
        // Fetch all transactions and attach the tenant's full name
        const transactions = await Transaction.find()
            .populate('tenantId', 'fullName')
            .sort({ createdAt: -1 }); // Newest first
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Helper function to extract Cloudinary Public ID from the URL
const extractPublicId = (url) => {
    if (!url) return null;
    // URL looks like: https://res.cloudinary.com/.../upload/v12345/pg_kyc/abc.jpg
    const splitUrl = url.split('/');
    const fileWithExt = splitUrl.slice(-2).join('/'); // gets "pg_kyc/abc.jpg"
    return fileWithExt.split('.')[0]; // gets "pg_kyc/abc"
};

// @desc    Reject a pending application (Hard Delete + Cloudinary Wipe)
// @route   POST /api/admin/reject/:id
const rejectTenant = async (req, res) => {
    try {
        const tenant = await Tenant.findById(req.params.id);
        if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

        // 1. Delete images from Cloudinary to save memory
        if (tenant.photoUrl) await cloudinary.uploader.destroy(extractPublicId(tenant.photoUrl));
        if (tenant.aadhaarFrontUrl) await cloudinary.uploader.destroy(extractPublicId(tenant.aadhaarFrontUrl));
        if (tenant.aadhaarBackUrl) await cloudinary.uploader.destroy(extractPublicId(tenant.aadhaarBackUrl));

        // 2. Permanently delete the record from MongoDB
        await Tenant.findByIdAndDelete(req.params.id);

        res.json({ message: 'Application rejected. All data & images permanently deleted.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteTenant = async (req, res) => {
    try {
        const tenant = await Tenant.findById(req.params.id);
        if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

        // 1. Permanently delete images from Cloudinary to free up memory
        if (tenant.photoUrl) await cloudinary.uploader.destroy(extractPublicId(tenant.photoUrl));
        if (tenant.aadhaarFrontUrl) await cloudinary.uploader.destroy(extractPublicId(tenant.aadhaarFrontUrl));
        if (tenant.aadhaarBackUrl) await cloudinary.uploader.destroy(extractPublicId(tenant.aadhaarBackUrl));

        // 2. Permanently delete the record from MongoDB
        await Tenant.findByIdAndDelete(req.params.id);

        res.json({ message: 'Tenant record and all KYC images permanently deleted.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update your exports to include the new function (you can remove setupBeds if you want!):
module.exports = { 
    adminLogin, approveTenant, logPayment, getTenants, 
    getBeds, checkoutTenant, getTenantTransactions, 
    addRoomWithBeds, getRooms, getAllTransactions, rejectTenant, deleteTenant
};