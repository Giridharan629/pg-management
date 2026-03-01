import { useState } from 'react';
// import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import axios from '../api'; // Use our new central API

const AdminLogin = () => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/api/admin/login', credentials);
            localStorage.setItem('adminToken', res.data.token); // Save secure token
            navigate('/admin/dashboard'); // Redirect to dashboard
        } catch (err) {
            setError('Invalid Admin Credentials');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded shadow-md w-96">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">PG Admin Login</h2>
                {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
                
                <form onSubmit={handleLogin} className="space-y-4">
                    <input 
                        type="text" name="username" placeholder="Admin Username" required
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={handleChange} 
                    />
                    <input 
                        type="password" name="password" placeholder="Password" required
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={handleChange} 
                    />
                    <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 font-bold">
                        Secure Login
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;