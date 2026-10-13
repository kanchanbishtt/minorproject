/* ================================
   SMART BUDGET MANAGER - SHARED UTILITIES
   ================================ */

// ========== SHARED HELPERS (used by every page script) ==========
const BudgetUtils = {
    // Symbols offered by the currency select on settings.html
    SUPPORTED_CURRENCIES: ['₹', '$', '€', '£', '¥'],

    CATEGORY_ICONS: {
        food: '🍔', transport: '🚗', shopping: '🛍️', bills: '💡',
        entertainment: '🎬', health: '⚕️', education: '📚', salary: '💼', other: '📦'
    },

    loadCurrency() {
        return BudgetUtils.normalizeSettings(BudgetUtils.readStorage('settings')).currency;
    },

    formatMoney(amount, currency) {
        const locale = currency === '₹' ? 'en-IN' : 'en-US';
        const sign = amount < 0 ? '-' : '';
        return `${sign}${currency}${Math.abs(amount).toLocaleString(locale)}`;
    },

    // Escape user-supplied text before inserting it into innerHTML
    escapeHTML(value) {
        const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
        return String(value).replace(/[&<>"']/g, ch => entities[ch]);
    },

    // YYYY-MM-DD in the user's local timezone (toISOString would give the UTC date)
    toLocalISODate(date) {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${date.getFullYear()}-${month}-${day}`;
    },

    // new Date('YYYY-MM-DD') is UTC midnight, which shows the previous day west of UTC
    parseLocalDate(value) {
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
        return match ? new Date(+match[1], +match[2] - 1, +match[3]) : new Date(value);
    },

    // ----- Data validation: applied to imports and to everything read from storage,
    // so one malformed row can never crash a page or corrupt the totals -----

    TRANSACTION_TYPES: ['income', 'expense'],
    // 'D MMM YYYY' (13 Oct 2026) is the default and matches the original display
    DATE_FORMATS: ['D MMM YYYY', 'DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'],
    ALERT_THRESHOLDS: [50, 75, 80, 90],

    // JSON from localStorage, or null if missing or unreadable
    readStorage(key) {
        try {
            return JSON.parse(localStorage.getItem(key));
        } catch (e) {
            return null;
        }
    },

    // A real calendar date in YYYY-MM-DD form (rejects e.g. 2026-02-30)
    isISODate(value) {
        if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
        return BudgetUtils.toLocalISODate(BudgetUtils.parseLocalDate(value)) === value;
    },

    // Positive amount from a number or plain numeric text ("500"), else null.
    // Text must be converted: "0" + "500" concatenates instead of adding.
    toAmount(value) {
        let amount = NaN;
        if (typeof value === 'number') amount = value;
        else if (typeof value === 'string' && /^\s*\d+(\.\d+)?\s*$/.test(value)) amount = Number(value);
        return Number.isFinite(amount) && amount > 0 ? amount : null;
    },

    // Clean copy of a transaction, or null if it cannot be used
    normalizeTransaction(raw) {
        if (!raw || typeof raw !== 'object') return null;
        const amount = BudgetUtils.toAmount(raw.amount);
        const description = typeof raw.description === 'string' ? raw.description.trim() : '';
        const type = typeof raw.type === 'string' ? raw.type.trim().toLowerCase() : '';
        const category = typeof raw.category === 'string' && raw.category.trim() ? raw.category.trim().toLowerCase() : 'other';
        if (amount === null || !description || !BudgetUtils.TRANSACTION_TYPES.includes(type) || !BudgetUtils.isISODate(raw.date)) {
            return null;
        }
        return { ...raw, description, amount, type, category };
    },

    // Clean copy of a savings goal, or null if it cannot be used
    normalizeGoal(raw) {
        if (!raw || typeof raw !== 'object') return null;
        const name = typeof raw.name === 'string' ? raw.name.trim() : '';
        const amount = BudgetUtils.toAmount(raw.amount);
        if (!name || amount === null || !BudgetUtils.isISODate(raw.deadline)) return null;
        return {
            ...raw,
            name,
            amount,
            category: typeof raw.category === 'string' && raw.category.trim() ? raw.category.trim() : 'other',
            description: typeof raw.description === 'string' ? raw.description.trim() : '',
            completed: raw.completed === true
        };
    },

    // Settings with every field checked against what settings.html offers
    normalizeSettings(raw) {
        const s = raw && typeof raw === 'object' ? raw : {};
        const pick = (value, allowed, fallback) => (allowed.includes(value) ? value : fallback);
        return {
            theme: pick(s.theme, ['light', 'dark'], 'light'),
            currency: pick(s.currency, BudgetUtils.SUPPORTED_CURRENCIES, '₹'),
            dateFormat: pick(s.dateFormat, BudgetUtils.DATE_FORMATS, 'D MMM YYYY'),
            monthlyBudget: Number.isFinite(s.monthlyBudget) && s.monthlyBudget >= 0 ? s.monthlyBudget : 0,
            alertThreshold: pick(s.alertThreshold, BudgetUtils.ALERT_THRESHOLDS, 80),
            budgetAlerts: typeof s.budgetAlerts === 'boolean' ? s.budgetAlerts : true,
            goalReminders: typeof s.goalReminders === 'boolean' ? s.goalReminders : true
        };
    },

    // Drops unusable rows and gives every row a unique integer id (delete and
    // complete buttons look rows up by parseInt(id)). Earlier rows keep their ids.
    normalizeList(list, normalizeItem) {
        if (!Array.isArray(list)) return { items: [], skipped: 0 };
        const items = [];
        const seen = new Set();
        let nextId = Date.now();
        let skipped = 0;
        for (const raw of list) {
            const item = normalizeItem(raw);
            if (!item) {
                skipped++;
                continue;
            }
            if (!Number.isSafeInteger(item.id) || seen.has(item.id)) {
                while (seen.has(nextId)) nextId++;
                item.id = nextId++;
            }
            seen.add(item.id);
            items.push(item);
        }
        return { items, skipped };
    },

    // This calendar month's spending against the monthly budget, or null when no
    // budget is set. Dates are validated YYYY-MM-DD strings, so the month is their prefix.
    budgetStatus(transactions, settings) {
        if (!(settings.monthlyBudget > 0)) return null;
        const month = BudgetUtils.toLocalISODate(new Date()).slice(0, 7);
        const spent = transactions
            .filter(t => t.type === 'expense' && t.date.slice(0, 7) === month)
            .reduce((sum, t) => sum + t.amount, 0);
        const percentage = (spent / settings.monthlyBudget) * 100;
        return { spent, budget: settings.monthlyBudget, percentage, alert: percentage >= settings.alertThreshold };
    },

    loadTransactions() {
        return BudgetUtils.normalizeList(BudgetUtils.readStorage('transactions'), BudgetUtils.normalizeTransaction).items;
    },

    loadGoals() {
        return BudgetUtils.normalizeList(BudgetUtils.readStorage('goals'), BudgetUtils.normalizeGoal).items;
    },

    // A stored YYYY-MM-DD date in the Date Format chosen on the Settings page
    formatDate(value, format) {
        const date = BudgetUtils.parseLocalDate(value);
        if (Number.isNaN(date.getTime())) return String(value);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        switch (format) {
            case 'DD/MM/YYYY': return `${day}/${month}/${date.getFullYear()}`;
            case 'MM/DD/YYYY': return `${month}/${day}/${date.getFullYear()}`;
            case 'YYYY-MM-DD': return BudgetUtils.toLocalISODate(date);
            default: return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        }
    },

    // Whole calendar days from today to a YYYY-MM-DD date (negative when past)
    daysUntil(value) {
        const today = BudgetUtils.parseLocalDate(BudgetUtils.toLocalISODate(new Date()));
        const msPerDay = 24 * 60 * 60 * 1000;
        // Round: a span crossing a DST change is not a whole number of 24h days
        return Math.round((BudgetUtils.parseLocalDate(value) - today) / msPerDay);
    },

    // Markup for one row in a transactions list (dashboard and Transactions page)
    transactionHTML(transaction, currency, dateFormat) {
        const icon = BudgetUtils.CATEGORY_ICONS[transaction.category] || '📦';
        const type = transaction.type === 'income' ? 'income' : 'expense';
        const sign = type === 'income' ? '+' : '-';
        const formattedDate = BudgetUtils.escapeHTML(BudgetUtils.formatDate(transaction.date, dateFormat));

        return `
            <div class="transaction-item ${type}">
                <div class="transaction-left">
                    <div class="transaction-icon">${icon}</div>
                    <div class="transaction-details">
                        <h4>${BudgetUtils.escapeHTML(transaction.description)}</h4>
                        <p class="transaction-meta">${formattedDate} • ${BudgetUtils.escapeHTML(transaction.category)}</p>
                    </div>
                </div>
                <div class="transaction-right">
                    <div class="transaction-amount ${type}">
                        ${sign}${BudgetUtils.formatMoney(transaction.amount, currency)}
                    </div>
                    <button class="transaction-delete" data-id="${BudgetUtils.escapeHTML(transaction.id)}">🗑️ Delete</button>
                </div>
            </div>
        `;
    },

    transactionsToCSV(transactions) {
        const headers = ['Date', 'Description', 'Type', 'Category', 'Amount'];
        const rows = transactions.map(t => [t.date, t.description, t.type, t.category, t.amount]);
        const csv = [headers, ...rows]
            .map(row => row.map(cell => BudgetUtils.toCSVCell(cell)).join(','))
            .join('\r\n');
        // BOM so Excel reads the file as UTF-8
        return '﻿' + csv;
    },

    toCSVCell(value) {
        let text = String(value ?? '');
        // Stop spreadsheets from evaluating text cells as formulas
        if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
        return `"${text.replace(/"/g, '""')}"`;
    },

    // Undo the formula guard added by toCSVCell
    fromCSVCell(text) {
        return /^'[=+\-@\t\r]/.test(text) ? text.slice(1) : text;
    },

    // RFC 4180 parser: quoted fields, "" escapes, commas/newlines inside quotes, CRLF, BOM
    parseCSV(text) {
        const rows = [];
        let row = [];
        let cell = '';
        let inQuotes = false;
        text = text.replace(/^﻿/, '');

        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            if (inQuotes) {
                if (ch === '"' && text[i + 1] === '"') {
                    cell += '"';
                    i++;
                } else if (ch === '"') {
                    inQuotes = false;
                } else {
                    cell += ch;
                }
            } else if (ch === '"') {
                inQuotes = true;
            } else if (ch === ',') {
                row.push(cell);
                cell = '';
            } else if (ch === '\n' || ch === '\r') {
                if (ch === '\r' && text[i + 1] === '\n') i++;
                row.push(cell);
                rows.push(row);
                row = [];
                cell = '';
            } else {
                cell += ch;
            }
        }
        if (cell !== '' || row.length > 0) {
            row.push(cell);
            rows.push(row);
        }
        return rows;
    },

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
};

// ========== SHARED BUDGET MANAGER ==========
class BudgetManager {
    constructor() {
        this.transactions = BudgetUtils.loadTransactions();
        this.theme = BudgetUtils.readStorage('theme') === 'dark' ? 'dark' : 'light';
        this.currency = BudgetUtils.loadCurrency();
        this.dateFormat = BudgetUtils.normalizeSettings(BudgetUtils.readStorage('settings')).dateFormat;

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

    formatMoney(amount) {
        return BudgetUtils.formatMoney(amount, this.currency);
    }

    // ========== THEME ==========
    setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    }

    toggleTheme() {
        this.setTheme(this.theme === 'light' ? 'dark' : 'light');
    }

    // The single way to change the theme (header toggle and the Settings dropdown)
    setTheme(theme) {
        this.theme = theme === 'dark' ? 'dark' : 'light';
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

        const amountLabel = document.querySelector('label[for="amount"]');
        if (amountLabel) amountLabel.textContent = `Amount (${this.currency})`;

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

        BudgetUtils.downloadFile(
            BudgetUtils.transactionsToCSV(this.transactions),
            `transactions-${BudgetUtils.toLocalISODate(new Date())}.csv`,
            'text/csv;charset=utf-8'
        );
        this.closeExportModal();
        this.showNotification('CSV exported successfully!');
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
        doc.text(`Generated on ${BudgetUtils.toLocalISODate(new Date())}`, 14, y);

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

        doc.save(`transactions-${BudgetUtils.toLocalISODate(new Date())}.pdf`);
        this.closeExportModal();
        this.showNotification('PDF exported successfully!');
    }

    // jsPDF's built-in fonts cannot render ₹, so spell it out
    formatPDFAmount(amount) {
        return this.currency === '₹'
            ? this.formatMoney(amount).replace('₹', 'Rs. ')
            : this.formatMoney(amount);
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

        if (!description || !date) {
            alert('Please fill all fields');
            return;
        }

        if (!Number.isFinite(amount) || amount <= 0) {
            alert('Please enter an amount greater than 0');
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

        if (incomeEl) incomeEl.textContent = this.formatMoney(totals.income);
        if (expenseEl) expenseEl.textContent = this.formatMoney(totals.expense);
        if (balanceEl) balanceEl.textContent = this.formatMoney(totals.balance);

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

        container.innerHTML = recent.map(t => BudgetUtils.transactionHTML(t, this.currency, this.dateFormat)).join('');

        // Attach delete handlers
        container.querySelectorAll('.transaction-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                this.deleteTransaction(id);
            });
        });
    }

    updateGoalProgress(currentBalance) {
        const progressEl = document.getElementById('goalProgress');
        const progressBarEl = document.getElementById('goalProgressBar');
        const labelEl = document.getElementById('goalLabel');

        if (!progressEl || !progressBarEl) return;

        // Goals are created on the Goals page (js/goals.js)
        const goals = BudgetUtils.loadGoals();
        const activeGoals = goals.filter(g => !g.completed && g.amount > 0);

        if (activeGoals.length === 0) {
            progressEl.textContent = goals.length > 0 ? 'No active goal' : 'No goal set';
            progressBarEl.style.width = '0%';
            if (labelEl) labelEl.textContent = 'Savings Goal';
            return;
        }

        // Track the goal with the nearest deadline (YYYY-MM-DD strings sort chronologically)
        const goal = activeGoals.reduce((nearest, g) => (g.deadline < nearest.deadline ? g : nearest));
        const percentage = Math.min(Math.max((currentBalance / goal.amount) * 100, 0), 100);

        progressEl.textContent = `${percentage.toFixed(1)}%`;
        progressBarEl.style.width = `${percentage}%`;
        if (labelEl) labelEl.textContent = `Savings Goal · ${goal.name}`;
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

        // Monthly budget (set on the Settings page)
        const settings = BudgetUtils.normalizeSettings(BudgetUtils.readStorage('settings'));
        const budget = BudgetUtils.budgetStatus(this.transactions, settings);
        if (settings.budgetAlerts && budget && budget.alert) {
            insights.push({
                type: budget.percentage >= 100 ? 'danger' : 'warning',
                message: budget.percentage >= 100
                    ? `🚨 Monthly budget exceeded: you've spent ${this.formatMoney(budget.spent)} of your ${this.formatMoney(budget.budget)} budget.`
                    : `⚠️ Monthly budget: you've spent ${this.formatMoney(budget.spent)} (${budget.percentage.toFixed(1)}%) of your ${this.formatMoney(budget.budget)} budget.`
            });
        }

        // Goal reminders: active goals due within a week, or overdue
        if (settings.goalReminders) {
            BudgetUtils.loadGoals()
                .filter(g => !g.completed && BudgetUtils.daysUntil(g.deadline) <= 7)
                .sort((a, b) => (a.deadline < b.deadline ? -1 : a.deadline > b.deadline ? 1 : 0))
                .forEach(goal => {
                    const days = BudgetUtils.daysUntil(goal.deadline);
                    const count = Math.abs(days);
                    const unit = count === 1 ? 'day' : 'days';
                    const when = days === 0 ? 'is due today' : days > 0 ? `is due in ${count} ${unit}` : `is overdue by ${count} ${unit}`;
                    insights.push({
                        type: days < 0 ? 'danger' : 'warning',
                        message: `⏰ Goal reminder: "${BudgetUtils.escapeHTML(goal.name)}" ${when}.`
                    });
                });
        }

        // Overspending warnings
        Object.entries(categoryTotals).forEach(([category, amount]) => {
            const percentage = totals.expense > 0 ? (amount / totals.expense) * 100 : 0;
            if (percentage > 40) {
                insights.push({
                    type: 'warning',
                    message: `⚠️ You're spending ${percentage.toFixed(1)}% of your expenses on ${BudgetUtils.escapeHTML(category)}. Consider reducing it.`
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
                message: `🚨 Alert: Your expenses (${this.formatMoney(totals.expense)}) exceed your income (${this.formatMoney(totals.income)})`
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
            dateEl.value = BudgetUtils.toLocalISODate(new Date());
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
