const express = require('express');
const router = express.Router();
const protectAdmin = require('../middlewares/authMiddleware');

// Import all functions from the controller
const { 
    adminLogin, approveTenant, logPayment, getTenants, getBeds, 
    checkoutTenant, getTenantTransactions, addRoomWithBeds, getRooms,
    getAllTransactions, rejectTenant, deleteTenant
} = require('../controllers/adminController');

// 1. Public Route
router.post('/login', adminLogin);

// 2. Protected Routes (Dashboard Data)
router.get('/tenants', protectAdmin, getTenants);
router.get('/beds', protectAdmin, getBeds);
router.post('/add-room', protectAdmin, addRoomWithBeds);

// 3. Protected Routes (Ledger & Actions)
router.get('/transactions/:id', protectAdmin, getTenantTransactions); // <--- The route throwing the 404!
router.post('/approve/:id', protectAdmin, approveTenant);
router.post('/payment', protectAdmin, logPayment);
router.post('/checkout/:id', protectAdmin, checkoutTenant);
router.get('/rooms', protectAdmin, getRooms);
router.get('/transactions', protectAdmin, getAllTransactions);
router.post('/reject/:id', protectAdmin, rejectTenant);
router.delete('/tenant/:id', protectAdmin, deleteTenant);



// 4. Temporary Setup Route
// router.post('/setup-beds', protectAdmin, setupBeds);

module.exports = router;