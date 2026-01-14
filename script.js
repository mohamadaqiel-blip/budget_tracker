// Budget Tracker Application
document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    let currentCurrency = 'USD';
    let exchangeRates = {
        'USD': 1.0,
        'EUR': 0.9250,
        'GBP': 0.7900,
        'JPY': 147.50,
        'CAD': 1.3500,
        'AUD': 1.5500,
        'MYR': 4.6500
    };

    // DOM Elements
    const transactionForm = document.getElementById('transactionForm');
    const transactionsList = document.getElementById('transactionsList');
    const totalIncomeElement = document.getElementById('totalIncome');
    const totalExpenseElement = document.getElementById('totalExpense');
    const currentBalanceElement = document.getElementById('currentBalance');
    const currencySelect = document.getElementById('currency');
    const filterType = document.getElementById('filterType');
    const filterMonth = document.getElementById('filterMonth');
    const clearFilters = document.getElementById('clearFilters');
    const exchangeModal = document.getElementById('exchangeModal');
    const exchangeBtn = document.getElementById('exchangeBtn');
    const closeModal = document.querySelector('.close-modal');
    const fromCurrency = document.getElementById('fromCurrency');
    const toCurrency = document.getElementById('toCurrency');
    const exchangeAmount = document.getElementById('exchangeAmount');
    const convertedAmount = document.getElementById('convertedAmount');
    const exchangeRate = document.getElementById('exchangeRate');
    const convertBtn = document.getElementById('convertBtn');
    const swapCurrencies = document.getElementById('swapCurrencies');
    const exportData = document.getElementById('exportData');
    const importData = document.getElementById('importData');
    const clearData = document.getElementById('clearData');

    // Initialize date fields
    document.getElementById('date').valueAsDate = new Date();
    filterMonth.value = new Date().toISOString().slice(0, 7);

    // Update currency display
    function updateCurrencyDisplay() {
        const symbol = getCurrencySymbol(currentCurrency);
        document.querySelectorAll('.amount').forEach(el => {
            if (el.id !== 'convertedAmount') {
                const value = parseFloat(el.textContent.replace(/[^0-9.-]+/g, ''));
                if (!isNaN(value)) {
                    el.textContent = `${symbol}${value.toFixed(2)}`;
                }
            }
        });
    }

    // Get currency symbol
    function getCurrencySymbol(currency) {
        const symbols = {
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'JPY': '¥',
            'CAD': 'C$',
            'AUD': 'A$',
            'MYR': 'RM'
        };
        return symbols[currency] || '$';
    }

    // Update summary
    function updateSummary() {
        let totalIncome = 0;
        let totalExpense = 0;
        
        const filteredTransactions = filterTransactions();
        
        filteredTransactions.forEach(transaction => {
            const amount = parseFloat(transaction.amount);
            if (transaction.type === 'income') {
                totalIncome += amount;
            } else {
                totalExpense += amount;
            }
        });
        
        const balance = totalIncome - totalExpense;
        const symbol = getCurrencySymbol(currentCurrency);
        
        totalIncomeElement.textContent = `${symbol}${totalIncome.toFixed(2)}`;
        totalExpenseElement.textContent = `${symbol}${totalExpense.toFixed(2)}`;
        currentBalanceElement.textContent = `${symbol}${balance.toFixed(2)}`;
        
        // Update balance color based on value
        if (balance < 0) {
            currentBalanceElement.style.color = '#f44336';
        } else if (balance > 0) {
            currentBalanceElement.style.color = '#4CAF50';
        } else {
            currentBalanceElement.style.color = '#666';
        }
    }

    // Filter transactions
    function filterTransactions() {
        let filtered = [...transactions];
        
        // Filter by type
        if (filterType.value !== 'all') {
            filtered = filtered.filter(t => t.type === filterType.value);
        }
        
        // Filter by month
        if (filterMonth.value) {
            filtered = filtered.filter(t => t.date.startsWith(filterMonth.value));
        }
        
        return filtered;
    }

    // Display transactions
    function displayTransactions() {
        const filteredTransactions = filterTransactions();
        
        if (filteredTransactions.length === 0) {
            transactionsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <p>No transactions found. Try changing your filters.</p>
                </div>
            `;
            return;
        }
        
        transactionsList.innerHTML = '';
        const symbol = getCurrencySymbol(currentCurrency);
        
        filteredTransactions.forEach((transaction, index) => {
            const transactionElement = document.createElement('div');
            transactionElement.className = `transaction-item ${transaction.type}`;
            
            transactionElement.innerHTML = `
                <div class="transaction-date">${formatDate(transaction.date)}</div>
                <div class="transaction-type ${transaction.type}">
                    ${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                </div>
                <div class="transaction-category">
                    <i class="fas fa-${getCategoryIcon(transaction.category)}"></i>
                    ${formatCategory(transaction.category)}
                </div>
                <div class="transaction-description">${transaction.description || '-'}</div>
                <div class="transaction-amount ${transaction.type}">
                    ${transaction.type === 'income' ? '+' : '-'}${symbol}${parseFloat(transaction.amount).toFixed(2)}
                </div>
                <button class="delete-btn" onclick="deleteTransaction(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            
            transactionsList.appendChild(transactionElement);
        });
    }

    // Format date
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Format category
    function formatCategory(category) {
        return category
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    // Get category icon
    function getCategoryIcon(category) {
        const icons = {
            'salary': 'money-bill',
            'freelance': 'laptop',
            'investment': 'chart-line',
            'gift': 'gift',
            'food': 'utensils',
            'transport': 'car',
            'housing': 'home',
            'utilities': 'bolt',
            'entertainment': 'film',
            'shopping': 'shopping-bag',
            'health': 'heartbeat',
            'education': 'graduation-cap'
        };
        return icons[category] || 'tag';
    }

    // Add transaction
    transactionForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const transaction = {
            date: document.getElementById('date').value,
            type: document.getElementById('type').value,
            category: document.getElementById('category').value,
            amount: parseFloat(document.getElementById('amount').value).toFixed(2),
            description: document.getElementById('description').value
        };
        
        // Validate amount
        if (transaction.amount <= 0) {
            alert('Please enter a valid amount greater than 0.');
            return;
        }
        
        transactions.push(transaction);
        localStorage.setItem('transactions', JSON.stringify(transactions));
        
        // Reset form
        transactionForm.reset();
        document.getElementById('date').valueAsDate = new Date();
        
        // Update display
        updateSummary();
        displayTransactions();
        
        // Show success message
        showNotification('Transaction added successfully!', 'success');
    });

    // Delete transaction
    window.deleteTransaction = function(index) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            transactions.splice(index, 1);
            localStorage.setItem('transactions', JSON.stringify(transactions));
            updateSummary();
            displayTransactions();
            showNotification('Transaction deleted successfully!', 'success');
        }
    };

    // Currency change
    currencySelect.addEventListener('change', function() {
        currentCurrency = this.value;
        updateCurrencyDisplay();
        updateSummary();
        displayTransactions();
    });

    // Filter changes
    filterType.addEventListener('change', displayTransactions);
    filterMonth.addEventListener('change', displayTransactions);
    
    clearFilters.addEventListener('click', function() {
        filterType.value = 'all';
        filterMonth.value = new Date().toISOString().slice(0, 7);
        displayTransactions();
    });

    // Currency exchange modal
    exchangeBtn.addEventListener('click', function() {
        exchangeModal.style.display = 'flex';
    });

    closeModal.addEventListener('click', function() {
        exchangeModal.style.display = 'none';
    });

    window.addEventListener('click', function(e) {
        if (e.target === exchangeModal) {
            exchangeModal.style.display = 'none';
        }
    });

    // Swap currencies
    swapCurrencies.addEventListener('click', function() {
        const temp = fromCurrency.value;
        fromCurrency.value = toCurrency.value;
        toCurrency.value = temp;
        convertCurrency();
    });

    // Convert currency
    function convertCurrency() {
        const amount = parseFloat(exchangeAmount.value);
        const from = fromCurrency.value;
        const to = toCurrency.value;
        
        if (isNaN(amount) || amount <= 0) {
            showNotification('Please enter a valid amount.', 'error');
            return;
        }
        
        // Convert via USD as base
        const amountInUSD = amount / exchangeRates[from];
        const converted = amountInUSD * exchangeRates[to];
        
        const fromSymbol = getCurrencySymbol(from);
        const toSymbol = getCurrencySymbol(to);
        
        convertedAmount.value = `${toSymbol}${converted.toFixed(2)}`;
        exchangeRate.textContent = `1 ${from} = ${(exchangeRates[to] / exchangeRates[from]).toFixed(4)} ${to}`;
    }

    // Convert button
    convertBtn.addEventListener('click', convertCurrency);
    
    // Auto-convert on input change
    exchangeAmount.addEventListener('input', convertCurrency);
    fromCurrency.addEventListener('change', convertCurrency);
    toCurrency.addEventListener('change', convertCurrency);

    // Initialize conversion
    convertCurrency();

    // Export data
    exportData.addEventListener('click', function() {
        const dataStr = JSON.stringify(transactions, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `budget-tracker-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        showNotification('Data exported successfully!', 'success');
    });

    // Import data
    importData.addEventListener('click', function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = function(e) {
            const file = e.target.files[0];
            const reader = new FileReader();
            
            reader.onload = function(event) {
                try {
                    const importedData = JSON.parse(event.target.result);
                    
                    if (Array.isArray(importedData)) {
                        transactions = importedData;
                        localStorage.setItem('transactions', JSON.stringify(transactions));
                        updateSummary();
                        displayTransactions();
                        showNotification('Data imported successfully!', 'success');
                    } else {
                        showNotification('Invalid file format.', 'error');
                    }
                } catch (error) {
                    showNotification('Error reading file.', 'error');
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    });

    // Clear all data
    clearData.addEventListener('click', function() {
        if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            transactions = [];
            localStorage.removeItem('transactions');
            updateSummary();
            displayTransactions();
            showNotification('All data cleared successfully!', 'success');
        }
    });

    // Show notification
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            ${message}
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            background: ${type === 'success' ? '#4CAF50' : '#f44336'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    // Initialize app
    function initApp() {
        updateSummary();
        displayTransactions();
        updateCurrencyDisplay();
    }

    // Dynamic category switching based on type
    document.getElementById('type').addEventListener('change', function() {
        const type = this.value;
        const categorySelect = document.getElementById('category');
        const incomeGroup = document.getElementById('incomeCategories');
        const expenseGroup = document.getElementById('expenseCategories');
        
        if (type === 'income') {
            incomeGroup.style.display = 'block';
            expenseGroup.style.display = 'none';
            categorySelect.value = incomeGroup.querySelector('option').value;
        } else if (type === 'expense') {
            incomeGroup.style.display = 'none';
            expenseGroup.style.display = 'block';
            categorySelect.value = expenseGroup.querySelector('option').value;
        } else {
            incomeGroup.style.display = 'block';
            expenseGroup.style.display = 'block';
        }
    });

    // Initialize
    initApp();
});