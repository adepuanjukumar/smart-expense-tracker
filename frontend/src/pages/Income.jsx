import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import Spinner from '../components/Spinner';
import { formatCurrency } from '../utils/formatCurrency';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Download, Trash2, Edit2, Plus } from 'lucide-react';
import { CSVLink } from 'react-csv';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Income = () => {
    const [incomes, setIncomes] = useState([]);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({ source: '', amount: '', date: '', description: '' });
    const [editingId, setEditingId] = useState(null);

    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('Latest');

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedToDelete, setSelectedToDelete] = useState(null);

    const { user } = useSelector(state => state.auth);
    const tableRef = useRef(null);

    const fetchIncome = () => {
        setLoading(true);
        axios.get(${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/income', { headers: { Authorization: `Bearer ${user.token}` } })
            .then(res => { setIncomes(res.data); setLoading(false); })
            .catch(err => { console.error(err); setLoading(false); });
    };

    useEffect(() => { if (user) fetchIncome(); }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                const res = await axios.put(`' + import.meta.env.VITE_API_URL || 'http://localhost:5000'/api/income/${editingId}`, formData, { headers: { Authorization: `Bearer ${user.token}` } });
                setIncomes(incomes.map(inc => inc._id === editingId ? res.data : inc));
                toast.success('Income successfully modified!');
                setEditingId(null);
            } else {
                const res = await axios.post(${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/income', formData, { headers: { Authorization: `Bearer ${user.token}` } });
                setIncomes([res.data, ...incomes]);
                toast.success('New Income logged!');
            }
            setFormData({ source: '', amount: '', date: '', description: '' });
        } catch (err) {
            toast.error(editingId ? 'Failed to update income' : 'Failed to add income');
        }
    };

    const executeDelete = async () => {
        if (!selectedToDelete) return;
        try {
            await axios.delete(`' + import.meta.env.VITE_API_URL || 'http://localhost:5000'/api/income/${selectedToDelete}`, { headers: { Authorization: `Bearer ${user.token}` } });
            setIncomes(incomes.filter(i => i._id !== selectedToDelete));
            toast.success('Income record purged.');
            setDeleteModalOpen(false);
            setSelectedToDelete(null);
        } catch (err) {
            toast.error('Deletion error from server');
        }
    };

    const handleEditClick = (inc) => {
        setEditingId(inc._id);
        setFormData({ source: inc.source, amount: inc.amount, date: inc.date.split('T')[0], description: inc.description || '' });
    };

    const exportPDF = () => {
        html2canvas(tableRef.current).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save("income_report.pdf");
            toast.success("PDF Download Generated!");
        });
    }

    const filtered = incomes.filter(i => {
        return i.source.toLowerCase().includes(search.toLowerCase()) || (i.description && i.description.toLowerCase().includes(search.toLowerCase()));
    }).sort((a, b) => {
        if (sortBy === 'Latest') return new Date(b.date) - new Date(a.date);
        if (sortBy === 'Highest') return b.amount - a.amount;
        if (sortBy === 'Lowest') return a.amount - b.amount;
        return 0;
    });

    if (loading) return <Spinner />;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 w-full max-w-[1400px] mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Income Streams</h1>
                    <p className="text-slate-500 mt-1 dark:text-slate-400">View, search, and manage your incoming revenue securely.</p>
                </div>
                <div className="flex flex-wrap gap-4 mt-6 sm:mt-0">
                    <button onClick={exportPDF} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white flex items-center gap-2 rounded-xl hover:bg-slate-200 transition-colors font-bold tracking-wide">
                        <Download size={18} /> Export PDF
                    </button>
                    {filtered.length > 0 && (
                        <CSVLink data={filtered} filename="income_records.csv" className="px-5 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white flex items-center gap-2 rounded-xl hover:bg-slate-200 transition-colors font-bold tracking-wide">
                            <Download size={18} /> CSV Raw
                        </CSVLink>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-1 bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-700 h-fit">
                    <h2 className="text-xl font-bold mb-6 dark:text-white flex items-center gap-2">
                        {editingId ? <><Edit2 className="text-primary-500" size={24} /> Modify Income</> : <><Plus className="text-primary-500" size={24} /> Insert New Income</>}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Income Source</label>
                            <input type="text" placeholder="Salary, Freelance, Dividend..." className="w-full p-3.5 bg-slate-50 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all" value={formData.source} onChange={e => setFormData({ ...formData, source: e.target.value })} required />
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Amount</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3.5 text-slate-500 font-bold">₹</span>
                                    <input type="number" placeholder="0.00" className="w-full pl-9 p-3.5 bg-slate-50 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} required />
                                </div>
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Record Date</label>
                                <input type="date" className="w-full p-3.5 bg-slate-50 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Description (Optional)</label>
                            <input type="text" placeholder="Monthly main salary" className="w-full p-3.5 bg-slate-50 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                        </div>

                        <div className="pt-4 flex gap-4">
                            <button type="submit" className="flex-1 bg-gradient-to-r from-accent-green to-green-600 text-white p-4 rounded-xl hover:shadow-lg hover:shadow-green-500/20 font-extrabold tracking-wide transition-all hover:-translate-y-0.5">
                                {editingId ? 'Save Core Changes' : 'Append Income'}
                            </button>
                            {editingId && <button type="button" onClick={() => { setEditingId(null); setFormData({ source: '', amount: '', date: '', description: '' }); }} className="px-6 bg-slate-200 dark:bg-slate-700 rounded-xl text-slate-700 dark:text-white hover:bg-slate-300 transition-colors font-bold">Cancel</button>}
                        </div>
                    </form>
                </div>

                <div className="xl:col-span-2 bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                        <h2 className="text-xl font-bold dark:text-white truncate lg:mr-auto">Ledger History</h2>
                        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                            <div className="relative flex-1 sm:flex-none">
                                <Search className="absolute left-4 top-3 text-slate-400" size={18} />
                                <input type="text" placeholder="Search source..." className="w-full sm:w-48 pl-11 p-2.5 bg-slate-100 dark:bg-slate-900 dark:text-white border-transparent rounded-xl focus:ring-2 focus:ring-primary-500 font-medium placeholder-slate-400" value={search} onChange={e => setSearch(e.target.value)} />
                            </div>
                            <select className="p-2.5 px-4 bg-slate-100 dark:bg-slate-900 dark:text-white border-transparent rounded-xl focus:ring-2 focus:ring-primary-500 font-medium cursor-pointer" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                                <option>Latest</option><option>Highest</option><option>Lowest</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex-1 overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-700" ref={tableRef}>
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs tracking-widest uppercase">
                                    <th className="p-4 font-bold">Processed Date</th>
                                    <th className="p-4 font-bold">Source Title</th>
                                    <th className="p-4 font-bold">Description</th>
                                    <th className="p-4 font-bold">Total Gain</th>
                                    <th className="p-4 font-bold text-center">Settings</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-800">
                                {filtered.map(inc => (
                                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} layoutId={inc._id} key={inc._id} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                                        <td className="p-5 dark:text-slate-300 font-medium">{new Date(inc.date).toLocaleDateString('en-GB')}</td>
                                        <td className="p-5 font-extrabold text-slate-800 dark:text-white text-base">{inc.source}</td>
                                        <td className="p-5 text-slate-500 dark:text-slate-400">{inc.description || '-'}</td>
                                        <td className="p-5 text-accent-green font-extrabold text-lg">+{formatCurrency(inc.amount)}</td>
                                        <td className="p-5 text-center">
                                            <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEditClick(inc)} className="p-2 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"><Edit2 size={18} /></button>
                                                <button onClick={() => { setSelectedToDelete(inc._id); setDeleteModalOpen(true); }} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"><Trash2 size={18} /></button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="p-16 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center w-full">
                                            <div className="bg-slate-50 dark:bg-slate-900 rounded-full p-5 mb-4 shadow-inner"><Search size={40} className="text-slate-300 dark:text-slate-600" /></div>
                                            <p className="text-xl font-bold">No Transaction Records Found</p>
                                            <p className="mt-2 text-sm">Log your incoming cashflow to see data here.</p>
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
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white dark:bg-slate-800 p-10 rounded-[2rem] shadow-2xl max-w-sm w-full border border-slate-100 dark:border-slate-700">
                            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><Trash2 size={36} /></div>
                            <h3 className="text-2xl font-extrabold text-center mb-3 dark:text-white tracking-tight">Erase the Record?</h3>
                            <p className="text-center text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">This action cannot be undone. Once deleted, this amount will no longer impact your monthly budget limit.</p>
                            <div className="flex gap-4">
                                <button onClick={() => { setDeleteModalOpen(false); setSelectedToDelete(null); }} className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white rounded-xl font-bold transition-colors shadow-sm">Cancel</button>
                                <button onClick={executeDelete} className="flex-1 py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-500/30 transition-all">Erase Data</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
export default Income;
