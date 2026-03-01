import { useState, useEffect } from 'react';
// import axios from 'axios';
import axios from '../api'; // Use our new central API
import { useNavigate } from 'react-router-dom';
import { 
  Users, Home, FileText, LogOut, CheckCircle, 
  XCircle, Plus, Search, Filter, Eye, DollarSign, CreditCard, Calendar, Zap, Trash2, PieChart, TrendingUp,
  IndianRupee, History, Download // <-- ADDED DOWNLOAD HERE
} from 'lucide-react';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('tenants');
    const [tenants, setTenants] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [beds, setBeds] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [rentFilter, setRentFilter] = useState('All');
    const [ebFilter, setEbFilter] = useState('All'); 
    const [floorFilter, setFloorFilter] = useState('All');
    const [txSearchTerm, setTxSearchTerm] = useState('');
    const [txTypeFilter, setTxTypeFilter] = useState('All');
    
    // Exited Tenant Filters
    const [exitedSearchTerm, setExitedSearchTerm] = useState('');
    const [stayDurationFilter, setStayDurationFilter] = useState('All');

    // Modals State
    const [showModal, setShowModal] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [approvalData, setApprovalData] = useState({ bedId: '', securityDeposit: '', monthlyRent: '' });

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentTenant, setPaymentTenant] = useState(null);
    const [paymentData, setPaymentData] = useState({ transactionType: 'Room_Rent', amount: '', paymentMode: 'Cash', transactionReferenceId: '', billingCycle: '' });

    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [checkoutTenantData, setCheckoutTenantData] = useState(null);
    const [showRoomModal, setShowRoomModal] = useState(false);
    const [roomData, setRoomData] = useState({ roomNumber: '', floor: '', roomType: 'Non-AC', totalCapacity: '', defaultRent: '' });
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [detailsTenant, setDetailsTenant] = useState(null);

    useEffect(() => { fetchDashboardData(); }, []);

    const fetchDashboardData = async () => {
        const token = localStorage.getItem('adminToken');
        if (!token) return navigate('/admin');
        try {
            const [tRes, rRes, bRes, txRes] = await Promise.all([
                axios.get('/api/admin/tenants', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('/api/admin/rooms', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('/api/admin/beds', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('/api/admin/transactions', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setTenants(tRes.data); setRooms(rRes.data); setBeds(bRes.data); setTransactions(txRes.data);
            setLoading(false);
        } catch (error) { localStorage.removeItem('adminToken'); navigate('/admin'); }
    };

    const handleBedSelection = (e) => {
        const selectedBedId = e.target.value;
        const selectedBedInfo = beds.find(b => b._id === selectedBedId);
        setApprovalData({
            ...approvalData, bedId: selectedBedId, monthlyRent: selectedBedInfo ? selectedBedInfo.monthlyRentPrice : '' 
        });
    };
    
    const handleApprove = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('adminToken');
        try {
            await axios.post(`/api/admin/approve/${selectedTenant._id}`, approvalData, { headers: { Authorization: `Bearer ${token}` } });
            alert('✅ Tenant Approved & Assigned!');
            setShowModal(false); fetchDashboardData();
        } catch (error) { alert('Error: ' + error.response.data.message); }
    };

    const handleReject = async (tenantId) => {
        if (!window.confirm("Are you sure you want to reject this application?")) return;
        const token = localStorage.getItem('adminToken');
        try {
            await axios.post(`/api/admin/reject/${tenantId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
            fetchDashboardData();
        } catch (error) { alert('Error rejecting application.'); }
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('adminToken');
        try {
            await axios.post('/api/admin/payment', { tenantId: paymentTenant._id, ...paymentData }, { headers: { Authorization: `Bearer ${token}` } });
            setShowPaymentModal(false); fetchDashboardData();
        } catch (error) { alert('Error: ' + error.response.data.message); }
    };

    const handleTransactionTypeChange = (e) => {
        const newType = e.target.value;
        let autoAmount = '';
        if (newType === 'Room_Rent' && paymentTenant?.monthlyRent) {
            autoAmount = paymentTenant.monthlyRent; 
        } 
        setPaymentData(prev => ({ ...prev, transactionType: newType, amount: autoAmount }));
    };

    const handleCheckoutSubmit = async () => {
        const token = localStorage.getItem('adminToken');
        await axios.post(`/api/admin/checkout/${checkoutTenantData._id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
        setShowCheckoutModal(false); fetchDashboardData();
    };

    const handleAddRoom = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('adminToken');
        await axios.post('/api/admin/add-room', { ...roomData, floor: Number(roomData.floor), totalCapacity: Number(roomData.totalCapacity), monthlyRentPrice: Number(roomData.defaultRent) }, { headers: { Authorization: `Bearer ${token}` } });
        setShowRoomModal(false); fetchDashboardData();
    };

    // ACTUAL: Hard Delete logic for exited tenants (Wipes DB and Cloudinary)
    const handleDeleteExitedRecord = async (tenantId) => {
        if (window.confirm("WARNING: Are you sure you want to permanently delete this historical record and their KYC proofs? This cannot be undone.")) {
            const token = localStorage.getItem('adminToken');
            try {
                await axios.delete(`/api/admin/tenant/${tenantId}`, { 
                    headers: { Authorization: `Bearer ${token}` } 
                });
                alert('✅ Record and ID Proofs permanently deleted from database and cloud storage!');
                fetchDashboardData(); // Refresh the table immediately
            } catch (error) {
                alert('❌ Error: ' + (error.response?.data?.message || error.message));
            }
        }
    };

    // 1. UPDATED: Export Active Tenants (Now includes Image URLs)
    const exportActiveTenantsCSV = () => {
        const activeList = tenants.filter(t => t.status === 'Active');
        if (activeList.length === 0) return alert("No active tenants to export.");

        const headers = ['Full Name', 'Phone Number', 'Emergency Contact', 'Blood Group', 'Aadhaar Number', 'Permanent Address', 'Bed/Room', 'Monthly Rent (Rs)', 'Date of Joining', 'Photo URL', 'Aadhaar Front', 'Aadhaar Back'];

        const csvRows = activeList.map(t => [
            `"${t.fullName}"`, `"${t.phoneNumber}"`, `"${t.emergencyContact}"`, `"${t.bloodGroup || 'N/A'}"`, `"${t.aadhaarNumber}"`,
            `"${(t.permanentAddress || '').replace(/\n/g, ' ')}"`, `"${t.assignedBed?.bedNumber || 'N/A'}"`, `"${t.monthlyRent || 0}"`,
            `"${t.dateOfJoining ? new Date(t.dateOfJoining).toLocaleDateString() : 'N/A'}"`,
            `"${t.photoUrl || 'N/A'}"`, `"${t.aadhaarFrontUrl || 'N/A'}"`, `"${t.aadhaarBackUrl || 'N/A'}"`
        ]);

        const csvContent = [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `PG_Active_Tenants_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`);
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    };

    // 2. NEW: Export Exited Tenants
    const exportExitedTenantsCSV = () => {
        const exitedList = tenants.filter(t => t.status === 'Exited');
        if (exitedList.length === 0) return alert("No exited tenants to export.");

        const headers = ['Full Name', 'Phone Number', 'Emergency Contact', 'Aadhaar Number', 'Permanent Address', 'Date Joined', 'Date Exited', 'Total Duration (Days)', 'Photo URL', 'Aadhaar Front', 'Aadhaar Back'];

        const csvRows = exitedList.map(t => {
            // Calculate duration for the spreadsheet
            let durationInDays = 'N/A';
            if (t.dateOfJoining && t.dateOfExit) {
                const diffTime = Math.abs(new Date(t.dateOfExit) - new Date(t.dateOfJoining));
                durationInDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }

            return [
                `"${t.fullName}"`, `"${t.phoneNumber}"`, `"${t.emergencyContact}"`, `"${t.aadhaarNumber}"`,
                `"${(t.permanentAddress || '').replace(/\n/g, ' ')}"`,
                `"${t.dateOfJoining ? new Date(t.dateOfJoining).toLocaleDateString() : 'N/A'}"`,
                `"${t.dateOfExit ? new Date(t.dateOfExit).toLocaleDateString() : 'N/A'}"`,
                `"${durationInDays}"`,
                `"${t.photoUrl || 'N/A'}"`, `"${t.aadhaarFrontUrl || 'N/A'}"`, `"${t.aadhaarBackUrl || 'N/A'}"`
            ];
        });

        const csvContent = [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `PG_Exited_Tenants_History_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`);
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    };

    const handleLogout = () => { localStorage.removeItem('adminToken'); navigate('/admin'); };

    // --- FILTERS ---
    const pendingApps = tenants.filter(t => t.status === 'Applied');
    let activeTenants = tenants.filter(t => t.status === 'Active');
    
    if (searchTerm) activeTenants = activeTenants.filter(t => t.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
    if (rentFilter === 'Paid') activeTenants = activeTenants.filter(t => t.paidThisMonth);
    if (rentFilter === 'Unpaid') activeTenants = activeTenants.filter(t => !t.paidThisMonth);
    if (ebFilter === 'Paid') activeTenants = activeTenants.filter(t => t.ebPaidThisMonth);
    if (ebFilter === 'Unpaid') activeTenants = activeTenants.filter(t => !t.ebPaidThisMonth);

    let filteredRooms = rooms;
    if (floorFilter !== 'All') filteredRooms = rooms.filter(r => r.floor.toString() === floorFilter);

    let filteredTx = transactions;
    if (txSearchTerm) filteredTx = filteredTx.filter(tx => tx.tenantId?.fullName?.toLowerCase().includes(txSearchTerm.toLowerCase()));
    if (txTypeFilter !== 'All') filteredTx = filteredTx.filter(tx => tx.transactionType === txTypeFilter);

    // Exited Tenants Processing
    let exitedTenants = tenants.filter(t => t.status === 'Exited').map(t => {
        let durationInDays = 0;
        let durationText = "Unknown";
        if (t.dateOfJoining && t.dateOfExit) {
            const joinDate = new Date(t.dateOfJoining);
            const exitDate = new Date(t.dateOfExit);
            const diffTime = Math.abs(exitDate - joinDate);
            durationInDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (durationInDays < 30) durationText = `${durationInDays} Days`;
            else {
                const months = Math.floor(durationInDays / 30);
                durationText = months === 1 ? '1 Month' : `${months} Months`;
            }
        }
        return { ...t, durationInDays, durationText };
    });

    if (exitedSearchTerm) exitedTenants = exitedTenants.filter(t => t.fullName.toLowerCase().includes(exitedSearchTerm.toLowerCase()));
    if (stayDurationFilter === 'Short') exitedTenants = exitedTenants.filter(t => t.durationInDays <= 90);
    if (stayDurationFilter === 'Long') exitedTenants = exitedTenants.filter(t => t.durationInDays > 90);

    const currentMonthStr = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    const collectedRevenue = transactions.filter(tx => tx.transactionType === 'Room_Rent' && tx.billingCycle === currentMonthStr).reduce((sum, tx) => sum + Number(tx.amount), 0);

    if (loading) return <div className="flex h-screen items-center justify-center font-bold text-indigo-600">Initializing Workspace...</div>;

    return (
        <div className="flex h-screen bg-slate-50 font-sans">
            <div className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl z-10">
                <div className="p-6 text-2xl font-black text-white border-b border-slate-800 tracking-wider">PG MANAGER</div>
                <nav className="flex-1 px-4 py-6 space-y-2">
                    <button onClick={() => setActiveTab('applications')} className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors font-medium ${activeTab === 'applications' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}>
                        <FileText className="w-5 h-5 mr-3" /> Applications {pendingApps.length > 0 && <span className="ml-auto bg-red-500 text-white text-xs py-1 px-2 rounded-full">{pendingApps.length}</span>}
                    </button>
                    <button onClick={() => setActiveTab('tenants')} className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors font-medium ${activeTab === 'tenants' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}>
                        <Users className="w-5 h-5 mr-3" /> Active Tenants
                    </button>
                    <button onClick={() => setActiveTab('rooms')} className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors font-medium ${activeTab === 'rooms' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}>
                        <Home className="w-5 h-5 mr-3" /> Room Inventory
                    </button>
                    <button onClick={() => setActiveTab('transactions')} className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors font-medium ${activeTab === 'transactions' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}>
                        <CreditCard className="w-5 h-5 mr-3" /> Transactions
                    </button>
                    <button onClick={() => setActiveTab('reports')} className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors font-medium ${activeTab === 'reports' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}>
                        <PieChart className="w-5 h-5 mr-3" /> Financial Reports
                    </button>
                    <button onClick={() => setActiveTab('exited')} className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors font-medium ${activeTab === 'exited' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}>
                        <History className="w-5 h-5 mr-3" /> Exited Tenants
                    </button>
                </nav>
                <div className="p-4 border-t border-slate-800">
                    <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-red-400 hover:bg-slate-800 rounded-lg"><LogOut className="w-5 h-5 mr-3" /> Logout</button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <header className="bg-white px-8 py-5 shadow-sm border-b border-slate-200 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-800 capitalize">{activeTab.replace('exited', 'Exited Tenants')}</h2>
                    <div className="flex space-x-6 text-sm font-medium text-slate-500">
                        {/* <p>Monthly Rent Collected: <span className="text-green-600 font-bold">₹{collectedRevenue}</span></p> */}
                        <p>Total Occupancy: <span className="text-indigo-600 font-bold">{activeTenants.length}</span></p>
                    </div>
                </header>

                <div className="p-8">
                    {/* APPLICATIONS */}
                    {activeTab === 'applications' && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-500 text-sm uppercase font-semibold">
                                    <tr><th className="p-4">Applicant</th><th className="p-4">Phone</th><th className="p-4 text-right">Actions</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {pendingApps.map(tenant => (
                                        <tr key={tenant._id} className="hover:bg-slate-50">
                                            <td className="p-4 font-medium text-slate-800">{tenant.fullName}</td>
                                            <td className="p-4 text-slate-600">{tenant.phoneNumber}</td>
                                            <td className="p-4 space-x-2 flex justify-end">
                                                <button onClick={() => { setDetailsTenant(tenant); setShowDetailsModal(true); }} className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-slate-200"><Eye className="w-4 h-4"/></button>
                                                <button onClick={() => handleReject(tenant._id)} className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-red-100 border border-red-200"><Trash2 className="w-4 h-4"/></button>
                                                <button onClick={() => { setSelectedTenant(tenant); setApprovalData({ bedId: '', securityDeposit: '', monthlyRent: '' }); setShowModal(true); }} className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-indigo-700">Approve</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* ACTIVE TENANTS */}
                    {activeTab === 'tenants' && (
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                                <div className="relative flex-1 max-w-sm">
                                    <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                                    <input type="text" placeholder="Search by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Filter className="w-5 h-5 text-slate-400" />
                                    <select value={rentFilter} onChange={(e) => setRentFilter(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 text-sm font-medium outline-none">
                                        <option value="All">Rent: All</option><option value="Paid">Rent: Paid</option><option value="Unpaid">Rent: Unpaid</option>
                                    </select>
                                    <select value={ebFilter} onChange={(e) => setEbFilter(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 text-sm font-medium outline-none">
                                        <option value="All">EB: All</option><option value="Paid">EB: Paid</option><option value="Unpaid">EB: Unpaid</option>
                                    </select>
                                    {/* NEW: EXPORT CSV BUTTON */}
                                    <button onClick={exportActiveTenantsCSV} className="flex items-center bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-emerald-700 transition-colors ml-2">
                                        <Download className="w-4 h-4 mr-2" /> Export CSV
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-slate-500 text-sm uppercase font-semibold">
                                        <tr><th className="p-4">Tenant Info</th><th className="p-4">Bed / Room</th><th className="p-4">Rent Status</th><th className="p-4">EB Status</th><th className="p-4 text-right">Actions</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {activeTenants.map(tenant => (
                                            <tr key={tenant._id} className="hover:bg-slate-50">
                                                <td className="p-4"><p className="font-bold text-slate-800">{tenant.fullName}</p><p className="text-sm text-slate-500">{tenant.phoneNumber}</p></td>
                                                <td className="p-4 font-medium text-slate-700">{tenant.assignedBed?.bedNumber || 'N/A'}</td>
                                                <td className="p-4">
                                                    <p className="text-xs text-slate-500 font-bold mb-1">₹{tenant.monthlyRent}</p>
                                                    {tenant.paidThisMonth ? <span className="inline-flex items-center text-green-700 bg-green-100 px-2 py-1 rounded text-xs font-bold"><CheckCircle className="w-3 h-3 mr-1" /> Paid</span> : <span className="inline-flex items-center text-red-700 bg-red-100 px-2 py-1 rounded text-xs font-bold"><XCircle className="w-3 h-3 mr-1" /> Unpaid</span>}
                                                </td>
                                                <td className="p-4">
                                                    {tenant.ebPaidThisMonth ? <span className="inline-flex items-center text-yellow-700 bg-yellow-100 px-2 py-1 rounded text-xs font-bold"><Zap className="w-3 h-3 mr-1" /> Paid</span> : <span className="inline-flex items-center text-red-700 bg-red-100 px-2 py-1 rounded text-xs font-bold"><XCircle className="w-3 h-3 mr-1" /> Unpaid</span>}
                                                </td>
                                                <td className="p-4 text-right space-x-2 flex justify-end items-center">
                                                    <button onClick={() => { setDetailsTenant(tenant); setShowDetailsModal(true); }} className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-slate-200"><Eye className="w-4 h-4"/></button>
                                                    <button onClick={() => { setPaymentTenant(tenant); setPaymentData({ transactionType: 'Room_Rent', amount: tenant.monthlyRent ? tenant.monthlyRent.toString() : '', paymentMode: 'Cash', transactionReferenceId: '', billingCycle: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }) }); setShowPaymentModal(true); }} className="bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-emerald-600 flex items-center"><DollarSign className="w-4 h-4 mr-1"/> Pay</button>
                                                    <button onClick={() => { setCheckoutTenantData(tenant); setShowCheckoutModal(true); }} className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-red-100 border border-red-200">Exit</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ROOMS */}
                    {activeTab === 'rooms' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                                <div className="flex items-center space-x-2">
                                    <Filter className="w-5 h-5 text-slate-400" />
                                    <select value={floorFilter} onChange={(e) => setFloorFilter(e.target.value)} className="border border-slate-300 rounded-lg px-4 py-2 bg-slate-50 font-medium text-slate-700 outline-none">
                                        <option value="All">All Floors</option>
                                        {[...new Set(rooms.map(r => r.floor))].map(f => <option key={f} value={f}>Floor {f}</option>)}
                                    </select>
                                </div>
                                <button onClick={() => setShowRoomModal(true)} className="flex items-center bg-indigo-600 text-white px-5 py-2 rounded-lg font-bold shadow-md hover:bg-indigo-700"><Plus className="w-5 h-5 mr-2" /> Add Room</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredRooms.map(room => (
                                    <div key={room._id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                                        <div className="bg-slate-800 px-4 py-3 flex justify-between items-center"><h3 className="text-white font-bold text-lg">Room {room.roomNumber}</h3><span className="bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded-md font-bold uppercase">{room.roomType}</span></div>
                                        <div className="p-4 flex-grow grid grid-cols-2 gap-3">
                                            {room.beds.map(bed => (
                                                <div key={bed._id} className={`p-3 rounded-lg border text-center ${bed.isOccupied ? 'bg-indigo-50 border-indigo-200' : 'bg-green-50 border-green-200'}`}>
                                                    <p className={`text-xs font-bold mb-1 ${bed.isOccupied ? 'text-indigo-800' : 'text-green-700'}`}>Bed {bed.bedNumber.split('-')[1]}</p>
                                                    {bed.isOccupied ? <p className="text-[10px] font-semibold text-slate-600 truncate">{bed.currentTenant?.fullName}</p> : <span className="text-[10px] bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-bold">Vacant</span>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TRANSACTIONS */}
                    {activeTab === 'transactions' && (
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                                    <input type="text" placeholder="Search tenant name..." value={txSearchTerm} onChange={(e) => setTxSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Filter className="w-5 h-5 text-slate-400" />
                                    <select value={txTypeFilter} onChange={(e) => setTxTypeFilter(e.target.value)} className="border border-slate-300 rounded-lg px-4 py-2 bg-slate-50 font-medium text-slate-700 outline-none">
                                        <option value="All">All Transactions</option>
                                        <option value="Room_Rent">Room Rent</option>
                                        <option value="Security_Deposit">Security Deposit</option>
                                        <option value="Current_Bill">Current Bill</option>
                                    </select>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-slate-500 text-sm uppercase font-semibold">
                                        <tr><th className="p-4">Date & Month</th><th className="p-4">Tenant Name</th><th className="p-4">Category</th><th className="p-4">Amount</th><th className="p-4">Mode / Ref</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {filteredTx.map(tx => (
                                            <tr key={tx._id} className="hover:bg-slate-50">
                                                <td className="p-4"><p className="font-bold text-slate-800">{new Date(tx.createdAt || tx.paymentDate).toLocaleDateString()}</p><p className="text-xs text-slate-500 flex items-center mt-1"><Calendar className="w-3 h-3 mr-1"/> {tx.billingCycle}</p></td>
                                                <td className="p-4 font-semibold text-indigo-700">{tx.tenantId?.fullName || 'Unknown Tenant'}</td>
                                                <td className="p-4"><span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-bold uppercase">{tx.transactionType.replace('_', ' ')}</span></td>
                                                <td className="p-4 font-black text-emerald-600">₹{tx.amount}</td>
                                                <td className="p-4"><p className="font-bold text-slate-800">{tx.paymentMode}</p>{tx.transactionReferenceId && <p className="text-xs text-slate-500 mt-1">Ref: {tx.transactionReferenceId}</p>}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* FINANCIAL REPORTS */}
                    {activeTab === 'reports' && (() => {
                        const lifetimeRevenue = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
                        const lifetimeRent = transactions.filter(tx => tx.transactionType === 'Room_Rent').reduce((sum, tx) => sum + Number(tx.amount), 0);
                        const lifetimeEB = transactions.filter(tx => tx.transactionType === 'Current_Bill').reduce((sum, tx) => sum + Number(tx.amount), 0);
                        const lifetimeDeposit = transactions.filter(tx => tx.transactionType === 'Security_Deposit').reduce((sum, tx) => sum + Number(tx.amount), 0);

                        const monthlyData = transactions.reduce((acc, tx) => {
                            if (!acc[tx.billingCycle]) acc[tx.billingCycle] = { rent: 0, eb: 0, total: 0 };
                            if (tx.transactionType === 'Room_Rent') acc[tx.billingCycle].rent += Number(tx.amount);
                            if (tx.transactionType === 'Current_Bill') acc[tx.billingCycle].eb += Number(tx.amount);
                            acc[tx.billingCycle].total += Number(tx.amount);
                            return acc;
                        }, {});

                        return (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-xl shadow-lg text-white">
                                        <p className="text-indigo-100 text-sm font-bold uppercase tracking-wider mb-1">Lifetime Revenue</p>
                                        <h3 className="text-3xl font-black flex items-center"><IndianRupee className="w-6 h-6 mr-1 opacity-70"/>{lifetimeRevenue}</h3>
                                    </div>
                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                        <p className="text-slate-500 text-sm font-bold uppercase mb-1">Total Rent</p>
                                        <h3 className="text-2xl font-black text-slate-800 flex items-center"><Home className="w-5 h-5 mr-2 text-indigo-500"/> ₹{lifetimeRent}</h3>
                                    </div>
                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                        <p className="text-slate-500 text-sm font-bold uppercase mb-1">Total EB / Bills</p>
                                        <h3 className="text-2xl font-black text-slate-800 flex items-center"><Zap className="w-5 h-5 mr-2 text-yellow-500"/> ₹{lifetimeEB}</h3>
                                    </div>
                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                        <p className="text-slate-500 text-sm font-bold uppercase mb-1">Deposits Held</p>
                                        <h3 className="text-2xl font-black text-slate-800 flex items-center"><CheckCircle className="w-5 h-5 mr-2 text-emerald-500"/> ₹{lifetimeDeposit}</h3>
                                    </div>
                                </div>
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-8">
                                    <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center">
                                        <TrendingUp className="text-indigo-600 w-5 h-5 mr-2" />
                                        <h3 className="font-bold text-slate-800 text-lg">Monthly Performance Log</h3>
                                    </div>
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 text-slate-500 text-sm uppercase font-semibold">
                                            <tr>
                                                <th className="p-4">Billing Month</th>
                                                <th className="p-4">Rent Collected</th>
                                                <th className="p-4">EB Collected</th>
                                                <th className="p-4 text-right">Total Monthly Income</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200">
                                            {Object.keys(monthlyData).length === 0 ? <tr><td colSpan="4" className="p-8 text-center text-slate-500">No financial data yet.</td></tr> : 
                                            Object.keys(monthlyData).sort((a, b) => new Date(b) - new Date(a)).map(month => (
                                                <tr key={month} className="hover:bg-slate-50 transition-colors">
                                                    <td className="p-4 font-bold text-slate-800">{month}</td>
                                                    <td className="p-4 font-medium text-indigo-600">₹{monthlyData[month].rent}</td>
                                                    <td className="p-4 font-medium text-yellow-600">₹{monthlyData[month].eb}</td>
                                                    <td className="p-4 font-black text-emerald-600 text-right text-lg">₹{monthlyData[month].total}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })()}

                    {/* === NEW VIEW: EXITED TENANTS === */}
                    {activeTab === 'exited' && (
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                                <div className="relative flex-1 max-w-sm">
                                    <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                                    <input type="text" placeholder="Search past tenants..." value={exitedSearchTerm} onChange={(e) => setExitedSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Filter className="w-5 h-5 text-slate-400" />
                                    <select value={stayDurationFilter} onChange={(e) => setStayDurationFilter(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 text-sm font-medium outline-none">
                                        <option value="All">Duration: All</option>
                                        <option value="Short">Short Stay (&le; 3 Months)</option>
                                        <option value="Long">Long Stay (&gt; 3 Months)</option>
                                    </select>
                                    <button onClick={exportExitedTenantsCSV} className="flex items-center bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-slate-900 transition-colors ml-2">
                                        <Download className="w-4 h-4 mr-2" /> Export History
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-slate-500 text-sm uppercase font-semibold">
                                        <tr>
                                            <th className="p-4">Past Tenant Info</th>
                                            <th className="p-4">Date Joined</th>
                                            <th className="p-4">Date Exited</th>
                                            <th className="p-4">Total Duration</th>
                                            <th className="p-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {exitedTenants.length === 0 ? <tr><td colSpan="5" className="p-8 text-center text-slate-500">No exited tenants found.</td></tr> : 
                                        exitedTenants.map(tenant => (
                                            <tr key={tenant._id} className="hover:bg-slate-50">
                                                <td className="p-4">
                                                    <p className="font-bold text-slate-800">{tenant.fullName}</p>
                                                    <p className="text-sm text-slate-500">{tenant.phoneNumber}</p>
                                                </td>
                                                <td className="p-4 text-sm font-medium text-slate-700">
                                                    {tenant.dateOfJoining ? new Date(tenant.dateOfJoining).toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td className="p-4 text-sm font-medium text-slate-700">
                                                    {tenant.dateOfExit ? new Date(tenant.dateOfExit).toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td className="p-4">
                                                    <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100">
                                                        {tenant.durationText}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right space-x-2 flex justify-end items-center">
                                                    <button onClick={() => { setDetailsTenant(tenant); setShowDetailsModal(true); }} className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-slate-200"><Eye className="w-4 h-4"/></button>
                                                    <button onClick={() => handleDeleteExitedRecord(tenant._id)} className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-red-100 border border-red-200"><Trash2 className="w-4 h-4"/></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* === ALL MODALS === */}
            {/* 1. Tenant Details / KYC Modal */}
            {showDetailsModal && detailsTenant && (
                <div className="fixed inset-0 bg-[#000000ba] bg-opacity-60 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center border-b pb-4 mb-6">
                            <h2 className="text-2xl font-bold text-slate-800">Tenant Profile</h2>
                            <button onClick={() => setShowDetailsModal(false)} className="text-slate-400 hover:text-red-500 font-bold text-xl">&times;</button>
                        </div>
                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div>
                                <p className="text-sm text-slate-500 font-bold">Full Name</p>
                                <p className="font-semibold text-lg">{detailsTenant.fullName}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 font-bold">Phone / Emergency</p>
                                <p className="font-semibold">{detailsTenant.phoneNumber} / {detailsTenant.emergencyContact}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 font-bold">Aadhaar Number</p>
                                <p className="font-semibold">{detailsTenant.aadhaarNumber}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 font-bold">Blood Group</p>
                                <p className="font-semibold text-red-600">{detailsTenant.bloodGroup || 'N/A'}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-sm text-slate-500 font-bold">Permanent Address</p>
                                <p className="font-semibold">{detailsTenant.permanentAddress}</p>
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-4 border-t pt-4">Uploaded Documents</h3>
                        <div className="grid grid-cols-3 gap-4">
                            {detailsTenant.photoUrl && <a href={detailsTenant.photoUrl} target="_blank" rel="noreferrer" className="block p-3 bg-indigo-50 border border-indigo-100 rounded text-center text-sm font-bold text-indigo-700 hover:bg-indigo-100">📷 View Photo</a>}
                            {detailsTenant.aadhaarFrontUrl && <a href={detailsTenant.aadhaarFrontUrl} target="_blank" rel="noreferrer" className="block p-3 bg-indigo-50 border border-indigo-100 rounded text-center text-sm font-bold text-indigo-700 hover:bg-indigo-100">💳 Aadhaar Front</a>}
                            {detailsTenant.aadhaarBackUrl && <a href={detailsTenant.aadhaarBackUrl} target="_blank" rel="noreferrer" className="block p-3 bg-indigo-50 border border-indigo-100 rounded text-center text-sm font-bold text-indigo-700 hover:bg-indigo-100">💳 Aadhaar Back</a>}
                        </div>
                    </div>
                </div>
            )}
            
            {/* 2. Approve Modal with AC/Non-AC and Auto-Rent */}
            {showModal && (
                <div className="fixed inset-0 bg-[#000000ba] bg-opacity-60 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl shadow-lg w-96 border-t-4 border-indigo-600">
                        <h2 className="text-xl font-bold mb-4">Approve {selectedTenant?.fullName}</h2>
                        <form onSubmit={handleApprove} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Select Bed</label>
                                <select required className="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-indigo-500" value={approvalData.bedId} onChange={handleBedSelection}>
                                    <option value="">-- Choose an empty bed --</option>
                                    {beds.filter(b => !b.isOccupied).map(b => {
                                        const parentRoom = rooms.find(r => r._id === (b.roomId._id || b.roomId));
                                        return <option key={b._id} value={b._id}>Bed {b.bedNumber} ({parentRoom?.roomType || 'Unknown'})</option>
                                    })}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Monthly Rent</label>
                                <input type="number" placeholder="Rent auto-fills here" required className="w-full p-2 border rounded bg-slate-50" value={approvalData.monthlyRent} onChange={(e) => setApprovalData({...approvalData, monthlyRent: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Security Deposit Collected</label>
                                <input type="number" placeholder="e.g. 5000" required className="w-full p-2 border rounded" onChange={(e) => setApprovalData({...approvalData, securityDeposit: e.target.value})} />
                            </div>
                            <div className="flex justify-end space-x-2 pt-2"><button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-200 rounded font-bold">Cancel</button><button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded font-bold">Confirm</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* 3. Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-[#000000ba] bg-opacity-60 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl shadow-lg w-96 border-t-4 border-emerald-500">
                        <h2 className="text-xl font-bold mb-4 text-emerald-700">Log Payment</h2>
                        <form onSubmit={handlePaymentSubmit} className="space-y-4">
                            <select className="w-full p-2 border rounded" value={paymentData.transactionType} onChange={handleTransactionTypeChange}>
                                <option value="Room_Rent">Room Rent</option>
                                <option value="Current_Bill">Current Bill (Electricity)</option>
                                <option value="Security_Deposit">Security Deposit</option>
                            </select>
                            <input type="number" placeholder="Amount" required className="w-full p-2 border rounded font-bold text-emerald-700 bg-emerald-50" value={paymentData.amount || ''} onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})} />
                            <select className="w-full p-2 border rounded" value={paymentData.paymentMode} onChange={(e) => setPaymentData({...paymentData, paymentMode: e.target.value})}>
                                <option value="Cash">Cash</option><option value="Online">Online (UPI)</option>
                            </select>
                            {paymentData.paymentMode === 'Online' && <input type="text" required className="w-full p-2 border rounded" placeholder="UPI ID" onChange={(e) => setPaymentData({...paymentData, transactionReferenceId: e.target.value})} />}
                            <input type="text" placeholder="Month/Year" className="w-full p-2 border rounded" value={paymentData.billingCycle} onChange={(e) => setPaymentData({...paymentData, billingCycle: e.target.value})} />
                            <div className="flex justify-end space-x-2 pt-2"><button type="button" onClick={() => setShowPaymentModal(false)} className="px-4 py-2 bg-slate-200 rounded font-bold">Cancel</button><button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded font-bold">Save</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* 4. Checkout Modal */}
            {showCheckoutModal && (
                <div className="fixed inset-0 bg-[#000000ba] bg-opacity-60 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl shadow-lg w-96 border-t-4 border-red-600">
                        <h2 className="text-xl font-bold mb-4 text-red-700">Confirm Checkout</h2>
                        <p className="text-slate-700 mb-6">Checkout <strong>{checkoutTenantData?.fullName}</strong> and free up their bed?</p>
                        <div className="flex justify-end space-x-2"><button onClick={() => setShowCheckoutModal(false)} className="px-4 py-2 bg-slate-200 rounded font-bold">Cancel</button><button onClick={handleCheckoutSubmit} className="px-4 py-2 bg-red-600 text-white rounded font-bold">Confirm</button></div>
                    </div>
                </div>
            )}

            {/* 5. Add Room Modal */}
            {showRoomModal && (
                <div className="fixed inset-0 bg-[#000000ba] bg-opacity-60 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl shadow-lg w-96 border-t-4 border-indigo-600">
                        <h2 className="text-xl font-bold mb-4 text-indigo-700">Add New Room</h2>
                        <form onSubmit={handleAddRoom} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <input type="text" required placeholder="Room Number" className="w-full p-2 border rounded" value={roomData.roomNumber} onChange={(e) => setRoomData({...roomData, roomNumber: e.target.value})} />
                                <input type="number" required placeholder="Floor" className="w-full p-2 border rounded" value={roomData.floor} onChange={(e) => setRoomData({...roomData, floor: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <select className="w-full p-2 border rounded" value={roomData.roomType} onChange={(e) => setRoomData({...roomData, roomType: e.target.value})}>
                                    <option value="Non-AC">Non-AC</option><option value="AC">AC</option>
                                </select>
                                <input type="number" required max="8" placeholder="Total Beds" className="w-full p-2 border rounded" value={roomData.totalCapacity} onChange={(e) => setRoomData({...roomData, totalCapacity: e.target.value})} />
                            </div>
                            <input type="number" required placeholder="Default Rent Per Bed" className="w-full p-2 border rounded" value={roomData.defaultRent} onChange={(e) => setRoomData({...roomData, defaultRent: e.target.value})} />
                            <div className="flex justify-end space-x-2 pt-2"><button type="button" onClick={() => setShowRoomModal(false)} className="px-4 py-2 bg-slate-200 rounded font-bold">Cancel</button><button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded font-bold">Save Room</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;