import { useState } from 'react';
// import axios from 'axios';
import { UploadCloud, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import axios from '../api'; // Use our new central API

const Enrollment = () => {
    const [formData, setFormData] = useState({
        fullName: '', phoneNumber: '', emergencyContact: '',
        permanentAddress: '', bloodGroup: '', aadhaarNumber: '',
        agreedToTerms: false
    });

    const [files, setFiles] = useState({
        photo: null, aadhaarFront: null, aadhaarBack: null
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    
    // NEW: Policy Modal State
    const [showPolicyModal, setShowPolicyModal] = useState(false);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    };

    const handleFileChange = (e) => {
        setFiles({ ...files, [e.target.name]: e.target.files[0] });
    };

    // NEW: Handle Terms Checkbox Logic
    const handleTermsChange = (e) => {
        if (e.target.checked) {
            // If they try to check it, open the modal instead
            setShowPolicyModal(true);
        } else {
            // If it's already checked and they click it, just uncheck it normally
            setFormData({ ...formData, agreedToTerms: false });
        }
    };

    const acceptTerms = () => {
        setFormData({ ...formData, agreedToTerms: true });
        setShowPolicyModal(false);
    };

    // const handleSubmit = async (e) => {
    //     e.preventDefault();
    //     setLoading(true);
    //     setMessage('');

    //     const data = new FormData();
    //     Object.keys(formData).forEach(key => data.append(key, formData[key]));
    //     Object.keys(files).forEach(key => {
    //         if (files[key]) data.append(key, files[key]);
    //     });

    //     try {
    //         await axios.post('http://localhost:5000/api/tenant/enroll', data, {
    //             headers: { 'Content-Type': 'multipart/form-data' }
    //         });
    //         setMessage('✅ Application submitted successfully! Please wait for admin approval.');
    //         setFormData({ fullName: '', phoneNumber: '', emergencyContact: '', permanentAddress: '', bloodGroup: '', aadhaarNumber: '', agreedToTerms: false });
    //         setFiles({ photo: null, aadhaarFront: null, aadhaarBack: null });
    //     } catch (error) {
    //         setMessage('❌ Error: ' + (error.response?.data?.message || 'Something went wrong.'));
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // NEW: Manually check if terms are agreed to before doing anything
        if (!formData.agreedToTerms) {
            setMessage('❌ You must read and agree to the PG Rules to submit your application.');
            return;
        }

        setLoading(true);
        setMessage('');

        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));
        Object.keys(files).forEach(key => {
            if (files[key]) data.append(key, files[key]);
        });

        try {
            await axios.post('/api/tenant/enroll', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage('✅ Application submitted successfully! Please wait for admin approval.');
            setFormData({ fullName: '', phoneNumber: '', emergencyContact: '', permanentAddress: '', bloodGroup: '', aadhaarNumber: '', agreedToTerms: false });
            setFiles({ photo: null, aadhaarFront: null, aadhaarBack: null });
        } catch (error) {
            setMessage('❌ Error: ' + (error.response?.data?.message || 'Something went wrong.'));
        } finally {
            setLoading(false);
        }
    };

    const FileUploadInput = ({ label, name, file }) => (
        <div className="flex flex-col">
            <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
            <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${file ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-indigo-400'}`}>
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {file ? (
                        <>
                            <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />
                            <p className="text-sm font-semibold text-emerald-700 truncate px-4">{file.name}</p>
                        </>
                    ) : (
                        <>
                            <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                            <p className="text-sm text-slate-500 font-medium">Click to upload</p>
                            <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 5MB</p>
                        </>
                    )}
                </div>
                <input type="file" name={name} accept="image/*" onChange={handleFileChange} required className="hidden" />
            </label>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8 font-sans flex items-center justify-center relative">
            <div className="max-w-3xl w-full bg-white shadow-2xl rounded-3xl overflow-hidden border border-slate-100">
                
                <div className="bg-slate-900 px-8 py-10 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"></div>
                    <h2 className="text-3xl font-black text-white tracking-tight">Boys PG Application</h2>
                    <p className="mt-2 text-slate-400 font-medium">Fill out the details below to request a bed assignment.</p>
                </div>

                <div className="p-8">
                    {message && (
                        <div className={`flex items-center p-4 mb-8 rounded-xl ${message.startsWith('✅') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                            {message.startsWith('✅') ? <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />}
                            <span className="font-semibold">{message}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Personal Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                                    <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} required className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="Enter your full name" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Phone Number</label>
                                    <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} required className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="10-digit mobile number" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Emergency Contact</label>
                                    <input type="tel" name="emergencyContact" value={formData.emergencyContact} onChange={handleInputChange} required className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="Parent/Guardian number" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Blood Group</label>
                                    <input type="text" name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="e.g., O+" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Permanent Address</label>
                                    <textarea name="permanentAddress" value={formData.permanentAddress} onChange={handleInputChange} required rows="3" className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none" placeholder="Enter your full home address"></textarea>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Identity Verification</h3>
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Aadhaar Number</label>
                                <input type="text" name="aadhaarNumber" value={formData.aadhaarNumber} onChange={handleInputChange} required className="w-full md:w-1/2 px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all tracking-widest" placeholder="XXXX XXXX XXXX" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <FileUploadInput label="Passport Photo" name="photo" file={files.photo} />
                                <FileUploadInput label="Aadhaar Front" name="aadhaarFront" file={files.aadhaarFront} />
                                <FileUploadInput label="Aadhaar Back" name="aadhaarBack" file={files.aadhaarBack} />
                            </div>
                        </div>

                        {/* UPDATED: Legal Consent Checkbox */}
                        <div className="flex items-start bg-indigo-50 p-5 rounded-xl border border-indigo-100">
                            <div className="flex items-center h-5 mt-0.5">
                                <input 
                                    type="checkbox" 
                                    checked={formData.agreedToTerms} 
                                    onChange={handleTermsChange} // Calls our new logic instead of standard input change
                                    required 
                                    className="w-5 h-5 text-indigo-600 bg-white border-slate-300 rounded focus:ring-indigo-500 focus:ring-2 cursor-pointer" 
                                />
                            </div>
                            <label onClick={() => !formData.agreedToTerms && setShowPolicyModal(true)} className="ml-3 text-sm text-indigo-900 font-medium cursor-pointer select-none">
                                I have read and agree to abide by the <span className="text-indigo-600 font-bold underline">PG Rules, Privacy Policy, and Rent Agreement</span>.
                            </label>
                        </div>

                        <button type="submit" disabled={loading} onClick={handleSubmit} className={`w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg text-base font-bold text-white transition-all transform ${loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-indigo-600 hover:-translate-y-1 hover:shadow-xl'}`}>
                            {loading ? 'Uploading Documents & Submitting...' : 'Submit Application Form'}
                        </button>
                    </form>
                </div>
            </div>

            {/* NEW: Custom Policy Box Modal */}
            {showPolicyModal && (
                <div className="fixed inset-0 bg-slate-900 bg-opacity-75 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] transform transition-all">
                        
                        <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center space-x-3">
                            <FileText className="text-indigo-600 w-6 h-6" />
                            <h3 className="text-xl font-bold text-slate-800">PG Rules & Policies</h3>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1 text-slate-600 space-y-5 text-sm">
                            <div>
                                <h4 className="font-bold text-slate-800 text-base mb-1">1. Rent & Security Deposit</h4>
                                <p>Monthly rent must be paid strictly on or before the 5th of every month. The security deposit is fully refundable only if a 30-day exit notice is provided.</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 text-base mb-1">2. Gate Timings</h4>
                                <p>The main gate closes at 10:30 PM. Late entries are strictly prohibited without prior approval from the warden or management.</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 text-base mb-1">3. Visitors Policy</h4>
                                <p>Outside guests and friends are not allowed inside the rooms. Visitors must be entertained only in the designated common lounge areas.</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 text-base mb-1">4. Property Damage</h4>
                                <p>Any damage caused to PG property, including beds, cupboards, or appliances, will be repaired at the tenant's expense and deducted directly from the security deposit.</p>
                            </div>
                            <div className="bg-indigo-50 p-4 rounded-lg mt-6 border border-indigo-100">
                                <p className="font-semibold text-indigo-900 text-center">By clicking "I Agree", you legally accept these terms and confirm all submitted identity documents are valid.</p>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end space-x-3">
                            <button 
                                type="button" 
                                onClick={() => setShowPolicyModal(false)} 
                                className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-100 transition-colors"
                            >
                                Decline
                            </button>
                            <button 
                                type="button" 
                                onClick={acceptTerms} 
                                className="px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md"
                            >
                                I Agree
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default Enrollment;