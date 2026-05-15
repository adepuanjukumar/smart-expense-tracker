const Expense = require('../models/Expense');

// Get expenses
const getExpenses = async (req, res) => {
    try {
        const expenses = await Expense.find({ userId: req.user.id }).sort({ date: -1 });
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add expense
const addExpense = async (req, res) => {
    try {
        const { title, amount, category, date, paymentMethod, notes } = req.body;
        const expense = await Expense.create({
            userId: req.user.id, title, amount, category, date, paymentMethod, notes
        });
        res.status(201).json(expense);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update expense
const updateExpense = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);
        if (!expense) return res.status(404).json({ message: 'Expense not found' });
        if (expense.userId.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

        const updatedExpense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedExpense);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete expense
const deleteExpense = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);
        if (!expense) return res.status(404).json({ message: 'Expense not found' });
        if (expense.userId.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

        await expense.deleteOne();
        res.json({ id: req.params.id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getExpenses, addExpense, updateExpense, deleteExpense };
