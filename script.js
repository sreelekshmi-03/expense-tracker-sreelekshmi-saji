
const STORAGE_KEY = "expenseTrackerTransactions";
let transactions = [];
let editingId = null;
let pendingDeleteId = null;
const balanceElement = document.getElementById("balance");
const totalIncomeElement = document.getElementById("totalIncome");
const totalExpenseElement = document.getElementById("totalExpense");
const transactionCountElement = document.getElementById("transactionCount");

const transactionList = document.getElementById("transactionList");

const typeFilter = document.getElementById("typeFilter");
const categoryFilter = document.getElementById("categoryFilter");
const monthFilter = document.getElementById("monthFilter");

const monthlyIncomeElement = document.getElementById("monthlyIncome");
const monthlyExpenseElement = document.getElementById("monthlyExpense");
const monthlyBalanceElement = document.getElementById("monthlyBalance");

const categoryChart = document.getElementById("categoryChart");

const openModalBtn = document.getElementById("openModalBtn");
const emptyAddBtn = document.getElementById("emptyAddBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelBtn = document.getElementById("cancelBtn");

const transactionModal = document.getElementById("transactionModal");
const deleteModal = document.getElementById("deleteModal");

const transactionForm = document.getElementById("transactionForm");

const modalTitle = document.getElementById("modalTitle");
const submitText = document.getElementById("submitText");

const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");

const descriptionError = document.getElementById("descriptionError");
const amountError = document.getElementById("amountError");
const dateError = document.getElementById("dateError");
const formMessage = document.getElementById("formMessage");

const clearAllBtn = document.getElementById("clearAllBtn");

const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
function getToday() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(amount);
}function formatDate(dateString) {
    if (!dateString) {
        return "";
    }

    const date = new Date(`${dateString}T00:00:00`);

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}function getMonthKey(dateString) {
    return dateString.substring(0, 7);
}
function formatMonth(monthKey) {
    const date = new Date(`${monthKey}-01T00:00:00`);

    return date.toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric"
    });
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
function loadTransactions() {
    try {
        const savedTransactions = localStorage.getItem(STORAGE_KEY);

        if (savedTransactions) {
            const parsedTransactions = JSON.parse(savedTransactions);

            if (Array.isArray(parsedTransactions)) {
                transactions = parsedTransactions;
            }
        }
    } catch (error) {
        console.error("Unable to load transactions:", error);
        transactions = [];
    }
}


function saveTransactions() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(transactions)
        );
    } catch (error) {
        console.error("Unable to save transactions:", error);
        showFormMessage(
            "Your browser could not save the transaction.",
            "error"
        );
    }
}

function openTransactionModal(transaction = null) {
    clearFormErrors();
    hideFormMessage();

    if (transaction) {
        editingId = transaction.id;

        modalTitle.textContent = "Edit Transaction";
        submitText.textContent = "Save Changes";

        descriptionInput.value = transaction.description;
        amountInput.value = transaction.amount;
        categoryInput.value = transaction.category;
        dateInput.value = transaction.date;

        const selectedType = document.querySelector(
            `input[name="transactionType"][value="${transaction.type}"]`
        );

        if (selectedType) {
            selectedType.checked = true;
        }
    } else {
        editingId = null;

        modalTitle.textContent = "Add Transaction";
        submitText.textContent = "Add Transaction";

        transactionForm.reset();

        const incomeRadio = document.querySelector(
            'input[name="transactionType"][value="income"]'
        );

        if (incomeRadio) {
            incomeRadio.checked = true;
        }

        dateInput.value = getToday();
        categoryInput.value = "Salary";
    }

    transactionModal.classList.remove("hidden");

    setTimeout(() => {
        descriptionInput.focus();
    }, 100);
}


function closeTransactionModal() {
    transactionModal.classList.add("hidden");

    editingId = null;

    transactionForm.reset();
    clearFormErrors();
    hideFormMessage();

    dateInput.value = getToday();
}


function openDeleteModal(id) {
    pendingDeleteId = id;
    deleteModal.classList.remove("hidden");
}


function closeDeleteModal() {
    deleteModal.classList.add("hidden");
    pendingDeleteId = null;
}

function clearFormErrors() {
    descriptionError.textContent = "";
    amountError.textContent = "";
    dateError.textContent = "";

    descriptionInput.classList.remove("input-error");
    amountInput.classList.remove("input-error");
    dateInput.classList.remove("input-error");
}


function showFormMessage(message, type = "error") {
    formMessage.textContent = message;
    formMessage.className = `form-message ${type}`;
}


function hideFormMessage() {
    formMessage.textContent = "";
    formMessage.className = "form-message hidden";
}


function validateForm() {
    clearFormErrors();
    hideFormMessage();

    let isValid = true;

    const description = descriptionInput.value.trim();
    const amount = Number(amountInput.value);
    const date = dateInput.value;

    if (!description) {
        descriptionError.textContent = "Please enter a description.";
        descriptionInput.classList.add("input-error");
        isValid = false;
    }

    if (!amountInput.value || !Number.isFinite(amount) || amount <= 0) {
        amountError.textContent = "Please enter an amount greater than ₹0.";
        amountInput.classList.add("input-error");
        isValid = false;
    }

    if (!date) {
        dateError.textContent = "Please select a date.";
        dateInput.classList.add("input-error");
        isValid = false;
    }

    if (!isValid) {
        showFormMessage("Please fix the highlighted fields.", "error");
    }

    return isValid;
}

function handleFormSubmit(event) {
    event.preventDefault();

    if (!validateForm()) {
        return;
    }

    const typeElement = document.querySelector(
        'input[name="transactionType"]:checked'
    );

    const type = typeElement ? typeElement.value : "expense";

    const transactionData = {
        type: type,
        description: descriptionInput.value.trim(),
        amount: Number(amountInput.value),
        category: categoryInput.value,
        date: dateInput.value
    };

    if (editingId !== null) {
        transactions = transactions.map((transaction) => {
            if (transaction.id === editingId) {
                return {
                    ...transaction,
                    ...transactionData
                };
            }

            return transaction;
        });
    } else {
        const newTransaction = {
            id: Date.now(),
            ...transactionData
        };

        transactions.unshift(newTransaction);
    }

    saveTransactions();
    render();

    closeTransactionModal();
}

function deleteTransaction() {
    if (pendingDeleteId === null) {
        return;
    }

    transactions = transactions.filter(
        (transaction) => transaction.id !== pendingDeleteId
    );

    saveTransactions();
    render();

    closeDeleteModal();
}

function clearAllTransactions() {
    if (transactions.length === 0) {
        return;
    }

    const confirmed = window.confirm(
        "Are you sure you want to delete all transactions? This cannot be undone."
    );

    if (!confirmed) {
        return;
    }

    transactions = [];

    saveTransactions();
    render();
}

function updateSummary() {
    const totalIncome = transactions
        .filter((transaction) => transaction.type === "income")
        .reduce((total, transaction) => total + Number(transaction.amount), 0);

    const totalExpense = transactions
        .filter((transaction) => transaction.type === "expense")
        .reduce((total, transaction) => total + Number(transaction.amount), 0);

    const balance = totalIncome - totalExpense;

    balanceElement.textContent = formatCurrency(balance);
    totalIncomeElement.textContent = formatCurrency(totalIncome);
    totalExpenseElement.textContent = formatCurrency(totalExpense);
}

function getFilteredTransactions() {
    const selectedType = typeFilter.value;
    const selectedCategory = categoryFilter.value;

    return transactions.filter((transaction) => {
        const matchesType =
            selectedType === "all" ||
            transaction.type === selectedType;

        const matchesCategory =
            selectedCategory === "all" ||
            transaction.category === selectedCategory;

        return matchesType && matchesCategory;
    });
}

function renderTransactions() {
    const filteredTransactions = getFilteredTransactions();

    transactionList.innerHTML = "";

    if (filteredTransactions.length === 0) {
        const emptyMessage =
            transactions.length === 0
                ? "No transactions yet"
                : "No matching transactions";

        const emptyDescription =
            transactions.length === 0
                ? "Add your first income or expense to get started."
                : "Try changing your filters to see other transactions.";

        transactionList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">₹</div>
                <h3>${emptyMessage}</h3>
                <p>${emptyDescription}</p>
                ${
                    transactions.length === 0
                        ? `
                            <button
                                class="btn btn-primary"
                                id="emptyAddBtn"
                                type="button"
                            >
                                Add Transaction
                            </button>
                        `
                        : ""
                }
            </div>
        `;

        return;
    }

    filteredTransactions.forEach((transaction) => {
        const transactionElement = document.createElement("div");

        transactionElement.className = "transaction";

        const icon =
            transaction.type === "income"
                ? "↗"
                : "↘";

        const amountPrefix =
            transaction.type === "income"
                ? "+"
                : "-";

        transactionElement.innerHTML = `
            <div class="transaction-icon ${transaction.type}">
                ${icon}
            </div>

            <div class="transaction-info">
                <h3 class="transaction-description">
                    ${escapeHtml(transaction.description)}
                </h3>

                <div class="transaction-meta">
                    <span class="category-badge">
                        ${escapeHtml(transaction.category)}
                    </span>

                    <span>${formatDate(transaction.date)}</span>
                </div>
            </div>

            <div class="transaction-right">
                <strong class="transaction-amount ${transaction.type}">
                    ${amountPrefix}${formatCurrency(Number(transaction.amount))}
                </strong>

                <div class="transaction-actions">
                    <button
                        class="icon-btn edit-btn"
                        type="button"
                        data-action="edit"
                        data-id="${transaction.id}"
                        aria-label="Edit transaction"
                        title="Edit"
                    >
                        ✎
                    </button>

                    <button
                        class="icon-btn delete delete-btn"
                        type="button"
                        data-action="delete"
                        data-id="${transaction.id}"
                        aria-label="Delete transaction"
                        title="Delete"
                    >
                        ×
                    </button>
                </div>
            </div>
        `;

        transactionList.appendChild(transactionElement);
    });
}
function updateTransactionCount() {
    const filteredCount = getFilteredTransactions().length;

    transactionCountElement.textContent =
        `${filteredCount} transaction${filteredCount === 1 ? "" : "s"}`;
}
function populateMonthFilter() {
    const currentMonth = getMonthKey(getToday());

    const monthKeys = new Set();

    monthKeys.add(currentMonth);

    transactions.forEach((transaction) => {
        if (transaction.date) {
            monthKeys.add(getMonthKey(transaction.date));
        }
    });

    const sortedMonths = Array.from(monthKeys).sort().reverse();

    const previousValue = monthFilter.value;

    monthFilter.innerHTML = "";

    sortedMonths.forEach((monthKey) => {
        const option = document.createElement("option");

        option.value = monthKey;
        option.textContent = formatMonth(monthKey);

        monthFilter.appendChild(option);
    });

    if (sortedMonths.includes(previousValue)) {
        monthFilter.value = previousValue;
    } else {
        monthFilter.value = currentMonth;
    }
}


function updateMonthlySummary() {
    const selectedMonth = monthFilter.value;

    const monthlyTransactions = transactions.filter(
        (transaction) =>
            transaction.date &&
            getMonthKey(transaction.date) === selectedMonth
    );

    const monthlyIncome = monthlyTransactions
        .filter((transaction) => transaction.type === "income")
        .reduce((total, transaction) => total + Number(transaction.amount), 0);

    const monthlyExpense = monthlyTransactions
        .filter((transaction) => transaction.type === "expense")
        .reduce((total, transaction) => total + Number(transaction.amount), 0);

    const monthlyBalance = monthlyIncome - monthlyExpense;

    monthlyIncomeElement.textContent =
        formatCurrency(monthlyIncome);

    monthlyExpenseElement.textContent =
        formatCurrency(monthlyExpense);

    monthlyBalanceElement.textContent =
        formatCurrency(monthlyBalance);
}

function renderCategoryChart() {
    const expenseTransactions = transactions.filter(
        (transaction) => transaction.type === "expense"
    );

    if (expenseTransactions.length === 0) {
        categoryChart.innerHTML = `
            <p class="chart-empty">
                Add expenses to see your spending breakdown.
            </p>
        `;

        return;
    }

    const categoryTotals = {};

    expenseTransactions.forEach((transaction) => {
        const category = transaction.category || "Other";

        if (!categoryTotals[category]) {
            categoryTotals[category] = 0;
        }

        categoryTotals[category] += Number(transaction.amount);
    });

    const sortedCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1]);

    const highestAmount = sortedCategories[0][1];

    categoryChart.innerHTML = "";

    sortedCategories.forEach(([category, amount]) => {
        const percentage =
            highestAmount > 0
                ? (amount / highestAmount) * 100
                : 0;

        const row = document.createElement("div");

        row.className = "chart-row";

        row.innerHTML = `
            <div class="chart-category">
                ${escapeHtml(category)}
            </div>

            <div class="chart-bar-container">
                <div
                    class="chart-bar"
                    style="width: ${percentage}%"
                ></div>
            </div>

            <div class="chart-value">
                ${formatCurrency(amount)}
            </div>
        `;

        categoryChart.appendChild(row);
    });
}


function render() {
    updateSummary();

    populateMonthFilter();

    renderTransactions();

    updateTransactionCount();

    updateMonthlySummary();

    renderCategoryChart();
}
openModalBtn.addEventListener("click", () => {
    openTransactionModal();
});
emptyAddBtn.addEventListener("click", () => {
    openTransactionModal();
});
closeModalBtn.addEventListener("click", () => {
    closeTransactionModal();
});
cancelBtn.addEventListener("click", () => {
    closeTransactionModal();
});
transactionForm.addEventListener("submit", handleFormSubmit);
confirmDeleteBtn.addEventListener("click", () => {
    deleteTransaction();
});
cancelDeleteBtn.addEventListener("click", () => {
    closeDeleteModal();
});
clearAllBtn.addEventListener("click", () => {
    clearAllTransactions();
});
typeFilter.addEventListener("change", () => {
    renderTransactions();
    updateTransactionCount();
});
categoryFilter.addEventListener("change", () => {
    renderTransactions();
    updateTransactionCount();
});
monthFilter.addEventListener("change", () => {
    updateMonthlySummary();
});
transactionList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");

    if (!button) {
        return;
    }

    const id = Number(button.dataset.id);
    const action = button.dataset.action;

    const transaction = transactions.find(
        (item) => item.id === id
    );

    if (!transaction) {
        return;
    }

    if (action === "edit") {
        openTransactionModal(transaction);
    }

    if (action === "delete") {
        openDeleteModal(id);
    }
});
transactionList.addEventListener("click", (event) => {
    if (event.target.id === "emptyAddBtn") {
        openTransactionModal();
    }
});
transactionModal.addEventListener("click", (event) => {
    if (event.target === transactionModal) {
        closeTransactionModal();
    }
});
deleteModal.addEventListener("click", (event) => {
    if (event.target === deleteModal) {
        closeDeleteModal();
    }
});
document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
        return;
    }

    if (!transactionModal.classList.contains("hidden")) {
        closeTransactionModal();
    }

    if (!deleteModal.classList.contains("hidden")) {
        closeDeleteModal();
    }
});

function initializeApp() {
    loadTransactions();

    dateInput.value = getToday();

    render();
}

initializeApp();