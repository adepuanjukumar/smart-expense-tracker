import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login, reset } from '../features/auth/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { Mail, Lock, TrendingUp, Eye, EyeOff } from 'lucide-react';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPass, setShowPass] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isLoading } = useSelector(state => state.auth);

    const handleLogin = (e) => {
        e.preventDefault();
        dispatch(login(formData)).then(res => {
            if (!res.error) {
                navigate('/');
            } else {
                toast.error(res.payload || 'Login failed. Please check your credentials.');
            }
            dispatch(reset());
        });
    };

    return (
        <div className="min-h-screen flex">
            {/* Left panel */}
            <div className="hidden lg:flex flex-col justify-center items-center flex-1 bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-700 p-12 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-white blur-3xl" />
                    <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-violet-300 blur-3xl" />
                </div>
                <div className="relative z-10 text-center text-white max-w-md">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-6 border border-white/30">
                        <TrendingUp size={32} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold mb-4 leading-tight">Smart Expense Tracker</h1>
                    <p className="text-violet-200 text-base leading-relaxed mb-8">
                        Take control of your finances. Track expenses, manage income, and achieve your savings goals with ease.
                    </p>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        {[
                            { label: 'Track', emoji: '📊' },
                            { label: 'Save', emoji: '💰' },
                            { label: 'Grow', emoji: '📈' },
                        ].map(item => (
                            <div key={item.label} className="p-3 rounded-xl bg-white/10 border border-white/20">
                                <div className="text-2xl mb-1">{item.emoji}</div>
                                <p className="text-xs font-semibold text-violet-100">{item.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right panel */}
            <div className="flex-1 flex items-center justify-center bg-white dark:bg-[#0f1117] p-6 sm:p-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-sm"
                >
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center gap-2 mb-8">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                            <TrendingUp size={18} className="text-white" />
                        </div>
                        <span className="font-bold text-slate-800 dark:text-white text-[15px]">Expense Tracker</span>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Welcome back</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5">Sign in to your account to continue</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="form-label">Email Address</label>
                            <div className="relative">
                                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="email" placeholder="you@example.com"
                                    className="form-input pl-10"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="form-label">Password</label>
                            <div className="relative">
                                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    className="form-input pl-10 pr-10"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(s => !s)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                >
                                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm mt-2"
                        >
                            {isLoading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <p className="text-center mt-6 text-sm text-slate-500 dark:text-slate-400">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-violet-600 dark:text-violet-400 font-semibold hover:text-violet-700 dark:hover:text-violet-300 transition-colors">
                            Create one
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
