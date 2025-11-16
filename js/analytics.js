/* ================================
   ANALYTICS PAGE LOGIC
   ================================ */

class AnalyticsPage {
    constructor() {
        this.transactions = this.loadFromStorage('transactions') || [];
        this.categoryChartInstance = null;
        this.incomeExpenseChartInstance = null;
        this.monthlyTrendChartInstance = null;
        this.topCategoriesChartInstance = null;
        this.init();
    }

    init() {
        this.updateSummary();
        this.renderCharts();
        this.renderAnalysis();
        this.generateInsights();
        this.attachEventListeners();
    }

    loadFromStorage(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    attachEventListeners() {
        document.getElementById('timePeriod').addEventListener('change', () => {
            this.updateSummary();
            this.renderCharts();
            this.renderAnalysis();
            this.generateInsights();
        });
    }

    getFilteredTransactions() {
        const period = document.getElementById('timePeriod').value;
        const now = new Date();
        let filtered = this.transactions;

        switch (period) {
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                filtered = this.transactions.filter(t => new Date(t.date) >= weekAgo);
                break;
            case 'month':
                const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
                filtered = this.transactions.filter(t => new Date(t.date) >= monthAgo);
                break;
            case 'year':
                const yearAgo = new Date(now.getFullYear(), 0, 1);
                filtered = this.transactions.filter(t => new Date(t.date) >= yearAgo);
                break;
            default:
                filtered = this.transactions;
        }

        return filtered;
    }

    updateSummary() {
        const filtered = this.getFilteredTransactions();
        const totals = this.calculateTotals(filtered);

        document.getElementById('totalIncome').textContent = `₹${totals.income.toLocaleString('en-IN')}`;
        document.getElementById('totalExpense').textContent = `₹${totals.expense.toLocaleString('en-IN')}`;

        // Calculate average daily spending
        const days = this.calculateDays(filtered);
        const avgDaily = days > 0 ? totals.expense / days : 0;
        document.getElementById('avgDaily').textContent = `₹${avgDaily.toFixed(0).toLocaleString('en-IN')}`;

        // Calculate savings rate
        const savingsRate = totals.income > 0 ? ((totals.income - totals.expense) / totals.income) * 100 : 0;
        document.getElementById('savingsRate').textContent = `${savingsRate.toFixed(1)}%`;
    }

    calculateDays(transactions) {
        if (transactions.length === 0) return 0;

        const dates = transactions.map(t => new Date(t.date));
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        const diff = maxDate - minDate;
        return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
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
                    label: 'Amount (₹)',
                    data: [totals.income, totals.expense, totals.balance],
                    backgroundColor: ['#26a69a', '#ef5350', '#42a5f5']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false }
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
                labels: labels.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
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
                    legend: { position: 'bottom' }
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
            const date = new Date(t.date);
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
                    legend: { position: 'top' }
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

        const labels = sorted.map(([cat]) => cat.charAt(0).toUpperCase() + cat.slice(1));
        const data = sorted.map(([, amount]) => amount);

        if (this.topCategoriesChartInstance) {
            this.topCategoriesChartInstance.destroy();
        }

        this.topCategoriesChartInstance = new Chart(ctx, {
            type: 'horizontalBar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Amount (₹)',
                    data: data,
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                indexAxis: 'y',
                plugins: {
                    legend: { display: false }
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
                                <h4>${category.charAt(0).toUpperCase() + category.slice(1)}</h4>
                                <p class="transaction-meta">${percentage.toFixed(1)}% of total expenses</p>
                            </div>
                        </div>
                        <div class="transaction-right">
                            <div class="transaction-amount expense">₹${amount.toLocaleString('en-IN')}</div>
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
                    message: `⚠️ ${category.charAt(0).toUpperCase() + category.slice(1)} accounts for ${percentage.toFixed(1)}% of your expenses. Consider reducing it.`
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
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.analyticsPage = new AnalyticsPage();
});
