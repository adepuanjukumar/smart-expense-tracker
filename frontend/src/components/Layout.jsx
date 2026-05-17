import { Outlet, Link, useNavigate, useLocation, useOutlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout, reset } from '../features/auth/authSlice';
import ThemeToggle from './ThemeToggle';
import {
    LayoutDashboard, Receipt, Wallet, PieChart,
    Menu, X, LogOut, Bell, Search, TrendingUp,
    ChevronLeft, User, Settings, HelpCircle,
    Sparkles, CreditCard, ShieldCheck, Target,
    AlertTriangle, Zap, MessageCircle, Mail,
    BookOpen, ChevronDown, ChevronRight, Lock,
    Moon, Globe, Palette, Check, ExternalLink,
    TrendingDown, PiggyBank, BarChart3
} from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import API_BASE from '../utils/api';
import { formatCurrency } from '../utils/formatCurrency';

/* ── nav links ── */
const navLinks = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Expenses', path: '/expenses', icon: Receipt },
    { name: 'Income', path: '/income', icon: Wallet },
    { name: 'Budgets', path: '/budget', icon: PieChart },
];

const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 5) return 'Good Night';
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
};

const NOTIFICATIONS = [
    { id: 1, icon: TrendingUp, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20', title: 'Budget goal reached!', sub: 'You saved ₹5,000 this month', time: '2m ago' },
    { id: 2, icon: CreditCard, color: 'text-rose-500 bg-rose-50 dark:bg-rose-900/20', title: 'High expense detected', sub: 'Shopping: ₹3,200 today', time: '1h ago' },
    { id: 3, icon: ShieldCheck, color: 'text-violet-500 bg-violet-50 dark:bg-violet-900/20', title: 'Account is secure', sub: 'All systems running normally', time: '3h ago' },
];

const useOutsideClick = (ref, handler) => {
    useEffect(() => {
        const fn = (e) => { if (!ref.current || ref.current.contains(e.target)) return; handler(); };
        document.addEventListener('mousedown', fn);
        return () => document.removeEventListener('mousedown', fn);
    }, [ref, handler]);
};

/* ══════════════════════════════════════════════
   AI INSIGHTS MODAL
══════════════════════════════════════════════ */
const AIInsightsModal = ({ onClose, user }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        Promise.all([
            axios.get(`${API_BASE}/api/expenses`, { headers: { Authorization: `Bearer ${user.token}` } }),
            axios.get(`${API_BASE}/api/income`, { headers: { Authorization: `Bearer ${user.token}` } }),
        ]).then(([expR, incR]) => {
            const expenses = expR.data;
            const incomes = incR.data;
            const totalInc = incomes.reduce((s, i) => s + i.amount, 0);
            const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
            const balance = totalInc - totalExp;
            const savingsRate = totalInc > 0 ? ((balance / totalInc) * 100).toFixed(1) : 0;
            const spendingRatio = totalInc > 0 ? ((totalExp / totalInc) * 100).toFixed(1) : 0;

            /* Top category */
            const catMap = expenses.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc; }, {});
            const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];

            /* Biggest expense */
            const bigExp = expenses.reduce((max, e) => e.amount > (max?.amount || 0) ? e : max, null);

            /* This month */
            const now = new Date();
            const monthExp = expenses.filter(e => { const d = new Date(e.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).reduce((s, e) => s + e.amount, 0);
            const monthInc = incomes.filter(i => { const d = new Date(i.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).reduce((s, i) => s + i.amount, 0);

            /* Generate insights */
            const insights = [];
            if (totalInc === 0) {
                insights.push({ type: 'info', icon: Zap, title: 'Add your income first', desc: 'Track your income sources to unlock personalised insights about your financial health.' });
            } else {
                if (spendingRatio > 90)
                    insights.push({ type: 'danger', icon: AlertTriangle, title: 'Critical: Very high spending', desc: `You're spending ${spendingRatio}% of your income. Immediately look for expenses to cut — try cancelling unused subscriptions or reducing dining out.` });
                else if (spendingRatio > 70)
                    insights.push({ type: 'warning', icon: AlertTriangle, title: 'Spending is high', desc: `You're spending ${spendingRatio}% of your income. The recommended limit is 70–80%. Consider tracking daily spending and setting category limits.` });
                else
                    insights.push({ type: 'success', icon: Check, title: 'Great spending control!', desc: `You're spending only ${spendingRatio}% of your income. You're well within healthy range. Keep this habit up!` });

                if (savingsRate >= 20)
                    insights.push({ type: 'success', icon: PiggyBank, title: `Saving ${savingsRate}% — Excellent!`, desc: `You've saved ${formatCurrency(balance)}. The 50/30/20 rule recommends saving at least 20%. You've nailed it — consider investing your surplus.` });
                else if (savingsRate > 0)
                    insights.push({ type: 'warning', icon: PiggyBank, title: `Saving only ${savingsRate}%`, desc: `Your savings rate is below 20%. Try to slowly increase it — even a ₹500 reduction in one category monthly adds up to ₹6,000 per year.` });

                if (topCat)
                    insights.push({ type: 'info', icon: BarChart3, title: `Top spend: ${topCat[0]}`, desc: `${topCat[0]} is your biggest expense category at ${((topCat[1] / totalExp) * 100).toFixed(0)}% of total spending (${formatCurrency(topCat[1])}). Try budgeting this category specifically.` });

                if (bigExp)
                    insights.push({ type: 'info', icon: TrendingDown, title: 'Largest single expense', desc: `Your biggest expense was "${bigExp.title}" for ${formatCurrency(bigExp.amount)} on ${new Date(bigExp.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}. Is this recurring or one-time?` });

                if (monthInc > 0 && monthExp > monthInc)
                    insights.push({ type: 'danger', icon: AlertTriangle, title: 'Monthly overspend!', desc: `This month you spent ${formatCurrency(monthExp)} but only earned ${formatCurrency(monthInc)}. You're spending ${formatCurrency(monthExp - monthInc)} more than you earn this month.` });

                if (incomes.length === 1)
                    insights.push({ type: 'info', icon: Target, title: 'Single income source', desc: 'You have just one income source listed. Consider tracking multiple streams (freelance, investments, side projects) for better financial visibility.' });
            }

            setData({ totalInc, totalExp, balance, savingsRate, spendingRatio, monthExp, monthInc, insights, expCount: expenses.length, incCount: incomes.length });
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [user]);

    const colorMap = {
        success: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/40',
        warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/40',
        danger: 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800/40',
        info: 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800/40',
    };
    const iconColorMap = {
        success: 'text-emerald-600 dark:text-emerald-400',
        warning: 'text-amber-600 dark:text-amber-400',
        danger: 'text-rose-600 dark:text-rose-400',
        info: 'text-violet-600 dark:text-violet-400',
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                onClick={e => e.stopPropagation()}
                className="bg-white dark:bg-[#161a22] rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-violet-50 to-indigo-50/50 dark:from-violet-900/15 dark:to-indigo-900/10">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md">
                            <Sparkles size={16} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-[15px] font-bold text-slate-800 dark:text-white">AI Financial Insights</h2>
                            <p className="text-[11px] text-slate-400">Personalised analysis of your finances</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 p-5 space-y-4">
                    {loading ? (
                        <div className="space-y-3">
                            {[0, 1, 2, 3].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
                        </div>
                    ) : data ? (
                        <>
                            {/* Quick stats strip */}
                            <div className="grid grid-cols-3 gap-3 mb-1">
                                <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                                    <p className="text-[16px] font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(data.totalInc)}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wide font-semibold">Total Income</p>
                                </div>
                                <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                                    <p className="text-[16px] font-bold text-rose-600 dark:text-rose-400">{formatCurrency(data.totalExp)}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wide font-semibold">Total Spent</p>
                                </div>
                                <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                                    <p className={`text-[16px] font-bold ${data.balance >= 0 ? 'text-violet-600 dark:text-violet-400' : 'text-rose-600 dark:text-rose-400'}`}>{formatCurrency(data.balance)}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wide font-semibold">Balance</p>
                                </div>
                            </div>

                            {/* Insights list */}
                            {data.insights.map((ins, i) => (
                                <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                                    className={`flex gap-3 p-4 rounded-xl border ${colorMap[ins.type]}`}>
                                    <div className={`flex-shrink-0 mt-0.5 ${iconColorMap[ins.type]}`}>
                                        <ins.icon size={16} />
                                    </div>
                                    <div>
                                        <p className={`text-[13px] font-bold mb-1 ${iconColorMap[ins.type]}`}>{ins.title}</p>
                                        <p className="text-[12px] text-slate-600 dark:text-slate-400 leading-relaxed">{ins.desc}</p>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Tip footer */}
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                <p className="text-[11px] text-slate-400 text-center">
                                    💡 Insights are based on your {data.expCount} expenses and {data.incCount} income records
                                </p>
                            </div>
                        </>
                    ) : (
                        <p className="text-center text-slate-400 py-8">Failed to load insights. Please try again.</p>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

/* ══════════════════════════════════════════════
   PROFILE SETTINGS MODAL
══════════════════════════════════════════════ */
const ProfileModal = ({ onClose, user }) => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
            onClick={e => e.stopPropagation()}
            className="bg-white dark:bg-[#161a22] rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-md overflow-hidden">

            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-[15px] font-bold text-slate-800 dark:text-white flex items-center gap-2"><User size={16} className="text-violet-500" /> Profile Settings</h2>
                <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={16} /></button>
            </div>

            <div className="p-6 space-y-5">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="text-[15px] font-bold text-slate-800 dark:text-white">{user?.name}</p>
                        <p className="text-[12px] text-slate-400 mt-0.5">{user?.email}</p>
                        <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active Account
                        </span>
                    </div>
                </div>

                {/* Info fields */}
                <div className="space-y-3">
                    <div>
                        <label className="form-label">Full Name</label>
                        <input type="text" defaultValue={user?.name} className="form-input" readOnly />
                    </div>
                    <div>
                        <label className="form-label">Email Address</label>
                        <input type="email" defaultValue={user?.email} className="form-input" readOnly />
                    </div>
                    <div>
                        <label className="form-label">Account Type</label>
                        <input type="text" value="Free Plan" className="form-input" readOnly />
                    </div>
                </div>

                {/* Security */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5 mb-2">
                        <Lock size={14} className="text-violet-500" />
                        <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">Security</p>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">Your account is protected with bcrypt password hashing. To change your password, sign out and use the registration flow with a new account.</p>
                </div>
            </div>

            <div className="px-6 pb-5">
                <button onClick={onClose} className="btn-primary w-full justify-center text-sm">Close</button>
            </div>
        </motion.div>
    </div>
);

/* ══════════════════════════════════════════════
   PREFERENCES MODAL
══════════════════════════════════════════════ */
const PreferencesModal = ({ onClose }) => {
    const [currency, setCurrency] = useState('INR (₹)');
    const [timezone, setTimezone] = useState('Asia/Kolkata');
    const [dateFormat, setDateFmt] = useState('DD/MM/YYYY');
    const [saved, setSaved] = useState(false);

    const handleSave = () => { setSaved(true); setTimeout(() => { setSaved(false); onClose(); }, 1200); };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                onClick={e => e.stopPropagation()}
                className="bg-white dark:bg-[#161a22] rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-md overflow-hidden">

                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-[15px] font-bold text-slate-800 dark:text-white flex items-center gap-2"><Settings size={16} className="text-violet-500" /> Preferences</h2>
                    <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={16} /></button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="form-label flex items-center gap-2"><Globe size={12} /> Currency</label>
                        <select className="form-input" value={currency} onChange={e => setCurrency(e.target.value)}>
                            <option>INR (₹)</option><option>USD ($)</option><option>EUR (€)</option><option>GBP (£)</option>
                        </select>
                    </div>
                    <div>
                        <label className="form-label flex items-center gap-2"><Globe size={12} /> Timezone</label>
                        <select className="form-input" value={timezone} onChange={e => setTimezone(e.target.value)}>
                            <option>Asia/Kolkata</option><option>UTC</option><option>America/New_York</option><option>Europe/London</option>
                        </select>
                    </div>
                    <div>
                        <label className="form-label flex items-center gap-2"><Palette size={12} /> Date Format</label>
                        <select className="form-input" value={dateFormat} onChange={e => setDateFmt(e.target.value)}>
                            <option>DD/MM/YYYY</option><option>MM/DD/YYYY</option><option>YYYY-MM-DD</option>
                        </select>
                    </div>

                    {/* Display toggles */}
                    <div className="space-y-2">
                        <p className="form-label">Display Options</p>
                        {[
                            { label: 'Show balance on dashboard', defaultChecked: true },
                            { label: 'Email notifications', defaultChecked: false },
                            { label: 'Monthly summary reminders', defaultChecked: true },
                        ].map(opt => (
                            <label key={opt.label} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 cursor-pointer group">
                                <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">{opt.label}</span>
                                <div className="relative">
                                    <input type="checkbox" defaultChecked={opt.defaultChecked} className="peer sr-only" />
                                    <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-checked:bg-violet-600 rounded-full transition-colors" />
                                    <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="px-6 pb-5 flex gap-3">
                    <button onClick={onClose} className="btn-ghost flex-1 text-sm">Cancel</button>
                    <button onClick={handleSave} className={`flex-1 text-sm flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all ${saved ? 'bg-emerald-500 text-white' : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white'}`}>
                        {saved ? <><Check size={14} /> Saved!</> : 'Save Preferences'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

/* ══════════════════════════════════════════════
   HELP & SUPPORT MODAL
══════════════════════════════════════════════ */
const FAQS = [
    { q: 'How do I add an expense?', a: 'Go to the Expenses page and click the "+ Add Expense" button. Fill in the description, amount, category, date and payment method.' },
    { q: 'How do I set a monthly budget?', a: 'Visit the Budgets page, enter your desired monthly limit in the form and click "Set". You can also pick from the quick preset buttons.' },
    { q: 'How do I export my data?', a: 'On the Expenses or Income page, use the PDF or CSV buttons in the top right to download your records.' },
    { q: 'What is the savings rate?', a: 'Savings rate = (Total Income − Total Expenses) ÷ Total Income × 100. A rate above 20% is considered healthy by financial experts.' },
    { q: 'Can I edit or delete a transaction?', a: 'Yes — hover over any row in the Expenses or Income table and the Edit (pencil) and Delete (trash) action buttons will appear on the right.' },
    { q: 'Is my data secure?', a: 'Your password is hashed with bcrypt and all API calls are protected with JWT tokens. Your data is stored in your own MongoDB database.' },
];

const HelpModal = ({ onClose }) => {
    const [openFaq, setOpenFaq] = useState(null);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                onClick={e => e.stopPropagation()}
                className="bg-white dark:bg-[#161a22] rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">

                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-[15px] font-bold text-slate-800 dark:text-white flex items-center gap-2"><HelpCircle size={16} className="text-violet-500" /> Help & Support</h2>
                    <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={16} /></button>
                </div>

                <div className="overflow-y-auto flex-1 p-5 space-y-4">
                    {/* Quick actions */}
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { icon: BookOpen, label: 'User Guide', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
                            { icon: MessageCircle, label: 'Community', color: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400' },
                            { icon: Mail, label: 'Email Support', color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' },
                        ].map(item => (
                            <button key={item.label} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-700 transition-colors">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.color}`}>
                                    <item.icon size={16} />
                                </div>
                                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 text-center">{item.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* FAQ accordion */}
                    <div>
                        <p className="form-label mb-3">Frequently Asked Questions</p>
                        <div className="space-y-2">
                            {FAQS.map((faq, i) => (
                                <div key={i} className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
                                    <button
                                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                    >
                                        <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 pr-4">{faq.q}</span>
                                        <ChevronDown size={14} className={`text-slate-400 flex-shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`} />
                                    </button>
                                    <AnimatePresence>
                                        {openFaq === i && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                <p className="px-4 pt-1 pb-3 text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-50 dark:border-slate-800">{faq.a}</p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* App version */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div>
                            <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">Smart Expense Tracker</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Version 2.0.0 • MERN Stack</p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">Latest</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

/* ══════════════════════════════════════════════
   LAYOUT
══════════════════════════════════════════════ */
const Layout = () => {
    const { user } = useSelector(state => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const currentOutlet = useOutlet();

    const [mobileOpen, setMobileOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(2);

    /* active modals */
    const [showAI, setShowAI] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [showPrefs, setShowPrefs] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    const notifRef = useRef(null);
    const profileRef = useRef(null);

    useOutsideClick(notifRef, useCallback(() => setNotifOpen(false), []));
    useOutsideClick(profileRef, useCallback(() => setProfileOpen(false), []));

    const handleLogout = () => { dispatch(logout()); dispatch(reset()); navigate('/login'); };
    const handleNotifOpen = () => { setNotifOpen(o => !o); setProfileOpen(false); setUnreadCount(0); };

    const openProfileModal = () => { setProfileOpen(false); setShowProfile(true); };
    const openPrefsModal = () => { setProfileOpen(false); setShowPrefs(true); };
    const openHelpModal = () => { setProfileOpen(false); setShowHelp(true); };
    const openAIModal = () => { setShowAI(true); };

    /* ── Nav link ── */
    const NavLink = ({ name, path, icon: Icon, mobile = false }) => {
        const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
        return (
            <Link to={path} onClick={() => mobile && setMobileOpen(false)}
                title={collapsed && !mobile ? name : undefined}
                className={`nav-link ${isActive ? 'active' : ''} ${collapsed && !mobile ? 'justify-center px-0' : ''}`}>
                <Icon size={17} className="nav-icon" />
                {(!collapsed || mobile) && <span className="flex-1 text-[13.5px] whitespace-nowrap">{name}</span>}
            </Link>
        );
    };

    /* ── Sidebar ── */
    const SidebarInner = ({ mobile = false }) => (
        <div className="flex flex-col h-full">
            <div className={`flex items-center gap-2.5 px-4 pt-5 pb-4 ${collapsed && !mobile ? 'justify-center px-2' : ''}`}>
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md flex-shrink-0">
                    <TrendingUp size={16} className="text-white" />
                </div>
                {(!collapsed || mobile) && (
                    <div>
                        <p className="font-bold text-slate-800 dark:text-white text-[14px] leading-tight tracking-tight">Expense Tracker</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Personal Finance</p>
                    </div>
                )}
            </div>
            <div className="mx-3 mb-2 h-px bg-slate-100 dark:bg-slate-800" />
            {(!collapsed || mobile) && (
                <p className="px-4 mb-1.5 text-[10px] font-semibold text-slate-400 dark:text-slate-600 uppercase tracking-widest">Menu</p>
            )}
            <nav className={`flex-1 px-2 space-y-0.5 ${collapsed && !mobile ? 'px-1.5' : ''}`}>
                {navLinks.map(({ name, path, icon }) => (
                    <NavLink key={path} name={name} path={path} icon={icon} mobile={mobile} />
                ))}
            </nav>
            {user && (
                <div className="px-2 pb-4 mt-3 border-t border-slate-100 dark:border-slate-800 pt-3 space-y-0.5">
                    {(!collapsed || mobile) && (
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/15 dark:to-indigo-900/10 mb-2 border border-violet-100/60 dark:border-violet-800/20">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[13px] font-semibold text-slate-800 dark:text-white truncate leading-tight">{user.name}</p>
                                <div className="flex items-center gap-1 mt-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Active</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <button onClick={handleLogout} title="Sign Out"
                        className={`nav-link w-full hover:!bg-rose-50 dark:hover:!bg-rose-900/20 hover:!text-rose-600 dark:hover:!text-rose-400 ${collapsed && !mobile ? 'justify-center px-0' : ''}`}>
                        <LogOut size={16} className="nav-icon flex-shrink-0" />
                        {(!collapsed || mobile) && <span className="text-[13.5px]">Sign Out</span>}
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <div className="flex h-screen overflow-hidden bg-[#f5f6fa] dark:bg-[#0c0e14]">

            {/* ── Modals ── */}
            <AnimatePresence>
                {showAI && <AIInsightsModal onClose={() => setShowAI(false)} user={user} />}
                {showProfile && <ProfileModal onClose={() => setShowProfile(false)} user={user} />}
                {showPrefs && <PreferencesModal onClose={() => setShowPrefs(false)} />}
                {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
            </AnimatePresence>

            {/* ── Desktop Sidebar ── */}
            <motion.aside
                animate={{ width: collapsed ? 68 : 240 }}
                transition={{ type: 'spring', damping: 30, stiffness: 280 }}
                className="hidden lg:flex flex-col bg-white dark:bg-[#111318] border-r border-slate-100 dark:border-slate-800/80 relative flex-shrink-0 overflow-hidden"
            >
                <button onClick={() => setCollapsed(c => !c)}
                    className="absolute -right-3 top-14 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm hover:border-violet-400 hover:text-violet-600 dark:hover:border-violet-500 transition-all z-20">
                    <ChevronLeft size={12} className={`text-slate-500 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
                </button>
                <SidebarInner />
            </motion.aside>

            {/* ── Mobile Drawer ── */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
                            onClick={() => setMobileOpen(false)} />
                        <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
                            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
                            className="fixed inset-y-0 left-0 w-[260px] bg-white dark:bg-[#111318] border-r border-slate-100 dark:border-slate-800 z-50 lg:hidden overflow-y-auto">
                            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                <X size={17} />
                            </button>
                            <SidebarInner mobile />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* ── Main ── */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

                {/* Topbar */}
                <header className="topbar">
                    <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <Menu size={19} />
                    </button>

                    {user && (
                        <div className="hidden md:block">
                            <p className="text-[14px] font-semibold text-slate-800 dark:text-white leading-tight">
                                {getGreeting()}, {user.name.split(' ')[0]} 👋
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-none">Here's your financial overview</p>
                        </div>
                    )}

                    <div className="hidden lg:flex flex-1 max-w-[260px] ml-5 relative">
                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input type="text" placeholder="Search transactions..." className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 rounded-xl text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all" />
                    </div>

                    <div className="flex items-center gap-1.5 ml-auto">
                        {/* AI Insights — clickable */}
                        <button
                            onClick={openAIModal}
                            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/10 border border-violet-200/60 dark:border-violet-800/30 hover:from-violet-100 hover:to-indigo-100 dark:hover:from-violet-900/30 dark:hover:to-indigo-900/20 transition-all mr-1 cursor-pointer"
                        >
                            <Sparkles size={13} className="text-violet-500" />
                            <span className="text-[11px] font-semibold text-violet-600 dark:text-violet-400">AI Insights</span>
                        </button>

                        {/* Notification bell */}
                        <div ref={notifRef} className="relative">
                            <button onClick={handleNotifOpen} className="relative p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                <Bell size={18} />
                                {unreadCount > 0 && <span className="notif-dot" />}
                            </button>
                            <AnimatePresence>
                                {notifOpen && (
                                    <motion.div initial={{ opacity: 0, scale: 0.95, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -8 }} transition={{ duration: 0.15 }}
                                        className="dropdown-menu w-[320px]">
                                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                                            <p className="text-sm font-semibold text-slate-800 dark:text-white">Notifications</p>
                                            <span className="text-[11px] text-violet-600 dark:text-violet-400 font-medium cursor-pointer hover:underline">Mark all read</span>
                                        </div>
                                        <div className="py-1">
                                            {NOTIFICATIONS.map(n => (
                                                <div key={n.id} className="dropdown-item hover:bg-violet-50/60 dark:hover:bg-violet-900/10">
                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${n.color}`}>
                                                        <n.icon size={14} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[13px] font-semibold text-slate-800 dark:text-white leading-tight">{n.title}</p>
                                                        <p className="text-[11px] text-slate-400 mt-0.5">{n.sub}</p>
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 flex-shrink-0">{n.time}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <ThemeToggle />

                        {/* Profile dropdown */}
                        {user ? (
                            <div ref={profileRef} className="relative">
                                <button onClick={() => { setProfileOpen(o => !o); setNotifOpen(false); }}
                                    className="flex items-center gap-2 ml-1 pl-3 border-l border-slate-100 dark:border-slate-800 hover:opacity-80 transition-opacity">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-[13px] font-bold shadow-md ring-2 ring-white dark:ring-slate-900">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="hidden sm:block text-left">
                                        <p className="text-[13px] font-semibold text-slate-800 dark:text-white leading-tight">{user.name.split(' ')[0]}</p>
                                        <p className="text-[10px] text-slate-400 leading-none mt-0.5">Free plan</p>
                                    </div>
                                </button>

                                <AnimatePresence>
                                    {profileOpen && (
                                        <motion.div initial={{ opacity: 0, scale: 0.95, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -8 }} transition={{ duration: 0.15 }}
                                            className="dropdown-menu">
                                            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                                                <p className="text-sm font-semibold text-slate-800 dark:text-white">{user.name}</p>
                                                <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
                                            </div>
                                            <div className="py-1">
                                                <div className="dropdown-item cursor-pointer" onClick={openProfileModal}>
                                                    <User size={15} className="text-slate-400" /> Profile Settings
                                                    <ChevronRight size={13} className="text-slate-300 ml-auto" />
                                                </div>
                                                <div className="dropdown-item cursor-pointer" onClick={openPrefsModal}>
                                                    <Settings size={15} className="text-slate-400" /> Preferences
                                                    <ChevronRight size={13} className="text-slate-300 ml-auto" />
                                                </div>
                                                <div className="dropdown-item cursor-pointer" onClick={openHelpModal}>
                                                    <HelpCircle size={15} className="text-slate-400" /> Help & Support
                                                    <ChevronRight size={13} className="text-slate-300 ml-auto" />
                                                </div>
                                            </div>
                                            <div className="border-t border-slate-100 dark:border-slate-800 py-1">
                                                <div className="dropdown-item text-rose-500 dark:text-rose-400 hover:!bg-rose-50 dark:hover:!bg-rose-900/20 cursor-pointer" onClick={handleLogout}>
                                                    <LogOut size={15} /> Sign Out
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <Link to="/login" className="btn-primary text-[13px] ml-2">Sign In</Link>
                        )}
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    {!user ? (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center items-center h-full">
                            <div className="card p-12 text-center max-w-sm rounded-3xl card-gradient-border">
                                <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 3 }}
                                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mx-auto mb-5 shadow-lg">
                                    <TrendingUp size={26} className="text-white" />
                                </motion.div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Sign In Required</h2>
                                <p className="text-slate-500 dark:text-slate-400 mb-7 text-sm leading-relaxed">Please log in to access your personal expense tracker.</p>
                                <Link to="/login" className="btn-primary w-full justify-center">Sign In</Link>
                            </div>
                        </motion.div>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div key={location.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18, ease: 'easeOut' }}>
                                {currentOutlet || <Outlet />}
                            </motion.div>
                        </AnimatePresence>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Layout;
