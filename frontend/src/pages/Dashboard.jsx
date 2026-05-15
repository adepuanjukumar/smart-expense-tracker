import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../utils/api';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { formatCurrency } from '../utils/formatCurrency';
import { TrendingUp, TrendingDown, Wallet, ArrowRight, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import Spinner from '../components/Spinner';

const Dashboard = () => {
    const { user } = useSelector(state => state.auth);
    const [expenses, setExpenses] = useState([]);
    const [incomes, setIncomes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            Promise.all([
                axios.get(`${API_BASE}/api/expenses`, { headers: { Authorization: `Bearer ${user.token}` } }),
                axios.get(`${API_BASE}/api/income`, { headers: { Authorization: `Bearer ${user.token}` } })
            ]).then(([expRes, incRes]) => {
                setExpenses(expRes.data);
                setIncomes(incRes.data);
                setLoading(false);
            }).catch(err => { console.error(err); setLoading(false); });
        }
    }, [user]);

    const totalIncome = incomes.reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const balance = totalIncome - totalExpenses;

    const categoryData = expenses.reduce((acc, curr) => {
        const existing = acc.find(item => item.name === curr.category);
        if (existing) existing.value += curr.amount;
        else acc.push({ name: curr.category, value: curr.amount });
        return acc;
    }, []);
    const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6', '#64748b'];

    const trendsData = [];
    const map = new Map();
    [...incomes, ...expenses].forEach(item => {
        const dateStr = new Date(item.date).toLocaleDateString('en-GB');
        if (!map.has(dateStr)) map.set(dateStr, { name: dateStr, Income: 0, Expense: 0 });
        if (item.source !== undefined) map.get(dateStr).Income += item.amount;
        else map.get(dateStr).Expense += item.amount;
    });
    map.forEach(value => trendsData.push(value));
    trendsData.sort((a, b) => new Date(a.name) - new Date(b.name));

    const allTransactions = [...incomes.map(i => ({ ...i, type: 'income' })), ...expenses.map(e => ({ ...e, type: 'expense' }))]
        .sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

    if (loading) return <Spinner />;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 w-full max-w-[1400px] mx-auto pb-10">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                <motion.div whileHover={{ y: -5 }} className="glass-card bg-gradient-to-br from-indigo-600/90 to-cyan-500/90 dark:from-indigo-600/60 dark:to-cyan-500/60 border-indigo-400 text-white p-7 sm:p-9 relative overflow-hidden transition-all shadow-[0_10px_30px_rgba(99,102,241,0.4)]">
                    <div className="absolute -right-10 -top-10 bg-white/20 w-40 h-40 rounded-full blur-2xl"></div>
                    <p className="text-white/80 font-black mb-3 flex items-center gap-2 tracking-widest uppercase text-xs"><Wallet size={18} /> Actual Balance</p>
                    <h2 className="text-4xl sm:text-5xl font-black tracking-tight">{formatCurrency(balance)}</h2>
                </motion.div>

                <motion.div whileHover={{ y: -5 }} className="glass-panel p-7 sm:p-9 rounded-[2rem] relative overflow-hidden transition-all">
                    <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500 shadow-[0_0_15px_#10b981]"></div>
                    <p className="text-slate-500 dark:text-slate-400 font-bold mb-3 flex items-center gap-2 tracking-wide uppercase text-[11px]"><TrendingUp size={18} className="text-emerald-500" /> Lifetime Gain</p>
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">{formatCurrency(totalIncome)}</h2>
                </motion.div>

                <motion.div whileHover={{ y: -5 }} className="glass-panel p-7 sm:p-9 rounded-[2rem] relative overflow-hidden transition-all">
                    <div className="absolute top-0 left-0 w-2 h-full bg-rose-500 shadow-[0_0_15px_#f43f5e]"></div>
                    <p className="text-slate-500 dark:text-slate-400 font-bold mb-3 flex items-center gap-2 tracking-wide uppercase text-[11px]"><TrendingDown size={18} className="text-rose-500" /> Total Expenses</p>
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">{formatCurrency(totalExpenses)}</h2>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
                <div className="glass-panel p-6 sm:p-8 rounded-[2rem] h-[450px] flex flex-col relative group">
                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none rounded-[2rem]"></div>
                    <h3 className="text-xl font-bold mb-6 dark:text-white text-slate-800 relative z-10 flex items-center gap-2">
                        <Activity className="text-indigo-500" /> Cashflow Velocity
                    </h3>
                    {trendsData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={trendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#64748b" opacity={0.15} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} tickFormatter={val => `₹${val / 1000}k`} />
                                <Tooltip formatter={(value) => formatCurrency(value)} cursor={{ fill: '#94a3b8', opacity: 0.1 }} contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(10px)', color: 'white', boxShadow: 'rgba(0, 0, 0, 0.5) 0px 10px 20px -5px', fontWeight: 'bold' }} />
                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontWeight: 'bold', fontSize: '13px' }} />
                                <Bar dataKey="Income" fill="#10b981" radius={[8, 8, 0, 0]} maxBarSize={30} />
                                <Bar dataKey="Expense" fill="#f43f5e" radius={[8, 8, 0, 0]} maxBarSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex-1 flex justify-center items-center text-slate-400 font-medium">Not enough data to calculate trend bars.</div>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row xl:flex-col gap-6 lg:gap-8 h-auto xl:h-[450px]">
                    <div className="glass-panel p-6 rounded-[2rem] flex-1 flex flex-col items-center relative h-[210px] xl:h-[auto]">
                        <h3 className="text-lg font-bold mb-2 dark:text-white w-full text-left text-slate-800">Top Categories</h3>
                        {categoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius="55%" outerRadius="85%" paddingAngle={5} dataKey="value">
                                        {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15,23,42,0.9)', color: 'white', fontWeight: 'bold', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.5)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex-1 flex justify-center items-center text-slate-400 font-medium text-sm">No categorical data records found.</div>
                        )}
                    </div>

                    <div className="glass-panel p-6 rounded-[2rem] flex-1 flex flex-col relative overflow-hidden h-[210px] xl:h-[auto]">
                        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white/90 dark:from-[#080d1e]/90 to-transparent pointer-events-none z-10"></div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold dark:text-white text-slate-800">Recent Activity</h3>
                            <Link to="/expenses" className="text-indigo-500 hover:text-indigo-400 text-sm font-extrabold flex items-center gap-1 transition-colors">View All <ArrowRight size={14} /></Link>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2 pr-2 hide-scrollbar pb-6">
                            {allTransactions.length > 0 ? allTransactions.map((t, idx) => (
                                <div key={`${t._id}-${idx}`} className="flex justify-between items-center p-3.5 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-all cursor-pointer group border border-transparent dark:hover:border-white/10">
                                    <div>
                                        <p className="font-extrabold text-[14px] text-slate-900 dark:text-white group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors tracking-wide">{t.title || t.source}</p>
                                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{new Date(t.date).toLocaleDateString('en-GB')}</p>
                                    </div>
                                    <p className={`font-black text-[15px] ${t.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                                    </p>
                                </div>
                            )) : (
                                <p className="text-center text-slate-400 mt-6 text-sm font-semibold">No recent transactions synced.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
export default Dashboard;
