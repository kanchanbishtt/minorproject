1️⃣ Project Overview

Project Title: Smart Budget Manager
Goal: To help users manage their income, expenses, and savings efficiently through an interactive web dashboard that visualizes financial data.
Tech Used:

HTML (structure)

CSS (styling + dashboard layout)

JavaScript (data logic, charts, localStorage)

Chart.js (for analytics visuals)

jsPDF / FileSaver.js (optional export feature)



---

🧩 2️⃣ Problem Statement

Managing personal finances is a challenge for students and working professionals. People often lose track of how much they spend and on what.
This app helps users record, categorize, and visualize their expenses and income — turning raw data into meaningful financial insights.


---

⚙️ 3️⃣ Features

🧠 Core Features (Essential)

1. Add Transaction

Input fields: amount, description, category, type (income/expense), date

Add button triggers JS to save data and refresh UI.



2. Display Transactions List

Each entry shows date, description, amount, and category tag.

Use colored labels (green = income, red = expense).



3. Dynamic Summary

Calculate and show:

Total Income

Total Expense

Balance (Income – Expense)


Update live whenever a new transaction is added.



4. Data Persistence

Use localStorage to store all transactions so data remains after page reload.



5. Data Visualization

Show Pie Chart (category-wise spending breakdown).

Show Bar Chart (income vs expense over time).





---

🌟 Advanced (Optional but impressive)

6. Smart Insights

Based on category spending, display short tips like:

“⚠️ 45% of your income goes to Food. Try reducing that.”

“✅ You saved 20% this month — great progress!”


Use if-else conditions in JS based on percentages.



7. Filter & Search

Filter by category, type, or date range.

Search by description keyword.



8. Export to PDF or CSV

Let users download their monthly report.

Implement with jsPDF or FileSaver.js.



9. Dark Mode

Toggle button to switch between light and dark themes.



10. Goal Tracker



Let users set a saving goal and show progress visually.
