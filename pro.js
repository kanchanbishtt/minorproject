/* ======== Smart Budget Manager - Pro (Vanilla JS) ======== */

/* ---------- Globals ---------- */
let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let pieChart = null;
let barChart = null;
const currency = "₹";

/* ---------- DOM ---------- */
const form = document.getElementById("transactionForm");
const transactionsList = document.getElementById("transactions");
const totalIncomeEl = document.getElementById("totalIncome");
const totalExpenseEl = document.getElementById("totalExpense");
const balanceEl = document.getElementById("balance");
const insightText = document.getElementById("insightText");
const goalProgressText = document.getElementById("goalProgressText");
const goalProgressBar = document.getElementById("goalProgress");

const searchInput = document.getElementById("searchInput");
const filterType = document.getElementById("filterType");
const filterCategory = document.getElementById("filterCategory");
const exportCSVBtn = document.getElementById("exportCSV");
const exportPDFBtn = document.getElementById("exportPDF");
const clearAllBtn = document.getElementById("clearAll");
const themeToggle = document.getElementById("themeToggle");

/* ---------- Initial Setup ---------- */
document.addEventListener("DOMContentLoaded", init);
if (form) form.addEventListener("submit", onAddTransaction);
if (searchInput) searchInput.addEventListener("input", renderTransactions);
if (filterType) filterType.addEventListener("change", renderTransactions);
if (filterCategory) filterCategory.addEventListener("change", renderTransactions);
if (exportCSVBtn) exportCSVBtn.addEventListener("click", exportCSV);
if (exportPDFBtn) exportPDFBtn.addEventListener("click", exportPDF);
if (clearAllBtn) clearAllBtn.addEventListener("click", clearAll);
if (themeToggle) themeToggle.addEventListener("click", toggleTheme);

/* ---------- Mobile Menu Toggle ---------- */
const mobileMenuToggle = document.getElementById("mobileMenuToggle");
const sidebar = document.getElementById("sidebar");

if (mobileMenuToggle) {
  mobileMenuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("mobile-open");
  });

  // Close sidebar when clicking outside
  document.addEventListener("click", (e) => {
    if (!sidebar.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
      sidebar.classList.remove("mobile-open");
    }
  });

  // Close sidebar when menu item is clicked
  document.querySelectorAll(".menu-item").forEach(item => {
    item.addEventListener("click", () => {
      sidebar.classList.remove("mobile-open");
    });
  });
}

/* ---------- Init ---------- */
function init() {
  if (transactions.length === 0) {
    transactions = [
      { id: 1, desc: "Stipend", amount: 20000, type: "income", category: "other", date: "2025-10-01" },
      { id: 2, desc: "Rent", amount: 6000, type: "expense", category: "rent", date: "2025-10-02" },
      { id: 3, desc: "Groceries", amount: 2200, type: "expense", category: "food", date: "2025-10-05" },
      { id: 4, desc: "Part-time", amount: 4000, type: "income", category: "other", date: "2025-11-01" },
      { id: 5, desc: "Bills", amount: 900, type: "expense", category: "bills", date: "2025-11-03" }
    ];
    save();
  }

  if (transactionsList) renderTransactions();
  if (totalIncomeEl) updateSummary();
  if (document.getElementById("categoryChart")) renderCharts();
  if (insightText) generateInsight();
}

/* ---------- CRUD & UI ---------- */
function onAddTransaction(e) {
  e.preventDefault();
  const desc = document.getElementById("description").value.trim();
  const amount = parseFloat(document.getElementById("amount").value);
  const type = document.getElementById("type").value;
  const category = document.getElementById("category").value;
  const date = document.getElementById("date").value;

  if (!desc || !amount || !date) return alert("Fill all fields");

  const tx = { id: Date.now(), desc, amount, type, category, date };
  transactions.unshift(tx);
  save();
  form.reset();
  renderTransactions();
  updateSummary();
  renderCharts();
  generateInsight();
}

function save() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

function clearAll() {
  if (!confirm("Clear ALL transactions?")) return;
  transactions = [];
  save();
  renderTransactions();
  updateSummary();
  renderCharts();
  generateInsight();
}

/* ---------- Render Transactions ---------- */
function renderTransactions() {
  if (!transactionsList) return;

  const q = searchInput ? (searchInput.value || "").toLowerCase() : "";
  const typeFilter = filterType ? filterType.value : "all";
  const catFilter = filterCategory ? filterCategory.value : "all";

  transactionsList.innerHTML = "";
  const filtered = transactions.filter(tx => {
    if (typeFilter !== "all" && tx.type !== typeFilter) return false;
    if (catFilter !== "all" && tx.category !== catFilter) return false;
    if (q && !(tx.desc.toLowerCase().includes(q) || tx.category.toLowerCase().includes(q) || tx.date.includes(q))) return false;
    return true;
  });

  if (filtered.length === 0) {
    transactionsList.innerHTML = `<li style="color:var(--muted);padding:12px">No transactions found.</li>`;
    return;
  }

  filtered.forEach(tx => {
    const li = document.createElement("li");
    li.className = "transaction-item";
    li.innerHTML = `
      <div class="tx-left">
        <div class="tx-cat" style="background:${categoryColor(tx.category)};color:#fff">${tx.category[0].toUpperCase()}</div>
        <div class="tx-desc">
          <strong>${tx.desc}</strong>
          <small>${tx.date} • ${tx.category}</small>
        </div>
      </div>
      <div class="tx-right">
        <div class="tx-amount" style="color:${tx.type === 'income' ? 'var(--success)' : 'var(--accent)'}">
          ${tx.type === 'income' ? '+' : '-'}${currency}${tx.amount}
        </div>
        <button class="btn outline" onclick="deleteTransaction(${tx.id})">Delete</button>
      </div>
    `;
    transactionsList.appendChild(li);
  });
}

/* ---------- Delete ---------- */
function deleteTransaction(id) {
  if (!confirm("Delete this transaction?")) return;
  transactions = transactions.filter(t => t.id !== id);
  save();
  renderTransactions();
  updateSummary();
  renderCharts();
  generateInsight();
}

/* ---------- Summary ---------- */
function updateSummary() {
  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  if (totalIncomeEl) totalIncomeEl.textContent = `${currency}${income}`;
  if (totalExpenseEl) totalExpenseEl.textContent = `${currency}${expense}`;
  if (balanceEl) balanceEl.textContent = `${currency}${balance}`;

  const savedGoal = localStorage.getItem("savingGoal") || 20;
  const goalPercent = parseFloat(savedGoal) / 100;
  const goal = Math.round(income * goalPercent);
  const saved = Math.max(0, income - expense);
  const progress = goal === 0 ? 0 : Math.min(100, Math.round((saved / goal) * 100));

  if (goalProgressText) goalProgressText.textContent = `${progress}% of goal`;
  if (goalProgressBar) goalProgressBar.style.width = `${progress}%`;
}

/* ---------- Dynamic Charts ---------- */
function renderCharts() {
  const pieCanvas = document.getElementById("categoryChart");
  const barCanvas = document.getElementById("barChart");

  if (!pieCanvas || !barCanvas) return;

  // Destroy existing to avoid duplicates
  if (pieChart) pieChart.destroy();
  if (barChart) barChart.destroy();

  // Donut: Category-wise Spending
  const categories = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    categories[t.category] = (categories[t.category] || 0) + t.amount;
  });

  const pieCtx = pieCanvas.getContext("2d");
  pieChart = new Chart(pieCtx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(categories),
      datasets: [{
        data: Object.values(categories),
        backgroundColor: Object.keys(categories).map(c => chartColor(c)),
        borderWidth: 1,
        borderColor: '#fff'
      }]
    },
    options: {
      cutout: '65%',
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });

  // Bar: Total Income vs Expense
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  const barCtx = barCanvas.getContext("2d");
  barChart = new Chart(barCtx, {
    type: 'bar',
    data: {
      labels: ['Income', 'Expense'],
      datasets: [{
        label: '₹ Amount',
        data: [totalIncome, totalExpense],
        backgroundColor: ['#26A69A', '#FF7043'],
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Income vs Expense', color: '#00695C' }
      },
      scales: {
        y: { beginAtZero: true, ticks: { color: '#00695C' } },
        x: { ticks: { color: '#00695C' } }
      }
    }
  });
}

/* ---------- Insights ---------- */
function generateInsight() {
  if (!insightText) return;

  const expenseTx = transactions.filter(t => t.type === 'expense');
  if (expenseTx.length === 0) {
    insightText.textContent = "Add transactions to get actionable tips.";
    return;
  }

  const totalExpense = expenseTx.reduce((s, t) => s + t.amount, 0);
  const byCat = {};
  expenseTx.forEach(t => byCat[t.category] = (byCat[t.category] || 0) + t.amount);
  const topCat = Object.keys(byCat).reduce((a, b) => byCat[a] > byCat[b] ? a : b);
  const pct = Math.round((byCat[topCat] / totalExpense) * 100);

  if (pct > 45) {
    insightText.textContent = `⚠️ ${pct}% of your expenses are in '${topCat}'. Consider reducing it.`;
  } else if (pct > 30) {
    insightText.textContent = `🔎 ${topCat} is your biggest spend (${pct}%) — watch it this month.`;
  } else {
    insightText.textContent = `✅ Good job — your spending looks balanced.`;
  }
}

/* ---------- Utilities ---------- */
function categoryColor(cat) {
  const map = {
    food: '#FF7043', rent: '#42A5F5', bills: '#AB47BC',
    shopping: '#FFCA28', travel: '#29B6F6', other: '#8BC34A'
  };
  return map[cat] || '#9E9E9E';
}

function chartColor(cat) {
  const map = {
    food: '#FF7043', rent: '#42A5F5', bills: '#AB47BC',
    shopping: '#FFCA28', travel: '#29B6F6', other: '#8BC34A'
  };
  return map[cat] || '#BDBDBD';
}

/* ---------- Export CSV ---------- */
function exportCSV() {
  if (transactions.length === 0) return alert("No data to export.");
  const header = ["id", "date", "description", "type", "category", "amount"];
  const rows = transactions.map(t => [t.id, t.date, `"${t.desc.replace(/"/g, '""')}"`, t.type, t.category, t.amount]);
  const csv = [header.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "transactions.csv";
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------- Export PDF ---------- */
function exportPDF() {
  if (transactions.length === 0) return alert("No data to export.");
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  doc.setFontSize(14);
  doc.text("SmartBudget - Transaction Report", 40, 50);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 68);

  const rows = transactions.slice(0, 40).map(t => [t.date, t.desc, t.type, t.category, `${currency}${t.amount}`]);
  let y = 100;
  doc.setFontSize(9);
  doc.text("Date", 40, y); doc.text("Description", 120, y); doc.text("Type", 360, y); doc.text("Category", 430, y); doc.text("Amount", 520, y);
  y += 12;
  rows.forEach(r => {
    doc.text(String(r[0]), 40, y); doc.text(String(r[1]).slice(0, 30), 120, y);
    doc.text(String(r[2]), 360, y); doc.text(String(r[3]), 430, y); doc.text(String(r[4]), 520, y);
    y += 14; if (y > 740) { doc.addPage(); y = 40; }
  });
  doc.save("transactions_report.pdf");
}

/* ---------- Theme toggle ---------- */
function toggleTheme() {
  document.body.classList.toggle("dark-mode");
  const isDark = document.body.classList.contains("dark-mode");
  localStorage.setItem("theme", isDark ? "dark" : "light");

  // Update theme icon
  const themeIcon = document.getElementById("themeToggle");
  if (themeIcon) {
    themeIcon.textContent = isDark ? "☀️" : "🌙";
  }
}

/* ---------- Load Theme on Page Load ---------- */
function loadTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    const themeIcon = document.getElementById("themeToggle");
    if (themeIcon) {
      themeIcon.textContent = "☀️";
    }
  }
}

// Load theme immediately
loadTheme();

// Note: Sidebar navigation is handled via <a> tags with href attributes




