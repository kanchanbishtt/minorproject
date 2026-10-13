/* ================================
   ANALYTICS PAGE LOGIC
   ================================ */

class AnalyticsPage {
    constructor() {
        this.transactions = this.loadFromStorage('transactions') || [];
        this.currency = BudgetUtils.loadCurrency();
        this.categoryChartInstance = null;
        this.incomeExpenseChartInstance = null;
        this.monthlyTrendChartInstance = null;
        this.topCategoriesChartInstance = null;
        this.init();
    }

    init() {
        // Wire controls first so a rendering error cannot leave them dead
        this.attachEventListeners();
        this.updateSummary();
        this.renderCharts();
        this.renderAnalysis();
        this.generateInsights();
    }

    loadFromStorage(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    formatMoney(amount) {
        return BudgetUtils.formatMoney(amount, this.currency);
    }

    // Chart.js tooltip options that show values as money. Line charts label each
    // point by its dataset ("Income"), the others by the bar/slice label.
    moneyTooltip(labelByDataset = false) {
        return {
            callbacks: {
                label: ctx => `${labelByDataset ? ctx.dataset.label : ctx.label}: ${this.formatMoney(ctx.raw)}`
            }
        };
    }

    // Display name for a stored category key ("food" -> "Food"). Plain text:
    // escape it before putting it into innerHTML.
    categoryLabel(category) {
        const text = String(category);
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    attachEventListeners() {
        document.getElementById('timePeriod').addEventListener('change', () => {
            this.updateSummary();
            this.renderCharts();
            this.renderAnalysis();
            this.generateInsights();
        });
    }

    // Inclusive bounds of the selected period as local YYYY-MM-DD strings, or null for All Time
    getPeriodRange() {
        const period = document.getElementById('timePeriod').value;
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const iso = date => BudgetUtils.toLocalISODate(date);

        switch (period) {
            case 'week':
                return { start: iso(new Date(year, month, today.getDate() - 6)), end: iso(today) };
            case 'month':
                return { start: iso(new Date(year, month, 1)), end: iso(new Date(year, month + 1, 0)) };
            case 'year':
                return { start: iso(new Date(year, 0, 1)), end: iso(new Date(year, 11, 31)) };
            default:
                return null;
        }
    }

    getFilteredTransactions() {
        const range = this.getPeriodRange();
        if (!range) return this.transactions;

        // Compare as local calendar dates; YYYY-MM-DD strings sort chronologically
        return this.transactions.filter(t => {
            const date = BudgetUtils.toLocalISODate(BudgetUtils.parseLocalDate(t.date));
            return date >= range.start && date <= range.end;
        });
    }

    updateSummary() {
        const filtered = this.getFilteredTransactions();
        const totals = this.calculateTotals(filtered);

        document.getElementById('totalIncome').textContent = this.formatMoney(totals.income);
        document.getElementById('totalExpense').textContent = this.formatMoney(totals.expense);

        // Calculate average daily spending
        const days = this.calculatePeriodDays(filtered);
        const avgDaily = days > 0 ? totals.expense / days : 0;
        document.getElementById('avgDaily').textContent = this.formatMoney(Math.round(avgDaily));

        // Calculate savings rate
        const savingsRate = totals.income > 0 ? ((totals.income - totals.expense) / totals.income) * 100 : 0;
        document.getElementById('savingsRate').textContent = `${savingsRate.toFixed(1)}%`;
    }

    // Days the selected period has covered so far: from its start (or the first
    // transaction, for All Time) to the later of today and the last transaction,
    // capped at the period's end. Spending is averaged over these days.
    calculatePeriodDays(transactions) {
        const dates = transactions
            .map(t => BudgetUtils.toLocalISODate(BudgetUtils.parseLocalDate(t.date)))
            .filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date))
            .sort();
        if (dates.length === 0) return 0;

        const range = this.getPeriodRange();
        const today = BudgetUtils.toLocalISODate(new Date());
        const lastDate = dates[dates.length - 1];
        const start = range ? range.start : dates[0];
        let end = lastDate > today ? lastDate : today;
        if (range && end > range.end) end = range.end;

        // Round: a span crossing a DST change is not a whole number of 24h days
        const msPerDay = 24 * 60 * 60 * 1000;
        return Math.round((BudgetUtils.parseLocalDate(end) - BudgetUtils.parseLocalDate(start)) / msPerDay) + 1;
    }

    calculateTotals(transactions) {
        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expense = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        return { income, expense, balance: income - expense };
    }

    renderCharts() {
        this.renderIncomeExpenseChart();
        this.renderCategoryChart();
        this.renderMonthlyTrendChart();
        this.renderTopCategoriesChart();
    }

    renderIncomeExpenseChart() {
        const ctx = document.getElementById('incomeExpenseChart').getContext('2d');
        const filtered = this.getFilteredTransactions();
        const totals = this.calculateTotals(filtered);

        if (this.incomeExpenseChartInstance) {
            this.incomeExpenseChartInstance.destroy();
        }

        this.incomeExpenseChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Income', 'Expense', 'Balance'],
                datasets: [{
                    label: `Amount (${this.currency})`,
                    data: [totals.income, totals.expense, totals.balance],
                    backgroundColor: ['#26a69a', '#ef5350', '#42a5f5']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false },
                    tooltip: this.moneyTooltip()
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    renderCategoryChart() {
        const ctx = document.getElementById('categoryChart').getContext('2d');
        const filtered = this.getFilteredTransactions();

        const categoryTotals = {};
        filtered
            .filter(t => t.type === 'expense')
            .forEach(t => {
                categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
            });

        const labels = Object.keys(categoryTotals);
        const data = Object.values(categoryTotals);

        if (this.categoryChartInstance) {
            this.categoryChartInstance.destroy();
        }

        this.categoryChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels.map(l => this.categoryLabel(l)),
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: this.moneyTooltip()
                }
            }
        });
    }

    renderMonthlyTrendChart() {
        const ctx = document.getElementById('monthlyTrendChart').getContext('2d');
        const filtered = this.getFilteredTransactions();

        // Group by month
        const monthlyData = {};
        filtered.forEach(t => {
            const date = BudgetUtils.parseLocalDate(t.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { income: 0, expense: 0 };
            }

            if (t.type === 'income') {
                monthlyData[monthKey].income += t.amount;
            } else {
                monthlyData[monthKey].expense += t.amount;
            }
        });

        const sortedMonths = Object.keys(monthlyData).sort();
        const incomeData = sortedMonths.map(m => monthlyData[m].income);
        const expenseData = sortedMonths.map(m => monthlyData[m].expense);

        if (this.monthlyTrendChartInstance) {
            this.monthlyTrendChartInstance.destroy();
        }

        this.monthlyTrendChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: sortedMonths.map(m => {
                    const [year, month] = m.split('-');
                    return new Date(year, month - 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
                }),
                datasets: [
                    {
                        label: 'Income',
                        data: incomeData,
                        borderColor: '#26a69a',
                        backgroundColor: 'rgba(38, 166, 154, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Expense',
                        data: expenseData,
                        borderColor: '#ef5350',
                        backgroundColor: 'rgba(239, 83, 80, 0.1)',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'top' },
                    tooltip: this.moneyTooltip(true)
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    renderTopCategoriesChart() {
        const ctx = document.getElementById('topCategoriesChart').getContext('2d');
        const filtered = this.getFilteredTransactions();

        const categoryTotals = {};
        filtered
            .filter(t => t.type === 'expense')
            .forEach(t => {
                categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
            });

        const sorted = Object.entries(categoryTotals)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        const labels = sorted.map(([cat]) => this.categoryLabel(cat));
        const data = sorted.map(([, amount]) => amount);

        if (this.topCategoriesChartInstance) {
            this.topCategoriesChartInstance.destroy();
        }

        this.topCategoriesChartInstance = new Chart(ctx, {
            // Chart.js v3+ removed 'horizontalBar'; indexAxis: 'y' makes this bar chart horizontal
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: `Amount (${this.currency})`,
                    data: data,
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                indexAxis: 'y',
                plugins: {
                    legend: { display: false },
                    tooltip: this.moneyTooltip()
                },
                scales: {
                    x: { beginAtZero: true }
                }
            }
        });
    }

    renderAnalysis() {
        const container = document.getElementById('analysisDetails');
        const filtered = this.getFilteredTransactions();
        const totals = this.calculateTotals(filtered);

        const categoryTotals = {};
        filtered
            .filter(t => t.type === 'expense')
            .forEach(t => {
                categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
            });

        const sorted = Object.entries(categoryTotals)
            .sort((a, b) => b[1] - a[1])
            .map(([category, amount]) => {
                const percentage = totals.expense > 0 ? (amount / totals.expense) * 100 : 0;
                return `
                    <div class="transaction-item">
                        <div class="transaction-left">
                            <div class="transaction-details">
                                <h4>${BudgetUtils.escapeHTML(this.categoryLabel(category))}</h4>
                                <p class="transaction-meta">${percentage.toFixed(1)}% of total expenses</p>
                            </div>
                        </div>
                        <div class="transaction-right">
                            <div class="transaction-amount expense">${this.formatMoney(amount)}</div>
                        </div>
                    </div>
                `;
            })
            .join('');

        container.innerHTML = sorted || '<p style="color: var(--text-secondary); padding: 1rem;">No expense data available.</p>';
    }

    generateInsights() {
        const container = document.getElementById('insightsContainer');
        const filtered = this.getFilteredTransactions();
        const insights = [];
        const totals = this.calculateTotals(filtered);

        if (filtered.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary);">Add transactions to see smart insights!</p>';
            return;
        }

        // Calculate category percentages
        const categoryTotals = {};
        filtered
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
                    message: `⚠️ ${BudgetUtils.escapeHTML(this.categoryLabel(category))} accounts for ${percentage.toFixed(1)}% of your expenses. Consider reducing it.`
                });
            }
        });

        // Positive feedback
        if (totals.balance > 0 && totals.income > 0) {
            const savingsRate = (totals.balance / totals.income) * 100;
            if (savingsRate > 20) {
                insights.push({
                    type: 'success',
                    message: `✅ Excellent! You're saving ${savingsRate.toFixed(1)}% of your income.`
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
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.analyticsPage = new AnalyticsPage();
});
