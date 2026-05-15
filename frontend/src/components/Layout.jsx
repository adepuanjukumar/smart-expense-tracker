import { Outlet, Link, useNavigate, useLocation, useOutlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout, reset } from '../features/auth/authSlice';
import ThemeToggle from './ThemeToggle';
import { LayoutDashboard, Receipt, Wallet, PieChart, Menu, X, LogOut, Bell, Search, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Layout = () => {
    const { user } = useSelector(state => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const currentOutlet = useOutlet(); // Critical fix for AnimatePresence routing blank-outs
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        dispatch(logout());
        dispatch(reset());
        navigate('/login');
    };

    const navLinks = [
        { name: 'Dashboard Central', path: '/', icon: <LayoutDashboard size={20} /> },
        { name: 'Expense Ledger', path: '/expenses', icon: <Receipt size={20} /> },
        { name: 'Income Protocol', path: '/income', icon: <Wallet size={20} /> },
        { name: 'Budget Hub', path: '/budget', icon: <PieChart size={20} /> }
    ];

    const SideContent = () => (
        <>
            <div className="p-8 font-black text-2xl tracking-tight flex items-center gap-3 relative z-10">
                <motion.div initial={{ rotate: 0 }} animate={{ rotate: 360 }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 shadow-[0_0_20px_rgba(99,102,241,0.6)] border border-white/30 hidden sm:flex">
                    <Sparkles size={22} className="text-white drop-shadow-[0_0_5px_rgba(255,255,255,1)]" />
                </motion.div>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 text-xl md:text-2xl whitespace-nowrap">Expense Tracker</span>
            </div>

            <div className="px-6 mb-4 mt-2">
                <p className="text-[10px] font-black text-indigo-500/80 dark:text-slate-500/80 tracking-[0.2em] uppercase mb-3 px-2">Main Protocol</p>
            </div>

            <nav className="flex-1 px-4 space-y-3 relative z-10">
                {navLinks.map(link => {
                    const isActive = location.pathname === link.path;
                    return (
                        <Link key={link.path} to={link.path} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all duration-300 relative group overflow-hidden ${isActive ? 'text-slate-900 dark:text-white transform scale-[1.02]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>

                            {isActive && (
                                <motion.div layoutId="activeNav" className="absolute inset-0 bg-white/60 dark:bg-gradient-to-r dark:from-indigo-500/30 dark:to-purple-500/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] border border-white/40 dark:border-white/10 dark:border-l-4 dark:border-l-indigo-400 z-0" />
                            )}

                            <div className={`relative z-10 flex items-center justify-center p-2.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.6)]' : 'bg-slate-200/50 dark:bg-slate-800/50 group-hover:bg-white group-hover:shadow-sm dark:group-hover:bg-slate-700'}`}>
                                {link.icon}
                            </div>
                            <span className="relative z-10 tracking-wide text-[15px] whitespace-nowrap">{link.name}</span>
                        </Link>
                    )
                })}
            </nav>
            {user && (
                <div className="p-6 mt-auto relative z-10">
                    <button onClick={handleLogout} className="flex justify-center items-center gap-3 w-full p-4 rounded-2xl bg-white/40 dark:bg-red-500/10 hover:bg-red-50 dark:hover:bg-red-500/20 border border-slate-200/50 dark:border-red-500/20 text-slate-600 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-all font-black text-sm uppercase tracking-wider group overflow-hidden relative">
                        <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" /> Sign Out
                    </button>
                </div>
            )}
        </>
    );

    return (
        <div className="flex text-slate-900 dark:text-slate-100 min-h-screen font-sans relative selection:bg-indigo-500/30 selection:text-white overflow-hidden">
            <div className="bg-mesh"><div className="bg-mesh-center"></div></div>

            <aside className="w-[280px] hidden lg:flex flex-col m-5 mr-0 rounded-[2.5rem] glass-panel z-20 relative border-l-0 shadow-[20px_0_40px_rgba(0,0,0,0.03)] dark:shadow-[20px_0_40px_rgba(0,0,0,0.3)]">
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 dark:from-indigo-900/10 dark:to-transparent pointer-events-none rounded-[2.5rem]"></div>
                <SideContent />
            </aside>

            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.aside initial={{ x: -400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -400, opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed inset-y-0 left-0 w-[280px] m-4 rounded-[2.5rem] glass-panel z-50 flex flex-col lg:hidden shadow-[0_0_50px_rgba(0,0,0,0.2)] dark:shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                        <button onClick={() => setMobileMenuOpen(false)} className="absolute top-8 right-6 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white p-2 rounded-full hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors z-50"><X size={24} /></button>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 dark:from-indigo-900/10 dark:to-transparent pointer-events-none rounded-[2.5rem]"></div>
                        <SideContent />
                    </motion.aside>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {mobileMenuOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 dark:bg-[#030712]/80 z-40 lg:hidden backdrop-blur-md" onClick={() => setMobileMenuOpen(false)}></motion.div>}
            </AnimatePresence>

            <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
                <header className="h-[96px] flex items-center px-6 lg:px-10 mt-5 mx-5 rounded-[2.5rem] glass-panel justify-between z-10 transition-all">

                    <div className="flex items-center gap-4 lg:hidden">
                        <button onClick={() => setMobileMenuOpen(true)} className="text-slate-700 dark:text-white p-3 bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 rounded-2xl transition-all border border-white/40 dark:border-white/10 shadow-sm"><Menu size={20} /></button>
                        <div className="font-extrabold text-xl sm:text-2xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-500 dark:from-indigo-400 dark:to-cyan-300">Expense Tracker</div>
                    </div>

                    <div className="hidden lg:flex flex-1 max-w-lg mx-6 relative group z-10">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors z-10" size={20} />
                        <input type="text" placeholder="Search transactions, analytics, budgets..." className="w-full bg-white/50 dark:bg-[#080d1e]/80 border border-white/60 dark:border-indigo-500/20 text-slate-900 dark:text-white pl-14 pr-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-[#0b132b] transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] placeholder:text-slate-500 dark:placeholder:text-slate-600 text-[15px] font-semibold" />
                    </div>

                    <div className="flex items-center gap-2 sm:gap-6 ml-auto z-10">
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="p-3.5 hidden sm:block bg-white/60 dark:bg-white/5 border border-white/50 dark:border-white/10 rounded-2xl relative text-slate-700 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-white/10 transition-all shadow-sm">
                            <Bell size={20} />
                            <span className="absolute top-2.5 right-3 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
                            <span className="absolute top-2.5 right-3 w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,1)]"></span>
                        </motion.button>

                        <ThemeToggle />

                        <div className="h-10 w-[1px] bg-slate-300 dark:bg-slate-800 mx-1 sm:mx-2 hidden sm:block"></div>

                        {user ? (
                            <motion.div whileHover={{ scale: 1.02 }} className="flex items-center gap-3 cursor-pointer p-1.5 sm:pr-5 rounded-full bg-white/60 dark:bg-[#080d1e]/80 border border-white/80 dark:border-indigo-500/20 hover:bg-white dark:hover:bg-[#0b132b] transition-all shadow-sm">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 flex items-center justify-center text-white font-black text-lg shadow-[0_0_20px_rgba(99,102,241,0.6)] border border-white/20">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="hidden sm:block">
                                    <p className="text-[15px] font-black text-slate-900 dark:text-white tracking-wide leading-tight">{user.name}</p>
                                    <p className="text-[10px] text-indigo-600 dark:text-cyan-400 font-extrabold uppercase tracking-widest leading-none mt-1">Premium Key</p>
                                </div>
                            </motion.div>
                        ) : (
                            <Link to="/login" className="px-6 sm:px-8 py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:bg-[length:200%_100%] bg-left hover:bg-right text-white rounded-2xl text-[13px] sm:text-[15px] font-black shadow-[0_10px_30px_-10px_rgba(99,102,241,0.8)] transition-all hover:-translate-y-1">Authenticate</Link>
                        )}
                    </div>
                </header>

                <main className="flex-1 p-5 md:p-8 xl:p-10 overflow-y-auto w-full relative z-0 hide-scrollbar pb-24">
                    {!user ? (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="flex justify-center items-center h-[70vh]">
                            <div className="text-center p-14 glass-panel rounded-[3rem] max-w-xl relative overflow-hidden group border-white dark:border-indigo-500/20">
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-cyan-500/10 dark:from-indigo-500/10 dark:to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                <div className="relative z-10">
                                    <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4 }} className="w-28 h-28 rounded-[2rem] flex items-center justify-center mx-auto mb-10 bg-white/80 dark:bg-[#080d1e] shadow-[0_20px_50px_rgba(99,102,241,0.3)] border border-white/50 dark:border-indigo-500/30 rotate-3">
                                        <Sparkles className="text-indigo-600 dark:text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" size={56} />
                                    </motion.div>
                                    <h2 className="text-5xl font-black mb-5 text-slate-900 dark:text-white tracking-tighter">Tracker Access</h2>
                                    <p className="text-slate-600 dark:text-slate-400 mb-12 leading-relaxed font-medium text-lg">Initialize a secure quantum session to access your personal asset matrix and begin processing data.</p>
                                    <Link to="/login" className="block w-full px-10 py-5 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 text-white rounded-[1.5rem] font-black shadow-[0_10px_40px_-10px_rgba(99,102,241,0.8)] hover:shadow-[0_20px_50px_-10px_rgba(99,102,241,1)] hover:-translate-y-1.5 transition-all text-xl uppercase tracking-widest relative overflow-hidden outline-none ring-0">
                                        <span className="relative z-10">Authorize Access</span>
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div key={location.pathname} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="h-full w-full">
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
