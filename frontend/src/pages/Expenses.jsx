import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import API_BASE from '../utils/api';
import { toast } from 'react-toastify';
import Spinner from '../components/Spinner';
import { formatCurrency } from '../utils/formatCurrency';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Download, Trash2, Edit2, Plus, Sparkles } from 'lucide-react';
import { CSVLink } from 'react-csv';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Expenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({ title: '', amount: '', category: 'Food', date: '', paymentMethod: 'Card' });
    const [editingId, setEditingId] = useState(null);

    const [search, setSearch] = useState('');
    const [filterCat, setFilterCat] = useState('All');
    const [sortBy, setSortBy] = useState('Latest');

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedToDelete, setSelectedToDelete] = useState(null);

    const { user } = useSelector(state => state.auth);
    const tableRef = useRef(null);

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
                setExpenses(expenses.map(exp => exp._id === editingId ? res.data : exp));
                toast.success('Vector sequence synchronized!');
                setEditingId(null);
            } else {
                const res = await axios.post(`${API_BASE}/api/expenses`, formData, { headers: { Authorization: `Bearer ${user.token}` } });
                setExpenses([res.data, ...expenses]);
                toast.success('Matrix entry recorded!');
            }
            setFormData({ title: '', amount: '', category: 'Food', date: '', paymentMethod: 'Card' });
        } catch (err) {
            toast.error(editingId ? 'Matrix modification failed' : 'Upload rejected');
        }
    };

    const executeDelete = async () => {
        if (!selectedToDelete) return;
        try {
            await axios.delete(`${API_BASE}/api/expenses/${selectedToDelete}`, { headers: { Authorization: `Bearer ${user.token}` } });
            setExpenses(expenses.filter(e => e._id !== selectedToDelete));
            toast.success('Data node permanently purged.');
            setDeleteModalOpen(false);
            setSelectedToDelete(null);
        } catch (err) {
            toast.error('Deletion error from external cluster');
        }
    };

    const handleEditClick = (exp) => {
        setEditingId(exp._id);
        setFormData({ title: exp.title, amount: exp.amount, category: exp.category, date: exp.date.split('T')[0], paymentMethod: exp.paymentMethod });
    };

    const exportPDF = () => {
        html2canvas(tableRef.current).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save("expenses_report.pdf");
            toast.success("PDF Blueprint Generated!");
        });
    }

    const filtered = expenses.filter(e => {
        return (filterCat === 'All' || e.category === filterCat) && e.title.toLowerCase().includes(search.toLowerCase());
    }).sort((a, b) => {
        if (sortBy === 'Latest') return new Date(b.date) - new Date(a.date);
        if (sortBy === 'Highest') return b.amount - a.amount;
        if (sortBy === 'Lowest') return a.amount - b.amount;
        return 0;
    });

    if (loading) return <Spinner />;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 w-full max-w-[1400px] mx-auto pb-10">
            <div className="flex flex-col sm:flex-row justify-between items-center glass-panel p-6 sm:p-8 rounded-[2.5rem]">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight"><Sparkles className="text-indigo-500" size={28} />Expense Ledger</h1>
                    <p className="text-slate-500 mt-2 dark:text-slate-400 font-medium">Quantify, search, and parse your outgoing cashflow matrix.</p>
                </div>
                <div className="flex flex-wrap gap-4 mt-6 sm:mt-0">
                    <button onClick={exportPDF} className="px-5 py-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center gap-2 rounded-2xl transition-all font-bold tracking-wide shadow-sm">
                        <Download size={18} /> PDF Log
                    </button>
                    {filtered.length > 0 && (
                        <CSVLink data={filtered} filename="expenses_records.csv" className="px-5 py-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 flex items-center gap-2 rounded-2xl transition-all font-bold tracking-wide shadow-sm">
                            <Download size={18} /> CSV Format
                        </CSVLink>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
                <div className="xl:col-span-1 glass-card p-8 sm:p-10 rounded-[2.5rem] h-fit">
                    <h2 className="text-xl font-black mb-8 text-slate-900 dark:text-white flex items-center gap-3">
                        {editingId ? <><Edit2 className="text-indigo-500" size={24} /> Modify Entry</> : <><Plus className="text-indigo-500" size={24} /> Append Expense</>}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-2">Description Vector</label>
                            <input type="text" placeholder="Server costs, Travel..." className="w-full p-4 bg-white/50 dark:bg-[#080d1e]/80 border border-white/60 dark:border-indigo-500/20 dark:text-white rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all font-bold placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-inner" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-2">Cost Volume</label>
                                <div className="relative">
                                    <span className="absolute left-5 top-4 text-slate-500 font-extrabold pb-1">₹</span>
                                    <input type="number" placeholder="0.00" className="w-full pl-11 p-4 bg-white/50 dark:bg-[#080d1e]/80 border border-white/60 dark:border-indigo-500/20 dark:text-white rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all font-black placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-inner text-lg" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} required />
                                </div>
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-2">Timestamp</label>
                                <input type="date" className="w-full p-4 bg-white/50 dark:bg-[#080d1e]/80 border border-white/60 dark:border-indigo-500/20 dark:text-white rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all font-bold shadow-inner" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-2">Category Tag</label>
                                <select className="w-full p-4 bg-white/50 dark:bg-[#080d1e]/80 border border-white/60 dark:border-indigo-500/20 dark:text-white rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold shadow-inner appearance-none" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                    <option>Food</option><option>Travel</option><option>Shopping</option><option>Bills</option><option>Entertainment</option><option>Health</option><option>Education</option><option>Others</option>
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-2">Protocol</label>
                                <select className="w-full p-4 bg-white/50 dark:bg-[#080d1e]/80 border border-white/60 dark:border-indigo-500/20 dark:text-white rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold shadow-inner appearance-none" value={formData.paymentMethod} onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}>
                                    <option>Card</option><option>Cash</option><option>Bank Transfer</option>
                                </select>
                            </div>
                        </div>
                        <div className="pt-6 flex gap-4">
                            <button type="submit" className="flex-1 bg-gradient-to-r from-rose-500 to-rose-600 text-white p-4 rounded-2xl shadow-[0_10px_20px_-5px_rgba(244,63,94,0.5)] font-black tracking-widest transition-all hover:-translate-y-1 uppercase text-sm">
                                {editingId ? 'Save Changes' : 'Execute Expense'}
                            </button>
                            {editingId && <button type="button" onClick={() => { setEditingId(null); setFormData({ title: '', amount: '', category: 'Food', date: '', paymentMethod: 'Card' }); }} className="px-8 bg-slate-200/50 dark:bg-white/10 rounded-2xl text-slate-700 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20 transition-colors font-bold shadow-sm uppercase text-xs tracking-widest">Abort</button>}
                        </div>
                    </form>
                </div>

                <div className="xl:col-span-2 glass-panel p-6 sm:p-10 rounded-[2.5rem] flex flex-col min-h-[500px]">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                        <h2 className="text-xl font-black dark:text-white truncate lg:mr-auto tracking-tight">Encrypted Ledger</h2>
                        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                            <div className="relative flex-1 sm:flex-none">
                                <Search className="absolute left-5 top-3.5 text-indigo-500 dark:text-indigo-400" size={18} />
                                <input type="text" placeholder="Search parameters..." className="w-full sm:w-56 pl-12 p-3 bg-white/50 dark:bg-[#080d1e]/80 border border-white/60 dark:border-indigo-500/20 dark:text-white rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold placeholder-slate-400 dark:placeholder-slate-500 shadow-inner text-sm" value={search} onChange={e => setSearch(e.target.value)} />
                            </div>
                            <div className="relative">
                                <Filter className="absolute left-5 top-3.5 text-indigo-500 dark:text-indigo-400" size={18} />
                                <select className="pl-12 p-3 bg-white/50 dark:bg-[#080d1e]/80 border border-white/60 dark:border-indigo-500/20 dark:text-white rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold appearance-none min-w-[150px] shadow-inner text-sm" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                                    <option value="All">All Scope</option><option>Food</option><option>Travel</option><option>Shopping</option><option>Bills</option><option>Entertainment</option><option>Health</option><option>Education</option><option>Others</option>
                                </select>
                            </div>
                            <select className="p-3 px-6 bg-white/50 dark:bg-[#080d1e]/80 border border-white/60 dark:border-indigo-500/20 dark:text-white rounded-2xl focus:ring-2 focus:ring-indigo-500 font-black cursor-pointer uppercase text-xs tracking-wider shadow-inner appearance-none" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                                <option>Latest</option><option>Highest</option><option>Lowest</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex-1 overflow-x-auto rounded-3xl border border-slate-200/50 dark:border-white/10" ref={tableRef}>
                        <table className="w-full text-left border-collapse min-w-[750px]">
                            <thead>
                                <tr className="bg-slate-200/50 dark:bg-white/5 border-b border-slate-200/50 dark:border-white/5 text-indigo-600 dark:text-indigo-400 text-xs font-black tracking-widest uppercase">
                                    <th className="p-5 pl-6 rounded-tl-3xl">Timestamp</th>
                                    <th className="p-5">Vector Title</th>
                                    <th className="p-5">Category Tag</th>
                                    <th className="p-5">Net Loss</th>
                                    <th className="p-5 pr-6 text-center rounded-tr-3xl">Admin</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white/30 dark:bg-[#080d1e]/40 divide-y divide-slate-100/50 dark:divide-white/5">
                                {filtered.map(exp => (
                                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} layoutId={exp._id} key={exp._id} className="hover:bg-white/60 dark:hover:bg-white/10 transition-colors group">
                                        <td className="p-5 pl-6 text-slate-600 dark:text-slate-400 font-bold text-sm tracking-wide">{new Date(exp.date).toLocaleDateString('en-GB')}</td>
                                        <td className="p-5 font-black text-slate-900 dark:text-white text-[15px]">{exp.title}</td>
                                        <td className="p-5"><span className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-300 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">{exp.category}</span></td>
                                        <td className="p-5 text-rose-600 dark:text-rose-400 font-black text-[16px] glow-text-red">-{formatCurrency(exp.amount)}</td>
                                        <td className="p-5 pr-6 text-center">
                                            <div className="flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEditClick(exp)} className="p-2.5 bg-white/50 dark:bg-white/5 border border-white/40 dark:border-white/10 text-indigo-500 hover:text-white hover:bg-indigo-500 dark:hover:bg-indigo-500 rounded-xl transition-all shadow-sm"><Edit2 size={16} /></button>
                                                <button onClick={() => { setSelectedToDelete(exp._id); setDeleteModalOpen(true); }} className="p-2.5 bg-white/50 dark:bg-white/5 border border-white/40 dark:border-white/10 text-rose-500 hover:text-white hover:bg-rose-500 dark:hover:bg-rose-500 rounded-xl transition-all shadow-sm"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="p-20 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center w-full">
                                            <div className="bg-white/50 dark:bg-white/5 rounded-[2rem] p-6 mb-6 shadow-inner border border-white/50 dark:border-white/10"><Search size={48} className="text-indigo-400 opacity-50" /></div>
                                            <p className="text-2xl font-black text-slate-700 dark:text-slate-300">0 Vectors Found</p>
                                            <p className="mt-2 font-medium">Input initial expense nodes to populate internal grid.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {deleteModalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 dark:bg-[#030712]/90 z-50 flex justify-center items-center p-4">
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="glass-panel p-10 rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(244,63,94,0.3)] max-w-sm w-full border border-rose-500/30">
                            <div className="w-24 h-24 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><Trash2 size={40} /></div>
                            <h3 className="text-3xl font-black text-center mb-3 text-slate-900 dark:text-white tracking-tighter">Purge Data?</h3>
                            <p className="text-center text-slate-600 dark:text-slate-400 mb-8 leading-relaxed font-bold">This command is irreversible. Confirm deletion of the encrypted ledger row.</p>
                            <div className="flex gap-4">
                                <button onClick={() => { setDeleteModalOpen(false); setSelectedToDelete(null); }} className="flex-1 py-4 bg-slate-200/50 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 dark:text-white rounded-2xl font-bold transition-colors shadow-sm tracking-widest uppercase text-xs">Abort</button>
                                <button onClick={executeDelete} className="flex-1 py-4 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-2xl font-black shadow-[0_10px_20px_-5px_rgba(244,63,94,0.5)] transition-all hover:shadow-[0_15px_30px_-5px_rgba(244,63,94,0.6)] hover:-translate-y-1 uppercase text-xs tracking-widest">Execute</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
export default Expenses;
