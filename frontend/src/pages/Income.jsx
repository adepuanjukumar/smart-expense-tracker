import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import API_BASE from '../utils/api';
import { toast } from 'react-toastify';
import { formatCurrency } from '../utils/formatCurrency';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Download, Trash2, Edit2, Plus, X, Wallet, TrendingUp, BarChart3 } from 'lucide-react';
import { CSVLink } from 'react-csv';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

const Income = () => {
    const [incomes, setIncomes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ source: '', amount: '', date: '', description: '' });
    const [editingId, setEditingId] = useState(null);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('Latest');
    const [deleteModal, setDeleteModal] = useState({ open: false, id: null });
    const [showForm, setShowForm] = useState(false);
    const tableRef = useRef(null);
    const { user } = useSelector(state => state.auth);

    const fetchIncome = () => {
        setLoading(true);
        axios.get(`${API_BASE}/api/income`, { headers: { Authorization: `Bearer ${user.token}` } })
            .then(res => { setIncomes(res.data); setLoading(false); })
            .catch(err => { console.error(err); setLoading(false); });
    };

    useEffect(() => { if (user) fetchIncome(); }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                const res = await axios.put(`${API_BASE}/api/income/${editingId}`, formData, { headers: { Authorization: `Bearer ${user.token}` } });
                setIncomes(incomes.map(i => i._id === editingId ? res.data : i));
                toast.success('Income updated!'); setEditingId(null);
            } else {
                const res = await axios.post(`${API_BASE}/api/income`, formData, { headers: { Authorization: `Bearer ${user.token}` } });
                setIncomes([res.data, ...incomes]); toast.success('Income added!');
            }
            setFormData({ source: '', amount: '', date: '', description: '' }); setShowForm(false);
        } catch { toast.error('Something went wrong'); }
    };

    const executeDelete = async () => {
        try {
            await axios.delete(`${API_BASE}/api/income/${deleteModal.id}`, { headers: { Authorization: `Bearer ${user.token}` } });
            setIncomes(incomes.filter(i => i._id !== deleteModal.id));
            toast.success('Income deleted'); setDeleteModal({ open: false, id: null });
        } catch { toast.error('Failed to delete'); }
    };

    const handleEdit = (inc) => {
        setEditingId(inc._id); setShowForm(true);
        setFormData({ source: inc.source, amount: inc.amount, date: inc.date.split('T')[0], description: inc.description || '' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingId(null); setShowForm(false);
        setFormData({ source: '', amount: '', date: '', description: '' });
    };

    const exportPDF = () => {
        html2canvas(tableRef.current).then(canvas => {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const w = pdf.internal.pageSize.getWidth();
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, w, (canvas.height * w) / canvas.width);
            pdf.save('income.pdf'); toast.success('PDF saved!');
        });
    };

    const filtered = incomes
        .filter(i => i.source.toLowerCase().includes(search.toLowerCase()) || (i.description && i.description.toLowerCase().includes(search.toLowerCase())))
        .sort((a, b) => {
            if (sortBy === 'Latest') return new Date(b.date) - new Date(a.date);
            if (sortBy === 'Highest') return b.amount - a.amount;
            if (sortBy === 'Lowest') return a.amount - b.amount;
            return 0;
        });

    const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
    const avgIncome = incomes.length > 0 ? totalIncome / incomes.length : 0;
    const maxIncome = incomes.length > 0 ? Math.max(...incomes.map(i => i.amount)) : 0;

    /* Mini area chart data */
    const sparkData = [...incomes].sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-10).map(i => ({ v: i.amount }));

    if (loading) return (
        <div className="space-y-4 max-w-[1400px] mx-auto">
            <div className="skeleton h-6 w-28 rounded" />
            <div className="grid grid-cols-3 gap-3">{[0, 1, 2].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
            <div className="skeleton h-64 rounded-2xl" />
        </div>
    );

    return (
        <div className="space-y-4 max-w-[1400px] mx-auto">

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Wallet size={18} className="text-emerald-500" /> Income
                    </h1>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Track all your income sources</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button onClick={exportPDF} className="btn-ghost text-[12px] px-3 py-2"><Download size={13} /> PDF</button>
                    {filtered.length > 0 && (
                        <CSVLink data={filtered} filename="income.csv" className="btn-ghost text-[12px] px-3 py-2 flex items-center gap-1.5"><Download size={13} /> CSV</CSVLink>
                    )}
                    <button onClick={() => { setShowForm(f => !f); if (editingId) cancelEdit(); }}
                        className="btn-success text-[12px] px-3.5 py-2">
                        <Plus size={14} /> {showForm && !editingId ? 'Cancel' : 'Add Income'}
                    </button>
                </div>
            </motion.div>

            {/* Stat cards with sparkline */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                    className="card p-4 rounded-2xl card-hover sm:col-span-1 relative overflow-hidden">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Total Income</p>
                            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(totalIncome)}</p>
                            <p className="text-[11px] text-slate-400 mt-1">{incomes.length} entries</p>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            <TrendingUp size={16} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </div>
                    {sparkData.length > 2 && (
                        <div className="mt-2 -mx-1">
                            <ResponsiveContainer width="100%" height={40}>
                                <AreaChart data={sparkData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="incSpark" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="v" stroke="#10b981" strokeWidth={1.5} fill="url(#incSpark)" dot={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="card p-4 rounded-2xl card-hover flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                        <BarChart3 size={16} className="text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Average</p>
                        <p className="text-xl font-bold text-slate-800 dark:text-white mt-0.5">{formatCurrency(avgIncome)}</p>
                        <p className="text-[11px] text-slate-400">per entry</p>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                    className="card p-4 rounded-2xl card-hover flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                        <TrendingUp size={16} className="text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Highest</p>
                        <p className="text-xl font-bold text-slate-800 dark:text-white mt-0.5">{formatCurrency(maxIncome)}</p>
                        <p className="text-[11px] text-slate-400">single entry</p>
                    </div>
                </motion.div>
            </div>

            {/* Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="card p-5 rounded-2xl border-l-4 border-emerald-500">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-[13px] font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    {editingId ? <Edit2 size={14} className="text-emerald-500" /> : <Plus size={14} className="text-emerald-500" />}
                                    {editingId ? 'Edit Income' : 'New Income Entry'}
                                </h2>
                                <button onClick={cancelEdit} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={15} /></button>
                            </div>
                            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                <div>
                                    <label className="form-label">Source</label>
                                    <input type="text" placeholder="e.g. Salary, Freelance…" className="form-input" value={formData.source} onChange={e => setFormData({ ...formData, source: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="form-label">Amount (₹)</label>
                                    <input type="number" placeholder="0.00" min="0" step="0.01" className="form-input" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="form-label">Date</label>
                                    <input type="date" className="form-input" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="form-label">Note (optional)</label>
                                    <input type="text" placeholder="e.g. Monthly salary" className="form-input" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                                </div>
                                <div className="sm:col-span-2 lg:col-span-4 flex gap-2">
                                    <button type="submit" className="btn-success text-[13px] px-5">{editingId ? 'Save Changes' : 'Add Income'}</button>
                                    {editingId && <button type="button" onClick={cancelEdit} className="btn-ghost text-[13px]">Cancel</button>}
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Table */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="card rounded-2xl overflow-hidden">
                <div className="flex flex-col sm:flex-row gap-2 p-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="relative flex-1 max-w-xs">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input type="text" placeholder="Search income…" className="form-input pl-8 py-2" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                        <select className="form-input py-2 min-w-[110px] text-[12px]" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                            <option>Latest</option><option>Highest</option><option>Lowest</option>
                        </select>
                        {filtered.length > 0 && (
                            <span className="text-[12px] font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(filtered.reduce((s, i) => s + i.amount, 0))}</span>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto" ref={tableRef}>
                    <table className="data-table min-w-[540px]">
                        <thead>
                            <tr><th>Date</th><th>Source</th><th>Description</th><th>Amount</th><th className="text-center">Actions</th></tr>
                        </thead>
                        <tbody>
                            <AnimatePresence>
                                {filtered.map((inc, idx) => (
                                    <motion.tr key={inc._id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ delay: idx * 0.03 }} className="group">
                                        <td className="text-slate-400 text-[12px] whitespace-nowrap font-medium">
                                            {new Date(inc.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="font-semibold text-slate-800 dark:text-white text-[13px]">{inc.source}</td>
                                        <td className="text-slate-400 text-[12px]">{inc.description || <span className="text-slate-300 dark:text-slate-600">—</span>}</td>
                                        <td className="font-bold text-emerald-600 dark:text-emerald-400 text-[13px]">+{formatCurrency(inc.amount)}</td>
                                        <td>
                                            <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(inc)} className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"><Edit2 size={13} /></button>
                                                <button onClick={() => setDeleteModal({ open: true, id: inc._id })} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"><Trash2 size={13} /></button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-16 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                                                <Wallet size={22} className="text-slate-300 dark:text-slate-600" />
                                            </div>
                                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No income records</p>
                                            <p className="text-xs text-slate-400">Add your first source of income</p>
                                            <button onClick={() => setShowForm(true)} className="btn-success text-xs px-4 py-2 mt-1">+ Add Income</button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Delete modal */}
            <AnimatePresence>
                {deleteModal.open && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
                            className="card p-7 rounded-2xl max-w-sm w-full text-center shadow-2xl">
                            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={20} className="text-rose-600 dark:text-rose-400" />
                            </div>
                            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1.5">Delete Income Record?</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">This action is permanent and cannot be undone.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteModal({ open: false, id: null })} className="btn-ghost flex-1">Cancel</button>
                                <button onClick={executeDelete} className="btn-danger flex-1">Delete</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Income;
