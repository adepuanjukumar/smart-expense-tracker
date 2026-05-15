import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Expenses from './pages/Expenses';
import Income from './pages/Income';
import Budget from './pages/Budget';

function App() {
    return (
        <>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/" element={<Layout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="expenses" element={<Expenses />} />
                        <Route path="income" element={<Income />} />
                        <Route path="budget" element={<Budget />} />
                    </Route>
                </Routes>
            </Router>
            <ToastContainer position="top-right" autoClose={3000} />
        </>
    );
}

export default App;
