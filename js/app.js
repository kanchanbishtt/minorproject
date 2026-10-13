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
        this.setupExport();
    }

    // ========== EXPORT (dashboard) ==========
    setupExport() {
        const exportBtn = document.getElementById('exportBtn');
        const modal = document.getElementById('exportModal');
        if (!exportBtn || !modal) return;

        exportBtn.addEventListener('click', () => modal.classList.add('active'));
        document.getElementById('closeModal').addEventListener('click', () => this.closeExportModal());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeExportModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeExportModal();
        });

        document.getElementById('exportCSV').addEventListener('click', () => this.exportCSV());
        document.getElementById('exportPDF').addEventListener('click', () => this.exportPDF());
    }

    closeExportModal() {
        document.getElementById('exportModal').classList.remove('active');
    }

    exportCSV() {
        if (this.transactions.length === 0) {
            alert('No transactions to export');
            return;
        }

        const headers = ['Date', 'Description', 'Type', 'Category', 'Amount'];
        const rows = this.transactions.map(t => [t.date, t.description, t.type, t.category, t.amount]);
        const csv = [headers, ...rows]
            .map(row => row.map(cell => this.toCSVCell(cell)).join(','))
            .join('\r\n');

        // BOM so Excel reads the file as UTF-8
        this.downloadFile('﻿' + csv, `transactions-${this.toLocalISODate(new Date())}.csv`, 'text/csv;charset=utf-8');
        this.closeExportModal();
        this.showNotification('CSV exported successfully!');
    }

    toCSVCell(value) {
        let text = String(value ?? '');
        // Stop spreadsheets from evaluating text cells as formulas
        if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
        return `"${text.replace(/"/g, '""')}"`;
    }

    exportPDF() {
        if (this.transactions.length === 0) {
            alert('No transactions to export');
            return;
        }
        if (!window.jspdf) {
            alert('PDF export is unavailable: the PDF library failed to load. Check your internet connection and reload.');
            return;
        }

        const doc = new window.jspdf.jsPDF();
        const totals = this.calculateTotals();
        const pageBottom = doc.internal.pageSize.getHeight() - 15;
        const col = { date: 14, description: 40, type: 118, category: 142, amount: 196 };
        let y = 20;

        doc.setFontSize(16);
        doc.text('Smart Budget Manager - Transactions', 14, y);
        doc.setFontSize(10);
        y += 7;
        doc.text(`Generated on ${this.toLocalISODate(new Date())}`, 14, y);

        doc.setFontSize(11);
        y += 10;
        doc.text(`Total Income: ${this.formatPDFAmount(totals.income)}`, 14, y);
        y += 6;
        doc.text(`Total Expense: ${this.formatPDFAmount(totals.expense)}`, 14, y);
        y += 6;
        doc.text(`Balance: ${this.formatPDFAmount(totals.balance)}`, 14, y);

        const drawHeader = () => {
            doc.setFont('helvetica', 'bold');
            doc.text('Date', col.date, y);
            doc.text('Description', col.description, y);
            doc.text('Type', col.type, y);
            doc.text('Category', col.category, y);
            doc.text('Amount', col.amount, y, { align: 'right' });
            doc.line(14, y + 2, 196, y + 2);
            doc.setFont('helvetica', 'normal');
            y += 8;
        };

        doc.setFontSize(10);
        y += 12;
        drawHeader();

        this.transactions.forEach(t => {
            if (y > pageBottom) {
                doc.addPage();
                y = 20;
                drawHeader();
            }
            const sign = t.type === 'income' ? '+' : '-';
            doc.text(String(t.date), col.date, y);
            doc.text(doc.splitTextToSize(String(t.description), col.type - col.description - 4)[0], col.description, y);
            doc.text(String(t.type), col.type, y);
            doc.text(String(t.category), col.category, y);
            doc.text(sign + this.formatPDFAmount(t.amount), col.amount, y, { align: 'right' });
            y += 7;
        });

        doc.save(`transactions-${this.toLocalISODate(new Date())}.pdf`);
        this.closeExportModal();
        this.showNotification('PDF exported successfully!');
    }

    // jsPDF's built-in fonts cannot render ₹, so spell it out
    formatPDFAmount(amount) {
        const sign = amount < 0 ? '-' : '';
        return `${sign}Rs. ${Math.abs(amount).toLocaleString('en-IN')}`;
    }

    downloadFile(content, filename, mimeType) {
        const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 0);
    }

    // YYYY-MM-DD in the user's local timezone (toISOString would give the UTC date)
    toLocalISODate(date) {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${date.getFullYear()}-${month}-${day}`;
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
        const type = transaction.type === 'income' ? 'income' : 'expense';
        const sign = type === 'income' ? '+' : '-';
        const formattedDate = new Date(transaction.date).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        });

        return `
            <div class="transaction-item ${type}">
                <div class="transaction-left">
                    <div class="transaction-icon">${icon}</div>
                    <div class="transaction-details">
                        <h4>${this.escapeHTML(transaction.description)}</h4>
                        <p class="transaction-meta">${formattedDate} • ${this.escapeHTML(transaction.category)}</p>
                    </div>
                </div>
                <div class="transaction-right">
                    <div class="transaction-amount ${type}">
                        ${sign}₹${transaction.amount.toLocaleString('en-IN')}
                    </div>
                    <button class="transaction-delete" data-id="${this.escapeHTML(transaction.id)}">🗑️ Delete</button>
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
                    message: `⚠️ You're spending ${percentage.toFixed(1)}% of your expenses on ${this.escapeHTML(category)}. Consider reducing it.`
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

    // Escape user-supplied text before inserting it into innerHTML
    escapeHTML(value) {
        const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
        return String(value).replace(/[&<>"']/g, ch => entities[ch]);
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
