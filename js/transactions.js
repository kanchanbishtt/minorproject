/* ================================
   TRANSACTIONS PAGE LOGIC
   ================================ */

class TransactionsPage {
    constructor() {
        this.transactions = this.loadFromStorage('transactions') || [];
        this.init();
    }

    init() {
        this.updateSummary();
        this.renderAllTransactions();
        this.attachEventListeners();
        this.setDefaultDate();
    }

    loadFromStorage(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    saveToStorage(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    attachEventListeners() {
        // Show/hide transaction form
        document.getElementById('addTransactionBtn').addEventListener('click', () => {
            document.getElementById('transactionFormContainer').style.display = 'block';
        });

        document.getElementById('cancelTransactionBtn').addEventListener('click', () => {
            document.getElementById('transactionFormContainer').style.display = 'none';
            document.getElementById('transactionForm').reset();
        });

        // Add transaction
        document.getElementById('transactionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTransaction();
        });

        // Filters
        document.getElementById('searchInput').addEventListener('input', () => this.filterTransactions());
        document.getElementById('filterType').addEventListener('change', () => this.filterTransactions());
        document.getElementById('filterCategory').addEventListener('change', () => this.filterTransactions());
        document.getElementById('filterSort').addEventListener('change', () => this.filterTransactions());
        document.getElementById('clearFilters').addEventListener('click', () => this.clearFilters());

        // Export
        document.getElementById('exportBtn').addEventListener('click', () => {
            document.getElementById('exportModal').classList.add('active');
        });

        document.getElementById('closeModal').addEventListener('click', () => {
            document.getElementById('exportModal').classList.remove('active');
        });

        document.getElementById('exportCSV').addEventListener('click', () => this.exportCSV());
        document.getElementById('exportJSON').addEventListener('click', () => this.exportJSON());
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
        document.getElementById('transactionFormContainer').style.display = 'none';

        // Update UI
        this.updateSummary();
        this.renderAllTransactions();

        this.showNotification(`Transaction added: ${description}`);
    }

    deleteTransaction(id) {
        if (!confirm('Delete this transaction?')) return;

        this.transactions = this.transactions.filter(t => t.id !== id);
        this.saveToStorage('transactions', this.transactions);

        // Update UI
        this.updateSummary();
        this.renderAllTransactions();

        this.showNotification('Transaction deleted');
    }

    updateSummary() {
        const totals = this.calculateTotals();

        document.getElementById('totalIncome').textContent = `₹${totals.income.toLocaleString('en-IN')}`;
        document.getElementById('totalExpense').textContent = `₹${totals.expense.toLocaleString('en-IN')}`;
        document.getElementById('balance').textContent = `₹${totals.balance.toLocaleString('en-IN')}`;
        document.getElementById('totalTransactions').textContent = this.transactions.length;
    }

    calculateTotals() {
        const income = this.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expense = this.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        return { income, expense, balance: income - expense };
    }

    renderAllTransactions() {
        const container = document.getElementById('allTransactionsList');

        if (this.transactions.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No transactions found. Add your first one!</p>';
            return;
        }

        container.innerHTML = this.transactions.map(t => this.createTransactionHTML(t)).join('');

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

    filterTransactions() {
        const search = document.getElementById('searchInput').value.toLowerCase();
        const typeFilter = document.getElementById('filterType').value;
        const categoryFilter = document.getElementById('filterCategory').value;
        const sortFilter = document.getElementById('filterSort').value;

        let filtered = [...this.transactions];

        // Apply search
        if (search) {
            filtered = filtered.filter(t =>
                t.description.toLowerCase().includes(search) ||
                t.category.toLowerCase().includes(search)
            );
        }

        // Apply type filter
        if (typeFilter !== 'all') {
            filtered = filtered.filter(t => t.type === typeFilter);
        }

        // Apply category filter
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(t => t.category === categoryFilter);
        }

        // Apply sorting
        switch (sortFilter) {
            case 'oldest':
                filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
                break;
            case 'highest':
                filtered.sort((a, b) => b.amount - a.amount);
                break;
            case 'lowest':
                filtered.sort((a, b) => a.amount - b.amount);
                break;
            case 'newest':
            default:
                filtered.sort((a, b) => b.id - a.id);
        }

        // Render filtered results
        const container = document.getElementById('allTransactionsList');

        if (filtered.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No matching transactions found.</p>';
            return;
        }

        container.innerHTML = filtered.map(t => this.createTransactionHTML(t)).join('');

        // Attach delete handlers
        container.querySelectorAll('.transaction-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                this.deleteTransaction(id);
            });
        });
    }

    clearFilters() {
        document.getElementById('searchInput').value = '';
        document.getElementById('filterType').value = 'all';
        document.getElementById('filterCategory').value = 'all';
        document.getElementById('filterSort').value = 'newest';
        this.renderAllTransactions();
    }

    exportCSV() {
        if (this.transactions.length === 0) {
            alert('No transactions to export');
            return;
        }

        const headers = ['Date', 'Description', 'Type', 'Category', 'Amount'];
        const rows = this.transactions.map(t => [
            t.date,
            t.description,
            t.type,
            t.category,
            t.amount
        ]);

        let csvContent = headers.join(',') + '\n';
        rows.forEach(row => {
            csvContent += row.join(',') + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        this.showNotification('CSV exported successfully!');
        document.getElementById('exportModal').classList.remove('active');
    }

    exportJSON() {
        if (this.transactions.length === 0) {
            alert('No transactions to export');
            return;
        }

        const jsonContent = JSON.stringify(this.transactions, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `transactions-${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        this.showNotification('JSON exported successfully!');
        document.getElementById('exportModal').classList.remove('active');
    }

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').value = today;
    }

    showNotification(message) {
        console.log('Notification:', message);
        // Can be enhanced with toast notifications
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.transactionsPage = new TransactionsPage();
});
