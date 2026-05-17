import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import API_BASE from '../utils/api';
import { toast } from 'react-toastify';
import { formatCurrency } from '../utils/formatCurrency';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Download, Trash2, Edit2, Plus, X, Receipt, SlidersHorizontal, TrendingDown } from 'lucide-react';
import { CSVLink } from 'react-csv';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const CATEGORIES = ['Food', 'Travel', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Others'];
const PAYMENT_METHODS = ['Card', 'Cash', 'Bank Transfer'];

const CAT_STYLES = {
    Food: 'bg-purple-100/80 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    Travel: 'bg-blue-100/80 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    Shopping: 'bg-amber-100/80 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    Bills: 'bg-red-100/80 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    Entertainment: 'bg-pink-100/80 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    Health: 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    Education: 'bg-cyan-100/80 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    Others: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

const SkeletonRow = () => (
    <tr><td colSpan={6} className="px-4 py-3.5"><div className="skeleton h-4 w-full rounded" /></td></tr>
);

const Expenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ title: '', amount: '', category: 'Food', date: '', paymentMethod: 'Card' });
    const [editingId, setEditingId] = useState(null);
    const [search, setSearch] = useState('');
    const [filterCat, setFilterCat] = useState('All');
    const [sortBy, setSortBy] = useState('Latest');
    const [deleteModal, setDeleteModal] = useState({ open: false, id: null });
    const [showForm, setShowForm] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const tableRef = useRef(null);
    const { user } = useSelector(state => state.auth);

    const fetchExpenses = () => {
        setLoading(true);
        axios.get(`${API_BASE}/api/expenses`, { headers: { Authorization: `Bearer ${user.token}` } })
            .then(res => { setExpenses(res.data); setLoading(false); })
            .catch(err => { console.error(err); setLoading(false); });
    };

    useEffect(() => { if (user) fetchExpenses(); }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                const res = await axios.put(`${API_BASE}/api/expenses/${editingId}`, formData, { headers: { Authorization: `Bearer ${user.token}` } });
                setExpenses(expenses.map(x => x._id === editingId ? res.data : x));
                toast.success('Expense updated!');
                setEditingId(null);
            } else {
                const res = await axios.post(`${API_BASE}/api/expenses`, formData, { headers: { Authorization: `Bearer ${user.token}` } });
                setExpenses([res.data, ...expenses]);
                toast.success('Expense added!');
            }
            setFormData({ title: '', amount: '', category: 'Food', date: '', paymentMethod: 'Card' });
            setShowForm(false);
        } catch { toast.error('Something went wrong'); }
    };

    const executeDelete = async () => {
        try {
            await axios.delete(`${API_BASE}/api/expenses/${deleteModal.id}`, { headers: { Authorization: `Bearer ${user.token}` } });
            setExpenses(expenses.filter(e => e._id !== deleteModal.id));
            toast.success('Expense deleted');
            setDeleteModal({ open: false, id: null });
        } catch { toast.error('Failed to delete'); }
    };

    const handleEdit = (exp) => {
        setEditingId(exp._id); setShowForm(true);
        setFormData({ title: exp.title, amount: exp.amount, category: exp.category, date: exp.date.split('T')[0], paymentMethod: exp.paymentMethod });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingId(null); setShowForm(false);
        setFormData({ title: '', amount: '', category: 'Food', date: '', paymentMethod: 'Card' });
    };

    const exportPDF = () => {
        html2canvas(tableRef.current).then(canvas => {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const w = pdf.internal.pageSize.getWidth();
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, w, (canvas.height * w) / canvas.width);
            pdf.save('expenses.pdf'); toast.success('PDF saved!');
        });
    };

    const filtered = expenses
        .filter(e => (filterCat === 'All' || e.category === filterCat) && e.title.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === 'Latest') return new Date(b.date) - new Date(a.date);
            if (sortBy === 'Highest') return b.amount - a.amount;
            if (sortBy === 'Lowest') return a.amount - b.amount;
            return 0;
        });

    const totalFiltered = filtered.reduce((s, e) => s + e.amount, 0);
    const totalAll = expenses.reduce((s, e) => s + e.amount, 0);
    const avgExpense = expenses.length > 0 ? totalAll / expenses.length : 0;

    return (
        <div className="space-y-4 max-w-[1400px] mx-auto">

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Receipt size={18} className="text-rose-500" /> Expenses
                    </h1>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Manage and track what you spend</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button onClick={exportPDF} className="btn-ghost text-[12px] px-3 py-2">
                        <Download size={13} /> PDF
                    </button>
                    {filtered.length > 0 && (
                        <CSVLink data={filtered} filename="expenses.csv" className="btn-ghost text-[12px] px-3 py-2 flex items-center gap-1.5">
                            <Download size={13} /> CSV
                        </CSVLink>
                    )}
                    <button
                        onClick={() => { setShowForm(f => !f); if (editingId) cancelEdit(); }}
                        className="btn-danger text-[12px] px-3.5 py-2"
                    >
                        <Plus size={14} /> {showForm && !editingId ? 'Cancel' : 'Add Expense'}
                    </button>
                </div>
            </motion.div>

            {/* Mini stat strip */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
                className="grid grid-cols-3 gap-3">
                {[
                    { label: 'Total Spent', value: formatCurrency(totalAll), color: 'text-rose-600 dark:text-rose-400' },
                    { label: 'Records', value: expenses.length, color: 'text-violet-600 dark:text-violet-400' },
                    { label: 'Avg. Expense', value: formatCurrency(avgExpense), color: 'text-amber-600 dark:text-amber-400' },
                ].map(s => (
                    <div key={s.label} className="card p-3.5 rounded-xl text-center card-hover">
                        <p className={`text-[15px] font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5 uppercase tracking-wide">{s.label}</p>
                    </div>
                ))}
            </motion.div>

            {/* Add / Edit Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="card p-5 rounded-2xl border-l-4 border-rose-500">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-[13px] font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    {editingId ? <Edit2 size={14} className="text-rose-500" /> : <Plus size={14} className="text-rose-500" />}
                                    {editingId ? 'Edit Expense' : 'New Expense'}
                                </h2>
                                <button onClick={cancelEdit} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                    <X size={15} />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                                <div className="lg:col-span-2">
                                    <label className="form-label">Description</label>
                                    <input type="text" placeholder="e.g. Lunch, Uber, Netflix…" className="form-input" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
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
                                    <label className="form-label">Category</label>
                                    <select className="form-input" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label">Payment</label>
                                    <select className="form-input" value={formData.paymentMethod} onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}>
                                        {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                                    </select>
                                </div>
                                <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1">
                                    <button type="submit" className="btn-danger flex-1">{editingId ? 'Save' : 'Add'}</button>
                                    {editingId && <button type="button" onClick={cancelEdit} className="btn-ghost">Cancel</button>}
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Table card */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card rounded-2xl overflow-hidden">
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row gap-2 p-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="relative flex-1 max-w-xs">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input type="text" placeholder="Search expenses…" className="form-input pl-8 py-2" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => setShowFilters(f => !f)} className={`btn-ghost py-2 px-3 text-[12px] ${showFilters ? 'ring-2 ring-violet-400' : ''}`}>
                            <SlidersHorizontal size={13} /> Filters
                        </button>
                        <select className="form-input py-2 min-w-[110px] text-[12px]" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                            <option>Latest</option><option>Highest</option><option>Lowest</option>
                        </select>
                        {filtered.length > 0 && (
                            <div className="flex items-center gap-2 ml-auto text-[12px]">
                                <span className="text-slate-400">{filtered.length} records</span>
                                <span className="font-bold text-rose-600 dark:text-rose-400">{formatCurrency(totalFiltered)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Filter row */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex flex-wrap gap-2 overflow-hidden">
                            {['All', ...CATEGORIES].map(c => (
                                <button key={c} onClick={() => setFilterCat(c)}
                                    className={`text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all ${filterCat === c ? 'bg-violet-600 text-white shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-violet-400'}`}>
                                    {c}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Table */}
                <div className="overflow-x-auto" ref={tableRef}>
                    <table className="data-table min-w-[640px]">
                        <thead>
                            <tr>
                                <th>Date</th><th>Description</th><th>Category</th><th>Payment</th><th>Amount</th>
                                <th className="text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [0, 1, 2, 3, 4].map(i => <SkeletonRow key={i} />)
                            ) : (
                                <AnimatePresence>
                                    {filtered.map((exp, idx) => (
                                        <motion.tr key={exp._id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ delay: idx * 0.03 }} className="group">
                                            <td className="text-slate-500 dark:text-slate-400 text-[12px] whitespace-nowrap font-medium">
                                                {new Date(exp.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="font-semibold text-slate-800 dark:text-white text-[13px]">{exp.title}</td>
                                            <td><span className={`badge text-[11px] ${CAT_STYLES[exp.category] || CAT_STYLES.Others}`}>{exp.category}</span></td>
                                            <td className="text-slate-400 dark:text-slate-500 text-[12px]">{exp.paymentMethod}</td>
                                            <td className="font-bold text-rose-600 dark:text-rose-400 text-[13px]">−{formatCurrency(exp.amount)}</td>
                                            <td>
                                                <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEdit(exp)} className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"><Edit2 size={13} /></button>
                                                    <button onClick={() => setDeleteModal({ open: true, id: exp._id })} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"><Trash2 size={13} /></button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            )}
                            {!loading && filtered.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                                                <TrendingDown size={22} className="text-slate-300 dark:text-slate-600" />
                                            </div>
                                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No expenses found</p>
                                            <p className="text-xs text-slate-400 dark:text-slate-500">Try changing your search or filters</p>
                                            <button onClick={() => setShowForm(true)} className="btn-danger text-xs px-4 py-2 mt-1">+ Add Expense</button>
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
                            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1.5">Delete Expense?</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">This action is permanent and cannot be undone.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteModal({ open: false, id: null })} className="btn-ghost flex-1 text-[13px]">Cancel</button>
                                <button onClick={executeDelete} className="btn-danger flex-1 text-[13px]">Delete</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Expenses;
