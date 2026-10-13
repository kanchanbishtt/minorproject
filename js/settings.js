/* ================================
   SETTINGS PAGE LOGIC
   ================================ */

class SettingsPage {
    constructor() {
        this.settings = BudgetUtils.normalizeSettings(BudgetUtils.readStorage('settings'));
        this.transactions = BudgetUtils.loadTransactions();
        this.goals = BudgetUtils.loadGoals();
        this.init();
    }

    init() {
        this.loadSettings();
        this.attachEventListeners();
    }

    getDefaultSettings() {
        return BudgetUtils.normalizeSettings({});
    }

    loadFromStorage(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    saveToStorage(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    loadSettings() {
        // The stored 'theme' (shared with the header toggle) is the source of truth
        this.settings.theme = BudgetUtils.readStorage('theme') === 'dark' ? 'dark' : 'light';
        document.getElementById('themeSelect').value = this.settings.theme;
        document.getElementById('currencySelect').value = this.settings.currency;
        document.getElementById('dateFormatSelect').value = this.settings.dateFormat;
        document.getElementById('monthlyBudget').value = this.settings.monthlyBudget || '';
        document.getElementById('alertThreshold').value = this.settings.alertThreshold;
        document.getElementById('budgetAlerts').checked = this.settings.budgetAlerts;
        document.getElementById('goalReminders').checked = this.settings.goalReminders;
    }

    attachEventListeners() {
        // Theme select: applies immediately, like the header toggle
        document.getElementById('themeSelect').addEventListener('change', (e) => {
            this.setTheme(e.target.value);
        });

        // The header toggle switches a class on <body>; keep the dropdown in step
        new MutationObserver(() => {
            const theme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
            document.getElementById('themeSelect').value = theme;
            if (this.settings.theme !== theme) {
                this.settings.theme = theme;
                this.saveToStorage('settings', this.settings);
            }
        }).observe(document.body, { attributes: true, attributeFilter: ['class'] });

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

    // Goes through BudgetManager.setTheme so the stored theme, the header toggle
    // and this dropdown never disagree
    setTheme(theme) {
        window.budgetApp.setTheme(theme);
        this.settings.theme = window.budgetApp.theme;
        this.saveToStorage('settings', this.settings);
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
        window.budgetApp.setTheme(this.settings.theme);

        this.showNotification('Settings saved successfully!');

        // Check budget alert
        this.checkBudgetAlert();
    }

    checkBudgetAlert() {
        if (!this.settings.budgetAlerts) return;
        const status = BudgetUtils.budgetStatus(this.transactions, this.settings);
        if (!status || !status.alert) return;

        const money = amount => BudgetUtils.formatMoney(amount, this.settings.currency);
        alert(`⚠️ Budget Alert: You've spent ${money(status.spent)} (${status.percentage.toFixed(1)}%) of your monthly budget of ${money(status.budget)}`);
    }

    exportAllData() {
        const exportData = {
            transactions: this.transactions,
            goals: this.goals,
            settings: this.settings,
            exportDate: new Date().toISOString(),
            version: '1.0.0'
        };

        BudgetUtils.downloadFile(
            JSON.stringify(exportData, null, 2),
            `budget-manager-backup-${BudgetUtils.toLocalISODate(new Date())}.json`,
            'application/json'
        );

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

                const name = file.name.toLowerCase();
                let summary;
                if (name.endsWith('.csv')) {
                    summary = this.importCSV(content);
                } else if (name.endsWith('.json')) {
                    summary = this.importJSON(content);
                } else {
                    alert('Unsupported file format. Please use CSV or JSON.');
                    return;
                }

                // Cancelled, or nothing valid (the importer already said why): leave
                // the dialog open so another file can be chosen
                if (!summary) return;

                document.getElementById('importModal').classList.remove('active');
                fileInput.value = '';

                // Reload to reflect the new data; the notice shows after the reload
                BudgetUtils.flashToast(`Import complete: ${summary}.`);
                window.location.reload();
            } catch (error) {
                alert('Error importing file: ' + error.message);
            }
        };

        reader.readAsText(file);
    }

    importCSV(content) {
        // Row 0 is the export header: Date, Description, Type, Category, Amount
        const rows = BudgetUtils.parseCSV(content)
            .slice(1)
            .filter(row => row.some(cell => cell.trim() !== ''));
        const parsed = rows.map(row => {
            const v = row.map(cell => BudgetUtils.fromCSVCell(cell.trim()));
            return { date: v[0], description: v[1], type: v[2], category: v[3], amount: v[4], timestamp: new Date().toISOString() };
        });
        return this.mergeTransactions(parsed, 'the CSV file');
    }

    // Validates imported rows with the same rules as the app's forms, asks before
    // adding them, and returns a summary, or null when nothing was imported
    mergeTransactions(rows, source) {
        const valid = rows.map(BudgetUtils.normalizeTransaction).filter(Boolean);
        const skipped = rows.length - valid.length;

        if (valid.length === 0) {
            alert(`No valid transactions found in ${source}.`);
            return null;
        }

        const skippedNote = skipped ? ` (${skipped} invalid row${skipped === 1 ? '' : 's'} will be skipped)` : '';
        if (!confirm(`Import ${valid.length} transactions${skippedNote}? They will be added to your existing data.`)) {
            return null;
        }

        // Existing rows keep their ids; imported rows get fresh unique ones
        const imported = valid.map(t => ({ ...t, id: undefined }));
        this.transactions = BudgetUtils.normalizeList([...this.transactions, ...imported], BudgetUtils.normalizeTransaction).items;
        this.saveToStorage('transactions', this.transactions);
        return `${valid.length} imported, ${skipped} skipped`;
    }

    importJSON(content) {
        const data = JSON.parse(content);

        // Full backup (from Export All Data): replaces everything
        if (data && typeof data === 'object' && Array.isArray(data.transactions) && Array.isArray(data.goals)) {
            const transactions = BudgetUtils.normalizeList(data.transactions, BudgetUtils.normalizeTransaction);
            const goals = BudgetUtils.normalizeList(data.goals, BudgetUtils.normalizeGoal);
            const skipped = transactions.skipped + goals.skipped;
            const skippedNote = skipped ? ` ${skipped} invalid entr${skipped === 1 ? 'y' : 'ies'} will be skipped.` : '';

            if (!confirm(`This will replace all your existing data with ${transactions.items.length} transactions and ${goals.items.length} goals.${skippedNote} Continue?`)) {
                return null;
            }

            this.transactions = transactions.items;
            this.goals = goals.items;
            this.settings = BudgetUtils.normalizeSettings(data.settings);

            this.saveToStorage('transactions', this.transactions);
            this.saveToStorage('goals', this.goals);
            this.saveToStorage('settings', this.settings);
            this.saveToStorage('theme', this.settings.theme);
            return `${transactions.items.length} transactions and ${goals.items.length} goals restored, ${skipped} skipped`;
        }

        // Otherwise treat as a transactions array
        if (Array.isArray(data)) {
            return this.mergeTransactions(data, 'the JSON file');
        }

        alert('Invalid JSON format.');
        return null;
    }

    clearAllData() {
        const confirmation = prompt('⚠️ WARNING: This will permanently delete ALL your data!\n\nType "DELETE" to confirm:');

        if (confirmation === 'DELETE') {
            localStorage.clear();
            BudgetUtils.flashToast('All data has been cleared.');
            window.location.reload();
        } else {
            this.showNotification('Data deletion cancelled.');
        }
    }

    // Success messages: non-blocking notice (warnings and errors still use dialogs)
    showNotification(message) {
        BudgetUtils.showToast(message);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.settingsPage = new SettingsPage();
});
