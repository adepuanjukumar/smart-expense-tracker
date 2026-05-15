const Budget = require('../models/Budget');

// Get budgets
const getBudget = async (req, res) => {
    try {
        const budgets = await Budget.find({ userId: req.user.id }).sort({ year: -1, month: -1 });
        res.json(budgets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Set budget for month
const setBudget = async (req, res) => {
    try {
        const { monthlyBudget, month, year } = req.body;
        let budget = await Budget.findOne({ userId: req.user.id, month, year });

        if (budget) {
            budget.monthlyBudget = monthlyBudget;
            await budget.save();
            return res.json(budget);
        }

        budget = await Budget.create({
            userId: req.user.id, monthlyBudget, month, year
        });
        res.status(201).json(budget);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getBudget, setBudget };
