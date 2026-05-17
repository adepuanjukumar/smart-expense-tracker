import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import API_BASE from '../utils/api';
import { toast } from 'react-toastify';
import { formatCurrency } from '../utils/formatCurrency';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, PieChart, Target, TrendingDown, Zap, Lightbulb, Flame, ShieldCheck } from 'lucide-react';

const TIPS = [
    { emoji: '🎯', title: '50 / 30 / 20 Rule', desc: '50% needs · 30% wants · 20% savings. A simple framework that works for most people.' },
    { emoji: '📊', title: 'Track Every Day', desc: 'Logging expenses daily helps you notice patterns and stay in control of spending habits.' },
    { emoji: '🏦', title: 'Emergency Fund', desc: 'Aim to keep 3–6 months of expenses saved for unexpected situations.' },
    { emoji: '☕', title: 'Small Wins Add Up', desc: 'Cutting one small recurring expense like unused subscriptions can save thousands yearly.' },
    { emoji: '📅', title: 'Monthly Review', desc: 'Spend 10 minutes each month reviewing where your money went. Small adjustments compound!' },
    { emoji: '💡', title: 'Pay Yourself First', desc: 'Transfer your savings the same day you get paid — before spending on anything else.' },
];

const Budget = () => {
    const [budget, setBudget] = useState(null);
    const [spent, setSpent] = useState(0);
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(true);
    const { user } = useSelector(state => state.auth);

    useEffect(() => {
        if (user) {
            Promise.all([
                axios.get(`${API_BASE}/api/budget`, { headers: { Authorization: `Bearer ${user.token}` } }),
                axios.get(`${API_BASE}/api/expenses`, { headers: { Authorization: `Bearer ${user.token}` } }),
            ]).then(([budRes, expRes]) => {
                if (budRes.data.length > 0) setBudget(budRes.data[0]);
                const now = new Date();
                const monthSpent = expRes.data
                    .filter(e => { const d = new Date(e.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })
                    .reduce((acc, e) => acc + e.amount, 0);
                setSpent(monthSpent); setLoading(false);
            }).catch(err => { console.error(err); setLoading(false); });
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const now = new Date();
            const res = await axios.post(`${API_BASE}/api/budget`, {
                monthlyBudget: amount, month: now.getMonth() + 1, year: now.getFullYear(),
            }, { headers: { Authorization: `Bearer ${user.token}` } });
            setBudget(res.data); setAmount(''); toast.success('Budget saved!');
        } catch { toast.error('Failed to save budget'); }
    };

    const pct = budget ? Math.min((spent / budget.monthlyBudget) * 100, 100) : 0;
    const remaining = budget ? Math.max(budget.monthlyBudget - spent, 0) : 0;
    const isDanger = pct >= 90;
    const isWarning = pct >= 70 && pct < 90;
    const isGood = pct < 70;

    const barColor = isDanger ? 'from-rose-500 to-rose-600' : isWarning ? 'from-amber-400 to-orange-500' : 'from-violet-500 to-indigo-600';
    const statusText = isDanger ? 'Over Budget' : isWarning ? 'Getting Close' : 'On Track';
    const StatusIcon = isDanger ? AlertTriangle : isWarning ? Zap : CheckCircle;
    const statusCls = isDanger
        ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20'
        : isWarning
            ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20'
            : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20';

    const monthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    if (loading) return (
        <div className="space-y-4 max-w-4xl mx-auto">
            <div className="skeleton h-6 w-28 rounded" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="skeleton h-56 rounded-2xl" />
                <div className="skeleton h-56 rounded-2xl" />
            </div>
        </div>
    );

    return (
        <div className="space-y-5 max-w-4xl mx-auto">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <PieChart size={18} className="text-violet-600" /> Budgets
                </h1>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Set and track your monthly spending limit</p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Set budget card */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="card p-5 rounded-2xl card-gradient-border">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md">
                            <Target size={17} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-[14px] font-bold text-slate-800 dark:text-white">Monthly Budget</h2>
                            <p className="text-[11px] text-slate-400">{monthName}</p>
                        </div>
                    </div>

                    {/* Current value */}
                    <div className="mb-5 p-4 rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50/50 dark:from-violet-900/15 dark:to-indigo-900/10 border border-violet-100/60 dark:border-violet-800/20">
                        <p className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-widest mb-1">Current Budget</p>
                        {budget ? (
                            <p className="text-3xl font-bold text-slate-800 dark:text-white">{formatCurrency(budget.monthlyBudget)}</p>
                        ) : (
                            <p className="text-xl font-medium text-slate-400 dark:text-slate-500">Not set yet</p>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3">
                        <label className="form-label">{budget ? 'Update Budget' : 'Set Your Budget'}</label>
                        <div className="flex gap-2.5">
                            <div className="relative flex-1">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm pointer-events-none">₹</span>
                                <input type="number" placeholder="e.g. 15000" min="0" step="1"
                                    value={amount} onChange={e => setAmount(e.target.value)}
                                    className="form-input pl-8" required />
                            </div>
                            <button type="submit" className="btn-primary text-[13px] px-5 whitespace-nowrap">{budget ? 'Update' : 'Set'}</button>
                        </div>
                        <p className="text-[11px] text-slate-400">Your total spending limit for the current month.</p>
                    </form>

                    {/* Quick presets */}
                    <div className="mt-4">
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mb-2">Quick presets</p>
                        <div className="flex flex-wrap gap-2">
                            {[5000, 10000, 15000, 20000, 25000].map(v => (
                                <button key={v} type="button" onClick={() => setAmount(String(v))}
                                    className={`text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-all ${Number(amount) === v
                                            ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                                            : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-violet-400'
                                        }`}>
                                    ₹{v.toLocaleString()}
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Progress card */}
                {budget ? (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-5 rounded-2xl">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                    <TrendingDown size={17} className="text-slate-500 dark:text-slate-400" />
                                </div>
                                <div>
                                    <h2 className="text-[14px] font-bold text-slate-800 dark:text-white">This Month's Spending</h2>
                                    <p className="text-[11px] text-slate-400">{monthName}</p>
                                </div>
                            </div>
                            <span className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-full ${statusCls}`}>
                                <StatusIcon size={12} /> {statusText}
                            </span>
                        </div>

                        {/* Amounts */}
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Spent</p>
                                <p className={`text-2xl font-bold ${isDanger ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-white'}`}>{formatCurrency(spent)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Remaining</p>
                                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(remaining)}</p>
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden mb-2">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 1.2, type: 'spring', bounce: 0.2 }}
                                className={`h-full rounded-full bg-gradient-to-r ${barColor} relative overflow-hidden`}
                            >
                                <div className="progress-shimmer absolute inset-0 rounded-full" />
                            </motion.div>
                        </div>
                        <div className="flex justify-between text-[11px] mb-4">
                            <span className="font-semibold text-slate-500 dark:text-slate-400">{pct.toFixed(1)}% used</span>
                            <span className="text-slate-400">of {formatCurrency(budget.monthlyBudget)}</span>
                        </div>

                        {/* Circle progress */}
                        <div className="flex justify-center my-2">
                            <div className="relative w-28 h-28">
                                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                    <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-100 dark:text-slate-800" />
                                    <motion.circle cx="50" cy="50" r="40" fill="none"
                                        stroke={isDanger ? '#f43f5e' : isWarning ? '#f59e0b' : '#8b5cf6'}
                                        strokeWidth="8" strokeLinecap="round"
                                        strokeDasharray={`${2 * Math.PI * 40}`}
                                        initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                                        animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - pct / 100) }}
                                        transition={{ duration: 1.2, delay: 0.2 }}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <p className="text-[20px] font-bold text-slate-800 dark:text-white leading-tight">{Math.round(pct)}%</p>
                                    <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">used</p>
                                </div>
                            </div>
                        </div>

                        {/* Alert */}
                        {isDanger && (
                            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/30 text-rose-700 dark:text-rose-400 mt-2">
                                <AlertTriangle size={14} className="flex-shrink-0" />
                                <p className="text-[11px] font-semibold">You've exceeded your budget this month!</p>
                            </motion.div>
                        )}
                        {isWarning && (
                            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 text-amber-700 dark:text-amber-400 mt-2">
                                <Flame size={14} className="flex-shrink-0" />
                                <p className="text-[11px] font-semibold">You're approaching your monthly limit.</p>
                            </motion.div>
                        )}
                        {isGood && spent > 0 && (
                            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-400 mt-2">
                                <ShieldCheck size={14} className="flex-shrink-0" />
                                <p className="text-[11px] font-semibold">You're well within budget. Keep it up!</p>
                            </motion.div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                        className="card p-5 rounded-2xl flex flex-col items-center justify-center text-center min-h-[200px] gap-3">
                        <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2.5 }}
                            className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                            <PieChart size={22} className="text-slate-400" />
                        </motion.div>
                        <p className="text-[14px] font-semibold text-slate-600 dark:text-slate-400">No budget set</p>
                        <p className="text-[11px] text-slate-400 max-w-[200px] leading-relaxed">Set a budget on the left to start tracking your monthly spending.</p>
                    </motion.div>
                )}
            </div>

            {/* Tips grid */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="card p-5 rounded-2xl">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <Lightbulb size={14} className="text-amber-600 dark:text-amber-400" />
                    </div>
                    <h2 className="text-[14px] font-bold text-slate-800 dark:text-white">Budgeting Tips</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {TIPS.map((tip, i) => (
                        <motion.div key={tip.title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.06 }}
                            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-violet-200 dark:hover:border-violet-800/40 transition-colors">
                            <div className="text-xl mb-2">{tip.emoji}</div>
                            <p className="text-[13px] font-semibold text-slate-800 dark:text-white mb-1">{tip.title}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{tip.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default Budget;
