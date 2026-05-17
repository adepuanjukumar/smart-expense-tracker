import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../utils/api';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { formatCurrency } from '../utils/formatCurrency';
import {
    Wallet, TrendingUp, TrendingDown, PiggyBank, ArrowRight,
    Sparkles, ArrowUpRight, ArrowDownRight, Zap, Target,
    Clock, ChevronRight, AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import Spinner from '../components/Spinner';

/* ── Constants ── */
const CAT_COLORS = {
    Food: '#8b5cf6', Travel: '#3b82f6', Shopping: '#f59e0b',
    Bills: '#ef4444', Entertainment: '#ec4899', Health: '#10b981',
    Education: '#06b6d4', Others: '#64748b',
};
const COL_ARR = Object.values(CAT_COLORS);

/* ── Animation variants ── */
const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.3, ease: 'easeOut' }
});

/* ── Skeleton loader ── */
const SkeletonCard = () => (
    <div className="card p-5 rounded-2xl space-y-3 animate-pulse">
        <div className="flex items-center gap-3">
            <div className="skeleton w-10 h-10 rounded-xl" />
            <div className="skeleton h-4 w-28 rounded" />
        </div>
        <div className="skeleton h-7 w-32 rounded" />
        <div className="skeleton h-3 w-20 rounded" />
    </div>
);

/* ── Custom tooltip ── */
const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white dark:bg-[#1e2130] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 shadow-xl text-xs">
            <p className="font-semibold text-slate-600 dark:text-slate-300 mb-1.5">{label}</p>
            {payload.map(p => (
                <p key={p.name} style={{ color: p.color || p.fill }} className="font-medium">
                    {p.name}: {formatCurrency(p.value)}
                </p>
            ))}
        </div>
    );
};

/* ── Stat card ── */
const StatCard = ({ icon: Icon, label, value, gradient, sub, delta, delay, sparkData, sparkColor }) => (
    <motion.div {...fadeUp(delay)} className="stat-card card-hover">
        <div className="flex items-start justify-between mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${gradient}`}>
                <Icon size={17} className="text-white" />
            </div>
            {delta !== undefined && (
                <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full ${delta >= 0
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                    : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'
                    }`}>
                    {delta >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                    {Math.abs(delta)}%
                </span>
            )}
        </div>
        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-[22px] font-bold text-slate-800 dark:text-white leading-tight">{value}</p>
        {sub && <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{sub}</p>}

        {/* Mini sparkline */}
        {sparkData && sparkData.length > 0 && (
            <div className="mt-3 -mx-1">
                <ResponsiveContainer width="100%" height={40}>
                    <AreaChart data={sparkData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id={`sg-${label}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={sparkColor} stopOpacity={0.25} />
                                <stop offset="95%" stopColor={sparkColor} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="v" stroke={sparkColor} strokeWidth={1.5}
                            fill={`url(#sg-${label})`} dot={false} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        )}
    </motion.div>
);

/* ── AI Insight item ── */
const InsightItem = ({ icon, color, title, desc }) => (
    <div className="insight-card">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
            {icon}
        </div>
        <div className="min-w-0">
            <p className="text-[13px] font-semibold text-slate-800 dark:text-white leading-tight">{title}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
        </div>
    </div>
);

/* ═══════════════════════════════════════════════ */
const Dashboard = () => {
    const { user } = useSelector(state => state.auth);
    const [expenses, setExpenses] = useState([]);
    const [incomes, setIncomes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            Promise.all([
                axios.get(`${API_BASE}/api/expenses`, { headers: { Authorization: `Bearer ${user.token}` } }),
                axios.get(`${API_BASE}/api/income`, { headers: { Authorization: `Bearer ${user.token}` } }),
            ]).then(([expR, incR]) => {
                setExpenses(expR.data);
                setIncomes(incR.data);
                setLoading(false);
            }).catch(err => { console.error(err); setLoading(false); });
        }
    }, [user]);

    /* ── Computed ── */
    const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const balance = totalIncome - totalExpenses;
    const savings = Math.max(0, balance);
    const savingsRate = totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0;

    /* Current month stats */
    const now = new Date();
    const thisMonth = (item) => {
        const d = new Date(item.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    };
    const monthIncome = incomes.filter(thisMonth).reduce((s, i) => s + i.amount, 0);
    const monthExpenses = expenses.filter(thisMonth).reduce((s, e) => s + e.amount, 0);

    /* Category pie */
    const categoryData = Object.entries(
        expenses.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc; }, {})
    ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    /* Monthly bar chart — last 6 months
       Key strategy: use 'YYYY-MM' for reliable numeric sorting,
       store a human label separately for the X-axis display.
    */
    const monthlyMap = new Map();
    const getMonthSortKey = (date) => {
        const d = new Date(date);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        return `${y}-${m}`; // e.g. '2026-05'
    };
    const getMonthLabel = (sortKey) => {
        const [y, m] = sortKey.split('-');
        return new Date(Number(y), Number(m) - 1, 1)
            .toLocaleDateString('en-US', { month: 'short', year: 'numeric' }); // 'May 2026'
    };
    // Accumulate incomes by month
    incomes.forEach(item => {
        const key = getMonthSortKey(item.date);
        if (!monthlyMap.has(key))
            monthlyMap.set(key, { sortKey: key, name: getMonthLabel(key), Income: 0, Expenses: 0 });
        monthlyMap.get(key).Income += Number(item.amount);
    });
    // Accumulate expenses by month
    expenses.forEach(item => {
        const key = getMonthSortKey(item.date);
        if (!monthlyMap.has(key))
            monthlyMap.set(key, { sortKey: key, name: getMonthLabel(key), Income: 0, Expenses: 0 });
        monthlyMap.get(key).Expenses += Number(item.amount);
    });
    // Sort chronologically by 'YYYY-MM' (string compare is correct here) and take last 6
    const monthlyData = [...monthlyMap.values()]
        .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
        .slice(-6);

    /* Sparkline seeds */
    const makeSparkData = (arr) => arr.slice(-6).map(v => ({ v }));
    const expSpark = makeSparkData(monthlyData.map(m => m.Expenses));
    const incSpark = makeSparkData(monthlyData.map(m => m.Income));

    /* Recent transactions */
    const recent = [
        ...incomes.map(i => ({ ...i, type: 'income' })),
        ...expenses.map(e => ({ ...e, type: 'expense' })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 7);

    /* Top category */
    const topCat = categoryData[0];

    /* AI insights */
    const insights = [];
    if (totalIncome > 0 && totalExpenses / totalIncome > 0.8)
        insights.push({ icon: <AlertCircle size={14} />, color: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400', title: 'High spending ratio', desc: `You're spending ${Math.round((totalExpenses / totalIncome) * 100)}% of your income. Try to keep it under 70%.` });
    if (savingsRate >= 20)
        insights.push({ icon: <Sparkles size={14} />, color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400', title: 'Great savings rate!', desc: `You're saving ${savingsRate}% of your income — above the recommended 20%.` });
    if (topCat)
        insights.push({ icon: <Target size={14} />, color: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400', title: `Highest: ${topCat.name}`, desc: `${topCat.name} accounts for ${Math.round((topCat.value / totalExpenses) * 100)}% of your total spending.` });
    if (insights.length === 0)
        insights.push({ icon: <Zap size={14} />, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400', title: 'Start tracking!', desc: 'Add your first expense and income to get AI-powered insights about your spending.' });

    if (loading) return (
        <div className="space-y-5 max-w-[1400px] mx-auto">
            <div className="skeleton h-6 w-36 rounded" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[0, 1, 2, 3].map(i => <SkeletonCard key={i} />)}</div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="skeleton xl:col-span-2 h-64 rounded-2xl" />
                <div className="skeleton h-64 rounded-2xl" />
            </div>
        </div>
    );

    return (
        <div className="space-y-5 max-w-[1400px] mx-auto">

            {/* Page header */}
            <motion.div {...fadeUp(0)} className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-bold text-slate-800 dark:text-white">Dashboard</h1>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                </div>
                <Link to="/expenses" className="btn-primary text-[12px] px-3.5 py-2">
                    + Add Expense
                </Link>
            </motion.div>

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Wallet} label="Current Balance" value={formatCurrency(balance)} gradient={balance >= 0 ? 'bg-gradient-to-br from-violet-500 to-indigo-600' : 'bg-gradient-to-br from-rose-500 to-rose-600'} sub="All time" delay={0} sparkData={[]} sparkColor="#8b5cf6" />
                <StatCard icon={TrendingUp} label="Total Income" value={formatCurrency(totalIncome)} gradient="bg-gradient-to-br from-emerald-500 to-green-500" sub={`${formatCurrency(monthIncome)} this month`} delta={monthIncome > 0 ? 8 : 0} delay={0.06} sparkData={incSpark} sparkColor="#10b981" />
                <StatCard icon={TrendingDown} label="Total Expenses" value={formatCurrency(totalExpenses)} gradient="bg-gradient-to-br from-rose-500 to-rose-600" sub={`${formatCurrency(monthExpenses)} this month`} delta={monthExpenses > 0 ? -3 : 0} delay={0.12} sparkData={expSpark} sparkColor="#f43f5e" />
                <StatCard icon={PiggyBank} label="Savings" value={formatCurrency(savings)} gradient="bg-gradient-to-br from-amber-400 to-orange-500" sub={`${savingsRate}% savings rate`} delay={0.18} sparkData={[]} sparkColor="#f59e0b" />
            </div>

            {/* ── Charts + Insights Row ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

                {/* Monthly Bar Chart */}
                <motion.div {...fadeUp(0.2)} className="card p-5 rounded-2xl xl:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-[14px] font-bold text-slate-800 dark:text-white">Monthly Overview</h2>
                            <p className="text-[11px] text-slate-400 mt-0.5">Income vs Expenses — last 6 months</p>
                        </div>
                        <div className="flex gap-3 text-[11px] font-semibold">
                            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Income</span>
                            <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Expenses</span>
                        </div>
                    </div>
                    {monthlyData.length >= 1 ? (
                        <ResponsiveContainer width="100%" height={210}>
                            <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }} barGap={4} barCategoryGap="35%">
                                <defs>
                                    <linearGradient id="incBar" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.6} />
                                    </linearGradient>
                                    <linearGradient id="expBar" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.9} />
                                        <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.6} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800/80" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }} interval={0} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(124,58,237,0.04)', radius: 6 }} />
                                <Bar dataKey="Income" fill="url(#incBar)" radius={[5, 5, 0, 0]} maxBarSize={24} />
                                <Bar dataKey="Expenses" fill="url(#expBar)" radius={[5, 5, 0, 0]} maxBarSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[210px] flex flex-col items-center justify-center text-slate-400 gap-2">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                <TrendingUp size={20} className="opacity-40" />
                            </div>
                            <p className="text-sm font-medium">No data yet</p>
                            <p className="text-xs text-slate-300 dark:text-slate-600">Add transactions to see your trends</p>
                        </div>
                    )}
                </motion.div>

                {/* Category Pie */}
                <motion.div {...fadeUp(0.25)} className="card p-5 rounded-2xl flex flex-col">
                    <div className="mb-3">
                        <h2 className="text-[14px] font-bold text-slate-800 dark:text-white">Spending by Category</h2>
                        <p className="text-[11px] text-slate-400 mt-0.5">All time breakdown</p>
                    </div>
                    {categoryData.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={140}>
                                <PieChart>
                                    <defs>
                                        {categoryData.map((d, idx) => (
                                            <linearGradient key={d.name} id={`pie-${idx}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={CAT_COLORS[d.name] || COL_ARR[idx % COL_ARR.length]} stopOpacity={1} />
                                                <stop offset="100%" stopColor={CAT_COLORS[d.name] || COL_ARR[idx % COL_ARR.length]} stopOpacity={0.7} />
                                            </linearGradient>
                                        ))}
                                    </defs>
                                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius="48%" outerRadius="80%" paddingAngle={3} dataKey="value" strokeWidth={0}>
                                        {categoryData.map((d, idx) => (
                                            <Cell key={idx} fill={`url(#pie-${idx})`} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<ChartTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="mt-2 flex flex-col gap-1.5">
                                {categoryData.slice(0, 4).map((d, idx) => {
                                    const pct = Math.round((d.value / totalExpenses) * 100);
                                    const col = CAT_COLORS[d.name] || COL_ARR[idx % COL_ARR.length];
                                    return (
                                        <div key={d.name} className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: col }} />
                                            <span className="text-[12px] text-slate-600 dark:text-slate-400 flex-1 font-medium">{d.name}</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-14 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.5, duration: 0.6 }}
                                                        className="h-full rounded-full" style={{ background: col }} />
                                                </div>
                                                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 w-8 text-right">{pct}%</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2 py-6">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                <PiggyBank size={20} className="opacity-40" />
                            </div>
                            <p className="text-sm font-medium">No expenses yet</p>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* ── Recent + AI Insights ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

                {/* Recent Transactions */}
                <motion.div {...fadeUp(0.28)} className="card p-5 rounded-2xl xl:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-[14px] font-bold text-slate-800 dark:text-white">Recent Transactions</h2>
                            <p className="text-[11px] text-slate-400 mt-0.5">Your latest activity</p>
                        </div>
                        <Link to="/expenses" className="flex items-center gap-1 text-[12px] font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-500 transition-colors">
                            View all <ChevronRight size={14} />
                        </Link>
                    </div>

                    {recent.length === 0 ? (
                        <div className="py-10 text-center">
                            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                <Clock size={20} className="text-slate-400" />
                            </div>
                            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No transactions yet</p>
                            <p className="text-xs text-slate-400 mt-1">Start adding expenses and income</p>
                        </div>
                    ) : (
                        <div className="space-y-0.5">
                            {recent.map((t, idx) => (
                                <motion.div
                                    key={`${t._id}-${idx}`}
                                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.04 }}
                                    className="flex items-center gap-3 py-2.5 px-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group cursor-default"
                                >
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${t.type === 'income'
                                        ? 'bg-emerald-100 dark:bg-emerald-900/25'
                                        : 'bg-rose-100 dark:bg-rose-900/25'
                                        }`}>
                                        {t.type === 'income'
                                            ? <TrendingUp size={14} className="text-emerald-600 dark:text-emerald-400" />
                                            : <TrendingDown size={14} className="text-rose-600  dark:text-rose-400" />
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-semibold text-slate-800 dark:text-white truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{t.title || t.source}</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                            {new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            {t.category && <span className="ml-1.5 text-slate-300 dark:text-slate-600">· {t.category}</span>}
                                        </p>
                                    </div>
                                    <p className={`text-[13px] font-bold flex-shrink-0 ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                        }`}>
                                        {t.type === 'income' ? '+' : '−'}{formatCurrency(t.amount)}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* AI Insights */}
                <motion.div {...fadeUp(0.32)} className="card p-5 rounded-2xl flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-sm">
                            <Sparkles size={13} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-[14px] font-bold text-slate-800 dark:text-white">AI Insights</h2>
                            <p className="text-[11px] text-slate-400">Personalized tips</p>
                        </div>
                    </div>

                    <div className="space-y-3 flex-1">
                        {insights.map((ins, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + i * 0.08 }}>
                                <InsightItem {...ins} />
                            </motion.div>
                        ))}
                    </div>

                    {/* Quick stats footer */}
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3">
                        <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                            <p className="text-[18px] font-bold text-violet-600 dark:text-violet-400">{expenses.length}</p>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5 uppercase tracking-wide">Expenses</p>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                            <p className="text-[18px] font-bold text-emerald-600 dark:text-emerald-400">{incomes.length}</p>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5 uppercase tracking-wide">Income</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Dashboard;
