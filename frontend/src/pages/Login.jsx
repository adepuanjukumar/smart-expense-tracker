import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login, reset } from '../features/auth/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isLoading, isError, message } = useSelector(state => state.auth);

    const handleLogin = (e) => {
        e.preventDefault();
        dispatch(login(formData)).then((res) => {
            if (!res.error) {
                navigate('/');
            } else {
                toast.error(res.payload || 'Login failed');
            }
            dispatch(reset());
        });
    };

    return (
        <div className="flex justify-center items-center h-full mt-10">
            <form onSubmit={handleLogin} className="w-full max-w-md p-10 bg-white dark:bg-slate-800 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 dark:border-slate-700 backdrop-blur-lg">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Welcome Back</h2>
                    <p className="text-slate-500 mt-2">Log in to your Smart Expense Tracker</p>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                    <input className="block w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all dark:text-white" type="email" placeholder="you@example.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                    <input className="block w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 transition-all dark:text-white" type="password" placeholder="••••••••" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
                </div>

                <button disabled={isLoading} className="w-full bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold p-3 rounded-lg hover:shadow-lg hover:from-primary-700 hover:to-primary-600 transition-all disabled:opacity-70">
                    {isLoading ? 'Logging in...' : 'Sign In'}
                </button>

                <p className="text-center mt-6 text-sm text-slate-500">
                    Don't have an account? <Link to="/register" className="text-primary-600 font-semibold hover:underline">Sign up</Link>
                </p>
            </form>
        </div>
    );
}

export default Login;
