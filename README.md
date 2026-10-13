# 💰 Smart Budget Manager

> A modern, feature-rich personal finance tracker with multi-page architecture built with vanilla HTML, CSS, and JavaScript

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Pages](https://img.shields.io/badge/pages-5-orange.svg)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Problem Statement](#problem-statement)
- [Technologies](#technologies)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [User Guide](#user-guide)
- [Technical Documentation](#technical-documentation)
- [Advanced Features](#advanced-features)
- [Future Enhancements](#future-enhancements)

---

## 🎯 Overview

**Smart Budget Manager** is a comprehensive web-based personal finance tool that helps users track income, expenses, and savings goals across multiple dedicated pages. Unlike complex financial software, this app focuses on making financial management intuitive through visual analytics, smart insights, and a well-organized multi-page structure.

### Key Highlights

- 📊 **Multi-Page Architecture** - Dedicated pages for each feature
- 💳 **Transaction Management** - Complete transaction history with filters
- 📈 **Visual Analytics** - 4 interactive charts with time-period filters
- 🎯 **Goal Tracking** - Create and monitor multiple savings goals
- ⚙️ **Settings & Preferences** - Customize currency, theme, and more
- 🌙 **Dark Mode** - Eye-friendly theme switching
- 📱 **Responsive Design** - Works on all devices
- 💾 **Offline First** - No backend required, data stored locally

---

## ✨ Features

### 📄 Pages Overview

#### 🏠 Dashboard (index.html)

- Real-time financial summary cards
- Quick transaction entry form
- Recent transactions list (last 5)
- Smart insights panel
- Goal progress indicator

#### 💳 Transactions Page (Transactions.html)

- Complete transaction history
- Advanced filtering (search, type, category, sorting)
- Add new transactions
- Delete transactions
- Export to CSV/JSON
- Summary cards with total count

#### 📈 Analytics Page (Analytics.html)

- **4 Interactive Charts:**
  - Income vs Expense (Bar Chart)
  - Category-wise Spending (Doughnut Chart)
  - Monthly Trend (Line Chart)
  - Top Categories (Horizontal Bar Chart)
- Time period filters (All Time, This Month, This Week, This Year)
- Average daily spending calculation
- Savings rate percentage
- Detailed category analysis
- Smart spending insights

#### 🎯 Goals Page (Goals.html)

- Create multiple savings goals
- Set target amount and deadline
- Track progress with visual indicators
- Mark goals as complete/incomplete
- View active and completed goals separately
- Goal categories (Savings, Travel, Gadgets, Education, etc.)
- Calculate remaining amount and days

#### ⚙️ Settings Page (settings.html)

- **Appearance:** Theme selection (Light/Dark)
- **Currency & Format:** Choose currency symbol and date format
- **Budget Limits:** Set monthly budget with alert thresholds
- **Notifications:** Toggle budget alerts and goal reminders
- **Data Management:** Export all data, import CSV/JSON, clear all data
- **App Information:** Version and details

### Core Features

#### 1️⃣ Transaction Management

- ✅ Add income and expenses with description, amount, category, and date
- ✅ Categorize transactions (Food, Transport, Shopping, Bills, Health, Education, Salary, Entertainment, Other)
- ✅ Color-coded entries (Green for income, Red for expenses)
- ✅ Delete individual transactions
- ✅ View complete transaction history
- ✅ Sort by newest, oldest, highest, lowest amount

#### 2️⃣ Dynamic Financial Summary

Dashboard cards that auto-update:

- 💵 **Total Income** - Sum of all income transactions
- 💸 **Total Expense** - Sum of all expense transactions
- 💰 **Current Balance** - Real-time calculation (Income - Expense)
- 📊 **Average Daily Spending** - Calculated based on time period
- 🎯 **Savings Rate** - Percentage of income saved

#### 3️⃣ Data Persistence

- 💾 LocalStorage-based storage (no backend needed)
- 💾 Data persists across browser sessions
- 💾 Automatic save on every action
- 💾 Shared data across all pages
- 💾 Import/Export functionality for backup

#### 4️⃣ Visual Analytics

Powered by **Chart.js 4.4.0**:

- 🥧 **Category-wise Spending** - Doughnut chart showing expense distribution
- 📊 **Income vs Expense** - Bar chart comparing totals
- 📈 **Monthly Trend** - Line chart showing income/expense over time
- 🎯 **Top Categories** - Horizontal bar chart of highest spending categories
- 🔄 Real-time chart updates
- 📅 Time-period filtering

### Advanced Features

#### 5️⃣ Smart Insights 🧠

Intelligent spending analysis:

- ⚠️ Overspending warnings (when category exceeds 40% of expenses)
- ✅ Positive feedback for good savings rate (>20%)
- 🚨 Alert when expenses exceed income
- 💡 Personalized financial tips
- 📊 Context-aware insights on Analytics page

#### 6️⃣ Filters & Search 🔍

Powerful filtering options on Transactions page:

- Search by description or category
- Filter by type (Income/Expense/All)
- Filter by category (9 categories)
- Sort by newest, oldest, highest, lowest amount
- One-click clear all filters

#### 7️⃣ Export Options 📥

Multiple export formats:

- **CSV Export** - Spreadsheet format for Excel/Google Sheets
- **JSON Export** - Complete data backup
- **PDF Export** - Formatted report (Dashboard)
- **Full Data Export** - All transactions, goals, and settings (Settings page)

#### 8️⃣ Settings & Customization ⚙️

- **Theme:** Light/Dark mode with persistence
- **Currency:** ₹ (INR), $ (USD), € (EUR), £ (GBP), ¥ (JPY)
- **Date Format:** DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
- **Budget Alerts:** Set monthly limits and alert thresholds (50%, 75%, 80%, 90%)
- **Notifications:** Toggle budget alerts and goal reminders
- **Data Import:** Upload CSV or JSON files
- **Data Clear:** Reset all data with confirmation

#### 9️⃣ Multiple Goals Tracker 🎯

Enhanced goal management system:

- Create unlimited savings goals
- Name goals with descriptions
- Categorize goals (Savings, Travel, Gadgets, Education, Investment, Emergency Fund)
- Set target amount and deadline
- Visual progress bars
- Calculate days remaining
- Mark goals as complete
- Separate views for active and completed goals
- Track total savings across all completed goals

#### 🔟 Responsive Design 📱

- Mobile-first approach
- Hamburger menu for mobile devices
- Touch-friendly interface
- Adaptive layouts for phones, tablets, and desktops
- Consistent navigation across all pages

---

## 🚨 Problem Statement

**The Challenge:**
Most students and working professionals don't monitor their spending properly. They:

- Remember some numbers, forget others
- Have no real idea where their money goes
- Struggle with complex financial software
- Need expensive apps with subscriptions

**The Solution:**
Smart Budget Manager solves this by providing:

- ✅ Quick way to log every income and expense
- ✅ Automatic categorization
- ✅ Visual money flow representation
- ✅ Actionable financial insights
- ✅ Zero cost, zero complexity

---

## 🛠️ Technologies

| Technology                 | Version | Purpose                                |
| -------------------------- | ------- | -------------------------------------- |
| **HTML5**                  | -       | Structure & semantics                  |
| **CSS3**                   | -       | Styling, animations, responsive design |
| **JavaScript (ES6+)**      | -       | Logic, DOM manipulation, data handling |
| **Chart.js**               | 4.4.0   | Data visualization                     |
| **LocalStorage API**       | -       | Client-side data persistence           |
| **jsPDF**                  | 2.5.1   | PDF report generation                  |
| **Google Fonts (Poppins)** | -       | Typography                             |

**No frameworks, no dependencies, pure vanilla JavaScript!**

---

## 📁 Project Structure

```
smart-budget-manager/
├── index.html              # Dashboard - Main landing page
├── Transactions.html       # Transaction management page
├── Analytics.html          # Charts and analytics page
├── Goals.html              # Savings goals page
├── settings.html           # Settings and preferences page
├── css/
│   └── styles.css         # Complete stylesheet with all page styles
├── js/
│   ├── app.js             # Shared utilities and dashboard logic
│   ├── transactions.js    # Transaction page logic
│   ├── analytics.js       # Analytics and charts logic
│   ├── goals.js           # Goals management logic
│   └── settings.js        # Settings page logic
├── assets/                # (Empty - for future images/icons)
├── README.md              # This file
├── PRESENTATION.md        # Project presentation
└── QUICKSTART.md          # Quick start guide
```

### File Descriptions

**HTML Pages**

- **index.html** - Dashboard with summary cards, quick add form, recent transactions, and insights
- **Transactions.html** - Full transaction management with filters, sorting, and export
- **Analytics.html** - 4 interactive charts with time-period filters and detailed analysis
- **Goals.html** - Multiple savings goals with progress tracking
- **settings.html** - Comprehensive settings for customization and data management

**CSS (css/styles.css)**

- CSS custom properties for theming
- Flexbox and Grid layouts
- Responsive breakpoints (@media queries)
- Dark mode support with smooth transitions
- Page-specific styles (goals, settings, transactions)
- Toggle switches, modals, and form elements
- Animation keyframes

**JavaScript Modules**

- **app.js** - Shared utilities, theme management, mobile menu, dashboard functions
- **transactions.js** - TransactionsPage class with add, delete, filter, sort, and export
- **analytics.js** - AnalyticsPage class with 4 chart types and time-period filtering
- **goals.js** - GoalsPage class with create, track, complete, and delete goals
- **settings.js** - SettingsPage class with preferences, import/export, and data management

---

## 🚀 Getting Started

### Prerequisites

- ✅ Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- ✅ No server required
- ✅ No installations needed

### Installation

1. **Download/Clone the project**

   ```bash
   git clone <repository-url>
   cd smart-budget-manager
   ```

2. **Open in browser**

   - Simply double-click `index.html`
   - Or use a local server:

     ```bash
     # Python 3
     python -m http.server 8000

     # Node.js
     npx http-server
     ```

   - Open: `http://localhost:8000`

3. **Start using!**
   - No login required
   - No setup needed
   - Start adding transactions immediately

---

## 📖 User Guide

### 1. Adding Your First Transaction

**From Dashboard:**

1. Navigate to **Dashboard** (index.html)
2. Fill the "Quick Add Transaction" form:
   - **Description**: e.g., "Grocery shopping"
   - **Amount**: e.g., 2500
   - **Type**: Income or Expense
   - **Category**: Select appropriate category
   - **Date**: Pick transaction date
3. Click **Add Transaction**
4. Watch the dashboard update instantly!

**From Transactions Page:**

1. Click **Transactions** in the sidebar
2. Click **Add Transaction** button
3. Fill the form and submit
4. Transaction appears in the list immediately

### 2. Managing Transactions

1. Click **Transactions** in the sidebar
2. Use filters to narrow down:
   - **Search** by keyword (description or category)
   - **Filter by Type** (Income/Expense/All)
   - **Filter by Category** (9 options)
   - **Sort** by newest, oldest, highest, or lowest amount
3. Click **Delete** button on any transaction to remove it
4. Click **Export** to download CSV or JSON

### 3. Analyzing Your Spending

1. Click **Analytics** in the sidebar
2. Select time period (All Time, This Month, This Week, This Year)
3. View 4 interactive charts:
   - **Income vs Expense** - Bar chart comparing totals
   - **Category-wise Spending** - Doughnut chart showing distribution
   - **Monthly Trend** - Line chart tracking income/expense over time
   - **Top Categories** - Horizontal bar chart of highest spending
4. Check summary cards for quick stats
5. Review **Detailed Category Analysis** section
6. Read **Smart Insights** for personalized tips

### 4. Setting Savings Goals

1. Click **Goals** in the sidebar
2. Click **Add Goal** button
3. Enter goal details:
   - **Goal Name**: e.g., "New Laptop"
   - **Target Amount**: e.g., ₹50,000
   - **Target Date**: Set your deadline
   - **Category**: Select goal type
   - **Description**: Optional notes
4. Click **Create Goal**
5. Monitor progress with visual progress bars
6. Mark complete with ✓ button when achieved
7. View separate lists for active and completed goals

### 5. Customizing Settings

1. Click **Settings** in the sidebar
2. Customize appearance:
   - Select **Theme** (Light/Dark)
3. Set currency and format:
   - Choose **Currency Symbol** (₹, $, €, £, ¥)
   - Select **Date Format** preference
4. Configure budget:
   - Set **Monthly Budget Limit**
   - Choose **Alert Threshold** percentage
5. Toggle notifications:
   - Enable/disable **Budget Alerts**
   - Enable/disable **Goal Reminders**
6. Click **Save Settings** to apply changes

### 6. Exporting & Importing Data

**Export:**

1. **From Transactions page**: Click Export → Choose CSV or JSON
2. **From Settings page**: Click Export All Data → Downloads complete backup

**Import:**

1. Go to **Settings** page
2. Click **Import** button
3. Select CSV (transactions only) or JSON (full backup) file
4. Click **Import File**
5. Page reloads with imported data

### 7. Managing Data

**Clear All Data:**

1. Go to **Settings** page
2. Scroll to **Data Management** section
3. Click **Clear Data** button
4. Type "DELETE" to confirm
5. All data is removed and page reloads

### 8. Switching Themes

1. Click the **🌙/☀️** icon in the header (any page)
2. Theme switches instantly
3. Preference is saved automatically and applies to all pages

---

## 🔧 Technical Documentation

### Data Structure

```javascript
// Transaction Object
{
    id: 1700123456789,           // Unique timestamp
    description: "Grocery",       // User input
    amount: 2500,                // Number
    type: "expense",             // "income" | "expense"
    category: "food",            // Category slug
    date: "2025-11-16",          // ISO date string
    timestamp: "2025-11-16T10:30:00.000Z"  // Full ISO timestamp
}

// Goal Object (Multiple Goals Support)
{
    id: 1700123456789,           // Unique timestamp
    name: "New Laptop",          // Goal name
    amount: 50000,               // Target amount
    deadline: "2025-12-31",      // Target date
    category: "gadgets",         // Category slug
    description: "MacBook Pro",  // Optional description
    completed: false,            // Completion status
    createdAt: "2025-11-16T10:30:00.000Z",  // Creation timestamp
    completedAt: null            // Completion timestamp (if completed)
}

// Settings Object
{
    theme: "light",              // "light" | "dark"
    currency: "₹",               // Currency symbol
    dateFormat: "DD/MM/YYYY",    // Date format preference
    monthlyBudget: 50000,        // Monthly budget limit
    alertThreshold: 80,          // Alert at percentage (50, 75, 80, 90)
    budgetAlerts: true,          // Enable budget alerts
    goalReminders: true          // Enable goal reminders
}
```

### LocalStorage Keys

| Key            | Type   | Description                                     |
| -------------- | ------ | ----------------------------------------------- |
| `transactions` | Array  | All transaction records                         |
| `goals`        | Array  | All savings goals (active + completed)          |
| `settings`     | Object | User preferences and settings                   |
| `theme`        | String | "light" or "dark" (for backwards compatibility) |

### Category Mapping

**Transaction Categories:**

```javascript
{
    food: '🍔',
    transport: '🚗',
    shopping: '🛍️',
    bills: '💡',
    entertainment: '🎬',
    health: '⚕️',
    education: '📚',
    salary: '💼',
    other: '📦'
}
```

**Goal Categories:**

```javascript
{
    savings: '💰',
    travel: '✈️',
    gadgets: '📱',
    education: '📚',
    investment: '📈',
    emergency: '🚨',
    other: '📦'
}
```

### Key Functions

**Shared Utilities (app.js):**

- `toggleTheme()` - Switch light/dark mode
- `applyTheme()` - Apply theme to body
- `setupMobileMenu()` - Initialize hamburger menu
- `calculateTotals()` - Compute income/expense/balance
- `updateDashboard()` - Refresh dashboard summary cards
- `renderRecentTransactions(limit)` - Show recent entries
- `generateInsights()` - Create smart tips

**Transaction Operations (transactions.js):**

- `addTransaction()` - Add new transaction
- `deleteTransaction(id)` - Remove transaction
- `renderAllTransactions()` - Display full list
- `filterTransactions()` - Apply search, type, category, and sort filters
- `clearFilters()` - Reset all filters
- `exportCSV()` - Generate CSV file
- `exportJSON()` - Generate JSON backup

**Analytics Operations (analytics.js):**

- `getFilteredTransactions()` - Filter by time period
- `renderIncomeExpenseChart()` - Bar chart
- `renderCategoryChart()` - Doughnut chart
- `renderMonthlyTrendChart()` - Line chart
- `renderTopCategoriesChart()` - Horizontal bar chart
- `renderAnalysis()` - Detailed category breakdown
- `calculateDays()` - Calculate date range

**Goals Operations (goals.js):**

- `addGoal()` - Create new savings goal
- `deleteGoal(id)` - Remove goal
- `toggleGoalComplete(id)` - Mark goal as complete/incomplete
- `renderActiveGoals()` - Display active goals
- `renderCompletedGoals()` - Display completed goals
- `calculateBalance()` - Get current balance from transactions

**Settings Operations (settings.js):**

- `loadSettings()` - Load saved preferences
- `saveSettings()` - Save user preferences
- `checkBudgetAlert()` - Validate monthly budget
- `exportAllData()` - Export complete backup (transactions + goals + settings)
- `importCSV()` - Import transactions from CSV
- `importJSON()` - Import full backup or transactions
- `clearAllData()` - Reset all localStorage data

### Responsive Breakpoints

| Breakpoint | Device  | Layout Changes                   |
| ---------- | ------- | -------------------------------- |
| > 1024px   | Desktop | Full sidebar, multi-column grids |
| 768-1024px | Tablet  | Mobile sidebar, adjusted grids   |
| < 768px    | Mobile  | Hamburger menu, single column    |

---

## 🎨 Design System

### Color Palette

**Light Theme:**

```css
Primary: #00897b (Teal)
Success: #26a69a (Green)
Danger: #ef5350 (Red)
Warning: #ffa726 (Orange)
Background: #f5f7fa
Surface: #ffffff
```

**Dark Theme:**

```css
Background: #0f1419
Surface: #1a1f2e
Text: #e8eaed
Sidebar: #1a1d29
```

### Typography

- **Font Family**: Poppins (Google Fonts)
- **Weights**: 300 (Light), 400 (Regular), 500 (Medium), 600 (Semi-bold), 700 (Bold)

---

## 🔐 Security & Privacy

- ✅ **100% Client-side** - No data sent to servers
- ✅ **No Tracking** - Zero analytics or cookies
- ✅ **Local Storage Only** - Data stays in your browser
- ✅ **No Login Required** - Complete privacy
- ✅ **Open Source** - Transparent codebase

### Data Safety

Data is cleared only when:

- User manually clears browser data
- Browser cache is cleared
- User resets all data (future feature)

---

## ⚠️ Limitations

1. **Storage Limit** - ~5-10 MB (thousands of transactions)
2. **Single Device** - No cloud sync
3. **No Backup** - Clearing browser cache removes data
4. **Single User** - One user per browser/device
5. **No Recurring** - Manual entry for recurring transactions

---

## 🚀 Future Enhancements

### Planned Features

- [ ] Cloud sync with Firebase/Supabase
- [ ] Recurring transactions automation
- [ ] Budget limits per category
- [ ] Email/SMS notifications for alerts
- [ ] Bank statement CSV import with mapping
- [ ] Data encryption for sensitive information
- [ ] Multi-user support with authentication
- [ ] Bill reminders and due date tracking
- [ ] Receipt photo upload and OCR
- [ ] Progressive Web App (PWA) with offline support
- [ ] Mobile app (React Native/Flutter)
- [ ] AI-powered spending predictions
- [ ] Investment tracking integration
- [ ] Debt management module
- [ ] Tax calculation and reporting

---

## 🐛 Troubleshooting

**Transactions not saving?**

- Check if LocalStorage is enabled in browser settings
- Ensure you're not in Incognito/Private mode

**Charts not displaying?**

- Verify internet connection (Chart.js loads from CDN)
- Check browser console for errors

**Dark mode not persisting?**

- LocalStorage might be disabled
- Try clearing browser cache and reloading

**Export not working?**

- Check popup blocker settings
- Ensure browser supports download API

---

## 📄 License

© 2025 Smart Budget Manager. All rights reserved.

This project is for educational purposes.

---

## 🙏 Acknowledgments

- [Chart.js](https://www.chartjs.org/) - Beautiful charts
- [jsPDF](https://github.com/parallax/jsPDF) - PDF generation
- [Google Fonts](https://fonts.google.com/) - Poppins font
- [MDN Web Docs](https://developer.mozilla.org/) - Technical reference

---

## 👨‍💻 Author

Built with ❤️ using vanilla JavaScript

**Key Principles:**

- Clean, readable code
- No framework bloat
- Performance-first
- User-centric design

---

<div align="center">

**Smart Budget Manager v2.0.0**

_Making personal finance simple, visual, and organized_

🏠 [Dashboard](index.html) | 💳 [Transactions](Transactions.html) | 📈 [Analytics](Analytics.html) | 🎯 [Goals](Goals.html) | ⚙️ [Settings](settings.html)

[⬆ Back to Top](#-smart-budget-manager)

</div>
