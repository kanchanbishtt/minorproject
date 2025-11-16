/* ================================
   SETTINGS PAGE LOGIC
   ================================ */

class SettingsPage {
    constructor() {
        this.settings = this.loadFromStorage('settings') || this.getDefaultSettings();
        this.transactions = this.loadFromStorage('transactions') || [];
        this.goals = this.loadFromStorage('goals') || [];
        this.init();
    }

    init() {
        this.loadSettings();
        this.attachEventListeners();
    }

    getDefaultSettings() {
        return {
            theme: 'light',
            currency: '₹',
            dateFormat: 'DD/MM/YYYY',
            monthlyBudget: 0,
            alertThreshold: 80,
            budgetAlerts: true,
            goalReminders: true
        };
    }

    loadFromStorage(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    saveToStorage(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    loadSettings() {
        document.getElementById('themeSelect').value = this.settings.theme;
        document.getElementById('currencySelect').value = this.settings.currency;
        document.getElementById('dateFormatSelect').value = this.settings.dateFormat;
        document.getElementById('monthlyBudget').value = this.settings.monthlyBudget || '';
        document.getElementById('alertThreshold').value = this.settings.alertThreshold;
        document.getElementById('budgetAlerts').checked = this.settings.budgetAlerts;
        document.getElementById('goalReminders').checked = this.settings.goalReminders;
    }

    attachEventListeners() {
        // Theme select
        document.getElementById('themeSelect').addEventListener('change', (e) => {
            const theme = e.target.value;
            if (theme === 'dark') {
                document.body.classList.add('dark-theme');
            } else {
                document.body.classList.remove('dark-theme');
            }
        });

        // Save settings
        document.getElementById('saveSettingsBtn').addEventListener('click', () => {
            this.saveSettings();
        });

        // Export all data
        document.getElementById('exportAllBtn').addEventListener('click', () => {
            this.exportAllData();
        });

        // Import data
        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('importModal').classList.add('active');
        });

        document.getElementById('closeImportModal').addEventListener('click', () => {
            document.getElementById('importModal').classList.remove('active');
        });

        document.getElementById('confirmImport').addEventListener('click', () => {
            this.importData();
        });

        // Clear data
        document.getElementById('clearDataBtn').addEventListener('click', () => {
            this.clearAllData();
        });
    }

    saveSettings() {
        this.settings = {
            theme: document.getElementById('themeSelect').value,
            currency: document.getElementById('currencySelect').value,
            dateFormat: document.getElementById('dateFormatSelect').value,
            monthlyBudget: parseFloat(document.getElementById('monthlyBudget').value) || 0,
            alertThreshold: parseInt(document.getElementById('alertThreshold').value),
            budgetAlerts: document.getElementById('budgetAlerts').checked,
            goalReminders: document.getElementById('goalReminders').checked
        };

        this.saveToStorage('settings', this.settings);

        // Apply theme
        const theme = this.settings.theme;
        this.saveToStorage('theme', theme);

        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }

        this.showNotification('Settings saved successfully!');

        // Check budget alert
        this.checkBudgetAlert();
    }

    checkBudgetAlert() {
        if (!this.settings.budgetAlerts || this.settings.monthlyBudget === 0) return;

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const monthlyExpenses = this.transactions
            .filter(t => {
                const date = new Date(t.date);
                return t.type === 'expense' &&
                    date.getMonth() === currentMonth &&
                    date.getFullYear() === currentYear;
            })
            .reduce((sum, t) => sum + t.amount, 0);

        const percentage = (monthlyExpenses / this.settings.monthlyBudget) * 100;

        if (percentage >= this.settings.alertThreshold) {
            alert(`⚠️ Budget Alert: You've spent ₹${monthlyExpenses.toLocaleString('en-IN')} (${percentage.toFixed(1)}%) of your monthly budget of ₹${this.settings.monthlyBudget.toLocaleString('en-IN')}`);
        }
    }

    exportAllData() {
        const exportData = {
            transactions: this.transactions,
            goals: this.goals,
            settings: this.settings,
            exportDate: new Date().toISOString(),
            version: '1.0.0'
        };

        const jsonContent = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `budget-manager-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        this.showNotification('All data exported successfully!');
    }

    importData() {
        const fileInput = document.getElementById('fileInput');
        const file = fileInput.files[0];

        if (!file) {
            alert('Please select a file to import');
            return;
        }

        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const content = e.target.result;
                const lines = content.split('\n');

                // Check if it's CSV
                if (file.name.endsWith('.csv')) {
                    this.importCSV(lines);
                } else if (file.name.endsWith('.json')) {
                    this.importJSON(content);
                } else {
                    alert('Unsupported file format. Please use CSV or JSON.');
                    return;
                }

                document.getElementById('importModal').classList.remove('active');
                fileInput.value = '';

                this.showNotification('Data imported successfully!');

                // Reload page to reflect changes
                setTimeout(() => window.location.reload(), 1000);
            } catch (error) {
                alert('Error importing file: ' + error.message);
            }
        };

        reader.readAsText(file);
    }

    importCSV(lines) {
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const transactions = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const values = line.split(',').map(v => v.trim());

            if (values.length >= 5) {
                const transaction = {
                    id: Date.now() + i,
                    date: values[0],
                    description: values[1],
                    type: values[2].toLowerCase(),
                    category: values[3].toLowerCase(),
                    amount: parseFloat(values[4]),
                    timestamp: new Date().toISOString()
                };

                if (transaction.description && transaction.amount) {
                    transactions.push(transaction);
                }
            }
        }

        if (transactions.length > 0) {
            if (confirm(`Import ${transactions.length} transactions? This will add them to existing data.`)) {
                this.transactions = [...this.transactions, ...transactions];
                this.saveToStorage('transactions', this.transactions);
            }
        } else {
            alert('No valid transactions found in the CSV file.');
        }
    }

    importJSON(content) {
        const data = JSON.parse(content);

        // Check if it's a full backup
        if (data.transactions && data.goals) {
            if (confirm('This will replace all your existing data. Continue?')) {
                this.transactions = data.transactions || [];
                this.goals = data.goals || [];
                this.settings = data.settings || this.getDefaultSettings();

                this.saveToStorage('transactions', this.transactions);
                this.saveToStorage('goals', this.goals);
                this.saveToStorage('settings', this.settings);
            }
        }
        // Otherwise treat as transactions array
        else if (Array.isArray(data)) {
            if (confirm(`Import ${data.length} transactions? This will add them to existing data.`)) {
                this.transactions = [...this.transactions, ...data];
                this.saveToStorage('transactions', this.transactions);
            }
        } else {
            alert('Invalid JSON format.');
        }
    }

    clearAllData() {
        const confirmation = prompt('⚠️ WARNING: This will permanently delete ALL your data!\n\nType "DELETE" to confirm:');

        if (confirmation === 'DELETE') {
            localStorage.clear();
            alert('All data has been cleared. The page will now reload.');
            window.location.reload();
        } else {
            this.showNotification('Data deletion cancelled.');
        }
    }

    showNotification(message) {
        alert(message);
        console.log('Notification:', message);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.settingsPage = new SettingsPage();
});
