const Income = require('../models/Income');

// Get income
const getIncome = async (req, res) => {
    try {
        const incomes = await Income.find({ userId: req.user.id }).sort({ date: -1 });
        res.json(incomes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add income
const addIncome = async (req, res) => {
    try {
        const { source, amount, date, description } = req.body;
        if (!source || !amount || !date) {
            return res.status(400).json({ message: 'Source, amount, and date are required' });
        }
        const income = await Income.create({
            userId: req.user.id, source, amount, date, description
        });
        res.status(201).json(income);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update income
const updateIncome = async (req, res) => {
    try {
        const income = await Income.findById(req.params.id);
        if (!income) return res.status(404).json({ message: 'Income not found' });
        if (income.userId.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

        const updatedIncome = await Income.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedIncome);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete income
const deleteIncome = async (req, res) => {
    try {
        const income = await Income.findById(req.params.id);
        if (!income) return res.status(404).json({ message: 'Income not found' });
        if (income.userId.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

        await income.deleteOne();
        res.json({ id: req.params.id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getIncome, addIncome, updateIncome, deleteIncome };
