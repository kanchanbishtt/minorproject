/* ================================
   GOALS PAGE LOGIC
   ================================ */

class GoalsPage {
    constructor() {
        this.goals = this.loadFromStorage('goals') || [];
        this.transactions = this.loadFromStorage('transactions') || [];
        this.currency = BudgetUtils.loadCurrency();
        this.init();
    }

    init() {
        document.querySelector('label[for="goalAmount"]').textContent = `Target Amount (${this.currency})`;
        this.updateSummary();
        this.renderGoals();
        this.attachEventListeners();
    }

    loadFromStorage(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    saveToStorage(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    attachEventListeners() {
        // Show/hide goal form
        document.getElementById('addGoalBtn').addEventListener('click', () => {
            document.getElementById('goalFormContainer').style.display = 'block';
        });

        document.getElementById('cancelGoalBtn').addEventListener('click', () => {
            document.getElementById('goalFormContainer').style.display = 'none';
            document.getElementById('goalForm').reset();
        });

        // Add goal
        document.getElementById('goalForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addGoal();
        });
    }

    calculateBalance() {
        const income = this.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expense = this.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        return income - expense;
    }

    updateSummary() {
        const currentBalance = this.calculateBalance();
        const activeGoals = this.goals.filter(g => !g.completed);
        const completedGoals = this.goals.filter(g => g.completed);
        const totalSaved = completedGoals.reduce((sum, g) => sum + g.amount, 0);

        document.getElementById('currentBalance').textContent = BudgetUtils.formatMoney(currentBalance, this.currency);
        document.getElementById('activeGoalsCount').textContent = activeGoals.length;
        document.getElementById('completedGoalsCount').textContent = completedGoals.length;
        document.getElementById('totalSaved').textContent = BudgetUtils.formatMoney(totalSaved, this.currency);
    }

    addGoal() {
        const name = document.getElementById('goalName').value.trim();
        const amount = parseFloat(document.getElementById('goalAmount').value);
        const deadline = document.getElementById('goalDeadline').value;
        const category = document.getElementById('goalCategory').value;
        const description = document.getElementById('goalDescription').value.trim();

        if (!name || !deadline) {
            alert('Please fill all required fields');
            return;
        }

        if (!Number.isFinite(amount) || amount <= 0) {
            alert('Please enter a target amount greater than 0');
            return;
        }

        const goal = {
            id: Date.now(),
            name,
            amount,
            deadline,
            category,
            description,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.goals.unshift(goal);
        this.saveToStorage('goals', this.goals);

        // Reset form
        document.getElementById('goalForm').reset();
        document.getElementById('goalFormContainer').style.display = 'none';

        // Update UI
        this.updateSummary();
        this.renderGoals();

        this.showNotification(`Goal created: ${name}`);
    }

    deleteGoal(id) {
        if (!confirm('Delete this goal?')) return;

        this.goals = this.goals.filter(g => g.id !== id);
        this.saveToStorage('goals', this.goals);

        // Update UI
        this.updateSummary();
        this.renderGoals();

        this.showNotification('Goal deleted');
    }

    toggleGoalComplete(id) {
        const goal = this.goals.find(g => g.id === id);
        if (!goal) return;

        goal.completed = !goal.completed;
        goal.completedAt = goal.completed ? new Date().toISOString() : null;

        this.saveToStorage('goals', this.goals);

        // Update UI
        this.updateSummary();
        this.renderGoals();

        this.showNotification(goal.completed ? 'Goal completed! 🎉' : 'Goal marked as incomplete');
    }

    renderGoals() {
        this.renderActiveGoals();
        this.renderCompletedGoals();
    }

    renderActiveGoals() {
        const container = document.getElementById('activeGoalsList');
        // Nearest deadline first (YYYY-MM-DD strings sort chronologically; sort is stable)
        const activeGoals = this.goals
            .filter(g => !g.completed)
            .sort((a, b) => (a.deadline < b.deadline ? -1 : a.deadline > b.deadline ? 1 : 0));

        if (activeGoals.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No active goals. Create one to start saving!</p>';
            return;
        }

        // Share the balance out in deadline order: each goal is funded up to its target
        // before the next gets anything, so goals never claim more money than exists
        // and a negative balance funds nothing
        let available = Math.max(this.calculateBalance(), 0);
        container.innerHTML = activeGoals.map(goal => {
            const saved = Math.min(available, Math.max(goal.amount, 0));
            available -= saved;
            return this.createGoalHTML(goal, saved);
        }).join('');

        // Attach event listeners
        this.attachGoalHandlers(container);
    }

    renderCompletedGoals() {
        const container = document.getElementById('completedGoalsList');
        const completedGoals = this.goals.filter(g => g.completed);
        const currentBalance = this.calculateBalance();

        if (completedGoals.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No completed goals yet.</p>';
            return;
        }

        container.innerHTML = completedGoals
            .map(goal => this.createGoalHTML(goal, Math.min(Math.max(currentBalance, 0), Math.max(goal.amount, 0))))
            .join('');

        // Attach event listeners
        this.attachGoalHandlers(container);
    }

    // Whole calendar days from today to the deadline, both as local dates, so the
    // time of day cannot turn the due date into "Overdue by 0 days"
    daysLeftText(deadline) {
        const today = BudgetUtils.parseLocalDate(BudgetUtils.toLocalISODate(new Date()));
        const msPerDay = 24 * 60 * 60 * 1000;
        // Round: a span crossing a DST change is not a whole number of 24h days
        const days = Math.round((BudgetUtils.parseLocalDate(deadline) - today) / msPerDay);

        if (days === 0) return 'Due today';
        const count = Math.abs(days);
        const unit = count === 1 ? 'day' : 'days';
        return days > 0 ? `${count} ${unit} left` : `Overdue by ${count} ${unit}`;
    }

    // saved: the part of the balance counted toward this goal (0 to goal.amount)
    createGoalHTML(goal, saved) {
        const categoryIcons = {
            savings: '💰', travel: '✈️', gadgets: '📱', education: '📚',
            investment: '📈', emergency: '🚨', other: '📦'
        };

        const icon = categoryIcons[goal.category] || '📦';
        const percentage = goal.amount > 0 ? (saved / goal.amount) * 100 : 0;
        const remaining = Math.max(goal.amount - saved, 0);
        const deadlineText = BudgetUtils.parseLocalDate(goal.deadline).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
        const daysLeftText = this.daysLeftText(goal.deadline);

        return `
            <div class="goal-item ${goal.completed ? 'completed' : ''}">
                <div class="goal-header">
                    <div class="goal-icon">${icon}</div>
                    <div class="goal-info">
                        <h4>${BudgetUtils.escapeHTML(goal.name)}</h4>
                        ${goal.description ? `<p class="goal-description">${BudgetUtils.escapeHTML(goal.description)}</p>` : ''}
                        <p class="goal-meta">${BudgetUtils.escapeHTML(goal.category)} • Target: ${deadlineText}</p>
                    </div>
                    <div class="goal-actions">
                        <button class="btn-icon goal-complete" data-id="${BudgetUtils.escapeHTML(goal.id)}" title="${goal.completed ? 'Mark incomplete' : 'Mark complete'}">
                            ${goal.completed ? '↩️' : '✓'}
                        </button>
                        <button class="btn-icon goal-delete" data-id="${BudgetUtils.escapeHTML(goal.id)}" title="Delete">
                            🗑️
                        </button>
                    </div>
                </div>
                <div class="goal-progress-section">
                    <div class="goal-stats">
                        <div class="goal-stat">
                            <p class="stat-label">Target</p>
                            <p class="stat-value">${BudgetUtils.formatMoney(goal.amount, this.currency)}</p>
                        </div>
                        <div class="goal-stat">
                            <p class="stat-label">Current</p>
                            <p class="stat-value">${BudgetUtils.formatMoney(saved, this.currency)}</p>
                        </div>
                        <div class="goal-stat">
                            <p class="stat-label">Remaining</p>
                            <p class="stat-value">${BudgetUtils.formatMoney(remaining, this.currency)}</p>
                        </div>
                        <div class="goal-stat">
                            <p class="stat-label">Progress</p>
                            <p class="stat-value">${percentage.toFixed(1)}%</p>
                        </div>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%"></div>
                    </div>
                    ${!goal.completed ? `<p class="goal-deadline">${daysLeftText}</p>` : '<p class="goal-completed-text">🎉 Goal Completed!</p>'}
                </div>
            </div>
        `;
    }

    attachGoalHandlers(container) {
        container.querySelectorAll('.goal-complete').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                this.toggleGoalComplete(id);
            });
        });

        container.querySelectorAll('.goal-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                this.deleteGoal(id);
            });
        });
    }

    showNotification(message) {
        console.log('Notification:', message);
        // Can be enhanced with toast notifications
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.goalsPage = new GoalsPage();
});
