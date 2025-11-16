/* ================================
   SMART BUDGET MANAGER - SHARED UTILITIES
   ================================ */

// ========== SHARED BUDGET MANAGER ==========
class BudgetManager {
    constructor() {
        this.transactions = this.loadFromStorage('transactions') || [];
        this.theme = this.loadFromStorage('theme') || 'light';

        this.init();
    }

    // Initialize app
    init() {
        this.applyTheme();
        this.setupMobileMenu();
        this.setupThemeToggle();
        this.setupDashboard();
    }

    // ========== STORAGE ==========
    saveToStorage(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    loadFromStorage(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    // ========== STORAGE ==========
    saveToStorage(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    loadFromStorage(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    // ========== THEME ==========
    setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        this.saveToStorage('theme', this.theme);
    }

    applyTheme() {
        if (this.theme === 'dark') {
            document.body.classList.add('dark-theme');
            const themeIcon = document.querySelector('.theme-icon');
            if (themeIcon) themeIcon.textContent = '☀️';
        } else {
            document.body.classList.remove('dark-theme');
            const themeIcon = document.querySelector('.theme-icon');
            if (themeIcon) themeIcon.textContent = '🌙';
        }
    }

    // ========== MOBILE MENU ==========
    setupMobileMenu() {
        const mobileToggle = document.getElementById('mobileToggle');
        const sidebar = document.getElementById('sidebar');

        if (mobileToggle && sidebar) {
            mobileToggle.addEventListener('click', () => {
                sidebar.classList.toggle('mobile-open');
            });
        }
    }

    // ========== DASHBOARD FUNCTIONS (for index.html) ==========
    setupDashboard() {
        // Only run on index.html (dashboard page)
        if (!document.getElementById('dashboard-section')) return;

        this.setDefaultDate();
        this.updateDashboard();
        this.renderRecentTransactions();
        this.generateInsights();
        this.setupTransactionForm();
    }

    setupTransactionForm() {
        const form = document.getElementById('transactionForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addTransaction();
            });
        }
    }

    addTransaction() {
        const description = document.getElementById('description').value.trim();
        const amount = parseFloat(document.getElementById('amount').value);
        const type = document.getElementById('type').value;
        const category = document.getElementById('category').value;
        const date = document.getElementById('date').value;

        if (!description || !amount || !date) {
            alert('Please fill all fields');
            return;
        }

        const transaction = {
            id: Date.now(),
            description,
            amount,
            type,
            category,
            date,
            timestamp: new Date().toISOString()
        };

        this.transactions.unshift(transaction);
        this.saveToStorage('transactions', this.transactions);

        // Reset form
        document.getElementById('transactionForm').reset();
        this.setDefaultDate();

        // Update UI
        this.updateDashboard();
        this.renderRecentTransactions();
        this.generateInsights();

        this.showNotification(`Transaction added: ${description}`);
    }

    deleteTransaction(id) {
        if (!confirm('Delete this transaction?')) return;

        this.transactions = this.transactions.filter(t => t.id !== id);
        this.saveToStorage('transactions', this.transactions);

        // Update UI
        this.updateDashboard();
        this.renderRecentTransactions();
        this.generateInsights();

        this.showNotification('Transaction deleted');
    }

    updateDashboard() {
        const totals = this.calculateTotals();

        const incomeEl = document.getElementById('totalIncome');
        const expenseEl = document.getElementById('totalExpense');
        const balanceEl = document.getElementById('balance');

        if (incomeEl) incomeEl.textContent = `₹${totals.income.toLocaleString('en-IN')}`;
        if (expenseEl) expenseEl.textContent = `₹${totals.expense.toLocaleString('en-IN')}`;
        if (balanceEl) balanceEl.textContent = `₹${totals.balance.toLocaleString('en-IN')}`;

        // Update goal progress if element exists
        this.updateGoalProgress(totals.balance);
    }

    calculateTotals() {
        const income = this.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expense = this.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        return {
            income,
            expense,
            balance: income - expense
        };
    }

    renderRecentTransactions(limit = 5) {
        const container = document.getElementById('recentTransactionsList');
        if (!container) return;

        const recent = this.transactions.slice(0, limit);

        if (recent.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No transactions yet. Add your first one!</p>';
            return;
        }

        container.innerHTML = recent.map(t => this.createTransactionHTML(t)).join('');

        // Attach delete handlers
        container.querySelectorAll('.transaction-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                this.deleteTransaction(id);
            });
        });
    }

    createTransactionHTML(transaction) {
        const categoryIcons = {
            food: '🍔', transport: '🚗', shopping: '🛍️', bills: '💡',
            entertainment: '🎬', health: '⚕️', education: '📚', salary: '💼', other: '📦'
        };

        const icon = categoryIcons[transaction.category] || '📦';
        const sign = transaction.type === 'income' ? '+' : '-';
        const formattedDate = new Date(transaction.date).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        });

        return `
            <div class="transaction-item ${transaction.type}">
                <div class="transaction-left">
                    <div class="transaction-icon">${icon}</div>
                    <div class="transaction-details">
                        <h4>${transaction.description}</h4>
                        <p class="transaction-meta">${formattedDate} • ${transaction.category}</p>
                    </div>
                </div>
                <div class="transaction-right">
                    <div class="transaction-amount ${transaction.type}">
                        ${sign}₹${transaction.amount.toLocaleString('en-IN')}
                    </div>
                    <button class="transaction-delete" data-id="${transaction.id}">🗑️ Delete</button>
                </div>
            </div>
        `;
    }

    updateGoalProgress(currentBalance) {
        const goal = this.loadFromStorage('goal') || { amount: 0 };
        const progressEl = document.getElementById('goalProgress');
        const progressBarEl = document.getElementById('goalProgressBar');

        if (!progressEl || !progressBarEl) return;

        if (goal.amount === 0) {
            progressEl.textContent = 'No goal set';
            progressBarEl.style.width = '0%';
            return;
        }

        const percentage = Math.min((currentBalance / goal.amount) * 100, 100);
        progressEl.textContent = `${percentage.toFixed(1)}%`;
        progressBarEl.style.width = `${percentage}%`;
    }

    generateInsights() {
        const container = document.getElementById('insightsContainer');
        if (!container) return;

        const insights = [];
        const totals = this.calculateTotals();

        if (this.transactions.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary);">Add transactions to see smart insights!</p>';
            return;
        }

        // Calculate category percentages
        const categoryTotals = {};
        this.transactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
            });

        // Overspending warnings
        Object.entries(categoryTotals).forEach(([category, amount]) => {
            const percentage = totals.expense > 0 ? (amount / totals.expense) * 100 : 0;
            if (percentage > 40) {
                insights.push({
                    type: 'warning',
                    message: `⚠️ You're spending ${percentage.toFixed(1)}% of your expenses on ${category}. Consider reducing it.`
                });
            }
        });

        // Positive feedback
        if (totals.balance > 0 && totals.income > 0) {
            const savingsRate = (totals.balance / totals.income) * 100;
            if (savingsRate > 20) {
                insights.push({
                    type: 'success',
                    message: `✅ Great job! You're saving ${savingsRate.toFixed(1)}% of your income.`
                });
            }
        }

        // Expense > Income warning
        if (totals.expense > totals.income) {
            insights.push({
                type: 'danger',
                message: `🚨 Alert: Your expenses (₹${totals.expense.toLocaleString('en-IN')}) exceed your income (₹${totals.income.toLocaleString('en-IN')})`
            });
        }

        // Default message
        if (insights.length === 0) {
            insights.push({
                type: 'info',
                message: `💡 Keep tracking your expenses regularly to get personalized insights.`
            });
        }

        container.innerHTML = insights
            .map(i => `<div class="insight-item ${i.type}">${i.message}</div>`)
            .join('');
    }

    setDefaultDate() {
        const dateEl = document.getElementById('date');
        if (dateEl) {
            const today = new Date().toISOString().split('T')[0];
            dateEl.value = today;
        }
    }

    showNotification(message) {
        console.log('Notification:', message);
    }
}

// ========== INITIALIZE APP ==========
document.addEventListener('DOMContentLoaded', () => {
    window.budgetApp = new BudgetManager();
});
