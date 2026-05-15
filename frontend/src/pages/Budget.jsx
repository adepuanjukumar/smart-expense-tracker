import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import Spinner from '../components/Spinner';
import { formatCurrency } from '../utils/formatCurrency';
import { motion } from 'framer-motion';
import { AlertTriangle, TrendingDown } from 'lucide-react';

const Budget = () => {
    const [budget, setBudget] = useState(null);
    const [spent, setSpent] = useState(0);
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(true);
    const { user } = useSelector(state => state.auth);

    useEffect(() => {
        if (user) {
            Promise.all([
                axios.get(${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/budget', { headers: { Authorization: `Bearer ${user.token}` } }),
                axios.get(${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/expenses', { headers: { Authorization: `Bearer ${user.token}` } })
            ]).then(([budRes, expRes]) => {
                if (budRes.data.length > 0) setBudget(budRes.data[0]);
                // Calculate total spent strictly during this specific active month
                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();
                const monthlySpent = expRes.data.filter(e => {
                    const d = new Date(e.date);
                    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                }).reduce((acc, curr) => acc + curr.amount, 0);
                setSpent(monthlySpent);
                setLoading(false);
            }).catch(err => { console.error(err); setLoading(false); });
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const currentMonth = new Date().getMonth() + 1;
            const currentYear = new Date().getFullYear();
            const res = await axios.post(${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/budget', {
                monthlyBudget: amount, month: currentMonth, year: currentYear
            }, { headers: { Authorization: `Bearer ${user.token}` } });
            setBudget(res.data);
            setAmount('');
            toast.success('Budget Threshold Authenticated!');
        } catch (err) {
            toast.error('Sever failed to encode budget');
        }
    };

    if (loading) return <Spinner />;

    const usagePercent = budget ? Math.min((spent / budget.monthlyBudget) * 100, 100) : 0;
    const isDanger = usagePercent >= 90;
    const isWarning = usagePercent >= 75 && usagePercent < 90;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-5xl mx-auto xl:mt-12">
            <div className="text-center mb-10">
                <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Active Budget Constraints</h1>
                <p className="text-slate-500 mt-2 text-lg">Manage your monthly spending caps to ensure calculated financial growth.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-800 p-8 sm:p-12 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-700 w-full relative overflow-hidden flex flex-col justify-center transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                    <div className="absolute -left-12 -bottom-12 bg-primary-100 dark:bg-primary-900/30 w-48 h-48 rounded-full blur-3xl"></div>

                    <h2 className="text-lg font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest relative">My Monthly Metric</h2>
                    <p className="text-[3.5rem] leading-[1.1] font-black text-primary-600 mb-8 tracking-tighter relative">
                        {budget ? formatCurrency(budget.monthlyBudget) : 'Not Enforced'}
                    </p>

                    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 relative">
                        <div className="relative flex-1">
                            <span className="absolute left-5 top-4 text-slate-500 font-extrabold text-lg">₹</span>
                            <input type="number" placeholder="Enter new limit..." value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full pl-11 p-4 bg-slate-50 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all font-bold text-lg placeholder-slate-400" required />
                        </div>
                        <button className="px-8 py-4 bg-slate-900 hover:bg-slate-800 dark:bg-primary-600 dark:hover:bg-primary-700 text-white font-extrabold rounded-2xl shadow-xl shadow-slate-900/20 dark:shadow-primary-900/40 transition-all hover:-translate-y-0.5">Enforce</button>
                    </form>
                </div>

                {budget && (
                    <div className="bg-white dark:bg-slate-800 p-8 sm:p-12 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-700 flex flex-col justify-center transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-8 flex items-center gap-2">
                            <TrendingDown className="text-slate-400" size={24} /> Current Burn Rate
                        </h2>

                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <p className="text-slate-500 dark:text-slate-400 font-bold text-sm tracking-wide uppercase mb-1">Spent this month</p>
                                <p className={`text-4xl font-black tracking-tight ${isDanger ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>{formatCurrency(spent)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-slate-500 dark:text-slate-400 font-bold text-sm tracking-wide uppercase mb-1">Remaining Vault</p>
                                <p className="text-2xl font-extrabold text-accent-green">{formatCurrency(budget.monthlyBudget - spent > 0 ? budget.monthlyBudget - spent : 0)}</p>
                            </div>
                        </div>

                        {/* Advanced Animated Progress Bar */}
                        <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-10 mb-5 overflow-hidden shadow-inner relative flex items-center p-1 border border-slate-200 dark:border-slate-800">
                            <motion.div
                                initial={{ width: 0 }} animate={{ width: `${usagePercent}%` }} transition={{ duration: 1.2, type: 'spring', bounce: 0.2 }}
                                className={`h-full rounded-full relative overflow-hidden shadow-lg ${isDanger ? 'bg-gradient-to-r from-red-500 to-red-600' : isWarning ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-primary-500 to-primary-600'}`}
                            >
                                <div className="absolute inset-0 bg-white/20" style={{ backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)', backgroundSize: '1rem 1rem' }}></div>
                            </motion.div>
                        </div>

                        <div className="flex justify-between items-center px-1">
                            <p className="text-slate-500 font-bold text-sm tracking-widest">{usagePercent.toFixed(1)}% CONSUMED</p>
                            {isDanger && <span className="flex items-center gap-1.5 text-red-500 text-xs font-extrabold bg-red-50 border border-red-200 dark:border-red-500/30 dark:bg-red-900/30 px-3 py-1.5 rounded-full animate-pulse"><AlertTriangle size={14} /> LIMIT CRITICAL EXCEEDED</span>}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};
export default Budget;
