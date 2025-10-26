// Global state management
class AppState {
    constructor() {
        this.inventory = JSON.parse(localStorage.getItem('inventory')) || [];
        this.transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        this.isVoiceActive = false;
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.currentTheme = localStorage.getItem('theme') || 'light';
        
        this.init();
    }

    init() {
        this.setupVoiceRecognition();
        this.setupEventListeners();
        this.applyTheme();
        this.loadInventory();
        this.loadTransactions();
        this.generateSampleData();
    }

    // Voice Bot Functionality
    setupVoiceRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';

            this.recognition.onstart = () => {
                this.isVoiceActive = true;
                this.updateVoiceStatus('listening', 'Listening... Speak now');
                this.speak('Voice assistant activated. How can I help you?');
            };

            this.recognition.onresult = (event) => {
                let transcript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    transcript += event.results[i][0].transcript;
                }
                this.updateVoiceTranscript(transcript);
                this.processVoiceCommand(transcript);
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.updateVoiceStatus('error', 'Error: ' + event.error);
            };

            this.recognition.onend = () => {
                this.isVoiceActive = false;
                this.updateVoiceStatus('idle', 'Click to start voice interaction');
            };
        } else {
            console.warn('Speech recognition not supported');
        }
    }

    speak(text) {
        if (this.synthesis) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1;
            this.synthesis.speak(utterance);
        }
    }

    updateVoiceStatus(status, message) {
        const statusEl = document.getElementById('voiceStatus');
        const icon = statusEl.querySelector('i');
        const text = statusEl.querySelector('p');

        statusEl.className = `voice-status ${status}`;
        
        switch (status) {
            case 'listening':
                icon.className = 'fas fa-microphone';
                break;
            case 'error':
                icon.className = 'fas fa-exclamation-triangle';
                break;
            default:
                icon.className = 'fas fa-microphone-slash';
        }
        
        text.textContent = message;
    }

    updateVoiceTranscript(transcript) {
        const transcriptEl = document.getElementById('voiceTranscript');
        transcriptEl.innerHTML = `<p>${transcript}</p>`;
    }

    processVoiceCommand(command) {
        const cmd = command.toLowerCase().trim();
        
        if (cmd.includes('add item') || cmd.includes('new item')) {
            this.speak('Opening add item form');
            document.getElementById('addItem').click();
        } else if (cmd.includes('view inventory') || cmd.includes('show inventory')) {
            this.speak('Showing inventory');
            document.getElementById('inventory').scrollIntoView({ behavior: 'smooth' });
        } else if (cmd.includes('view transactions') || cmd.includes('show transactions')) {
            this.speak('Showing transactions');
            document.getElementById('transactions').scrollIntoView({ behavior: 'smooth' });
        } else if (cmd.includes('make payment') || cmd.includes('upi payment')) {
            this.speak('Opening payment form');
            document.getElementById('payments').scrollIntoView({ behavior: 'smooth' });
        } else if (cmd.includes('search') && cmd.includes('item')) {
            const searchTerm = cmd.replace(/search|item/g, '').trim();
            this.searchInventory(searchTerm);
        } else if (cmd.includes('total inventory') || cmd.includes('inventory count')) {
            const total = this.inventory.reduce((sum, item) => sum + item.quantity, 0);
            this.speak(`Total inventory items: ${total}`);
        } else if (cmd.includes('total value') || cmd.includes('inventory value')) {
            const totalValue = this.inventory.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            this.speak(`Total inventory value: ₹${totalValue.toFixed(2)}`);
        } else if (cmd.includes('help') || cmd.includes('commands')) {
            this.speak('Available commands: add item, view inventory, view transactions, make payment, search items, total inventory, total value');
        } else {
            this.speak('I didn\'t understand that command. Say help for available commands.');
        }
    }

    searchInventory(term) {
        const results = this.inventory.filter(item => 
            item.name.toLowerCase().includes(term.toLowerCase()) ||
            item.category.toLowerCase().includes(term.toLowerCase())
        );
        
        if (results.length > 0) {
            this.speak(`Found ${results.length} items matching ${term}`);
            this.filterInventoryDisplay(term);
        } else {
            this.speak(`No items found matching ${term}`);
        }
    }

    filterInventoryDisplay(term) {
        const items = document.querySelectorAll('.inventory-item');
        items.forEach(item => {
            const name = item.querySelector('.item-name').textContent.toLowerCase();
            const category = item.querySelector('.item-category').textContent.toLowerCase();
            const matches = name.includes(term.toLowerCase()) || category.includes(term.toLowerCase());
            item.style.display = matches ? 'block' : 'none';
        });
    }

    // UPI Payment Simulation
    async processPayment(paymentData) {
        const statusEl = document.getElementById('paymentStatus');
        const icon = statusEl.querySelector('.status-icon i');
        const title = statusEl.querySelector('h4');
        const description = statusEl.querySelector('p');

        // Simulate payment processing
        statusEl.className = 'payment-status processing';
        icon.className = 'fas fa-spinner fa-spin';
        title.textContent = 'Processing Payment...';
        description.textContent = 'Please wait while we process your payment';

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Simulate success/failure (90% success rate)
        const isSuccess = Math.random() > 0.1;
        
        if (isSuccess) {
            statusEl.className = 'payment-status success';
            icon.className = 'fas fa-check-circle';
            title.textContent = 'Payment Successful!';
            description.textContent = `₹${paymentData.amount} sent to ${paymentData.recipient}`;
            
            // Add to transactions
            this.addTransaction({
                id: Date.now(),
                description: paymentData.description || `Payment to ${paymentData.recipient}`,
                amount: parseFloat(paymentData.amount),
                type: 'payment',
                status: 'completed',
                date: new Date().toISOString()
            });

            this.speak('Payment completed successfully');
        } else {
            statusEl.className = 'payment-status error';
            icon.className = 'fas fa-times-circle';
            title.textContent = 'Payment Failed';
            description.textContent = 'Please check your details and try again';
            
            this.speak('Payment failed. Please try again');
        }

        // Reset after 5 seconds
        setTimeout(() => {
            statusEl.className = 'payment-status';
            icon.className = 'fas fa-clock';
            title.textContent = 'Ready to Pay';
            description.textContent = 'Enter payment details to proceed';
        }, 5000);
    }

    // Database Management
    addItem(itemData) {
        const newItem = {
            id: Date.now(),
            name: itemData.name,
            price: parseFloat(itemData.price),
            quantity: parseInt(itemData.quantity),
            category: itemData.category,
            createdAt: new Date().toISOString()
        };

        this.inventory.push(newItem);
        this.saveInventory();
        this.loadInventory();
        this.speak(`Added ${newItem.name} to inventory`);
    }

    updateItem(id, updates) {
        const index = this.inventory.findIndex(item => item.id === id);
        if (index !== -1) {
            this.inventory[index] = { ...this.inventory[index], ...updates };
            this.saveInventory();
            this.loadInventory();
        }
    }

    deleteItem(id) {
        this.inventory = this.inventory.filter(item => item.id !== id);
        this.saveInventory();
        this.loadInventory();
        this.speak('Item deleted from inventory');
    }

    addTransaction(transactionData) {
        this.transactions.unshift(transactionData);
        this.saveTransactions();
        this.loadTransactions();
    }

    saveInventory() {
        localStorage.setItem('inventory', JSON.stringify(this.inventory));
    }

    saveTransactions() {
        localStorage.setItem('transactions', JSON.stringify(this.transactions));
    }

    loadInventory() {
        const grid = document.getElementById('inventoryGrid');
        if (!grid) return;

        if (this.inventory.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-boxes" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                    <h3>No items in inventory</h3>
                    <p>Add your first item to get started</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.inventory.map(item => `
            <div class="inventory-item" data-id="${item.id}">
                <div class="item-header">
                    <div class="item-name">${item.name}</div>
                    <div class="item-category">${item.category}</div>
                </div>
                <div class="item-details">
                    <div class="item-detail">
                        <div class="item-detail-label">Price</div>
                        <div class="item-detail-value">₹${item.price.toFixed(2)}</div>
                    </div>
                    <div class="item-detail">
                        <div class="item-detail-label">Quantity</div>
                        <div class="item-detail-value">${item.quantity}</div>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="item-btn edit" onclick="app.editItem(${item.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="item-btn delete" onclick="app.deleteItem(${item.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    loadTransactions() {
        const list = document.getElementById('transactionsList');
        if (!list) return;

        if (this.transactions.length === 0) {
            list.innerHTML = `
                <div class="empty-state" style="padding: 2rem; text-align: center;">
                    <i class="fas fa-receipt" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                    <h3>No transactions yet</h3>
                    <p>Your transactions will appear here</p>
                </div>
            `;
            return;
        }

        list.innerHTML = this.transactions.map(transaction => `
            <div class="transaction-item">
                <div class="transaction-info">
                    <div class="transaction-description">${transaction.description}</div>
                    <div class="transaction-date">${new Date(transaction.date).toLocaleDateString()}</div>
                </div>
                <div class="transaction-amount">₹${transaction.amount.toFixed(2)}</div>
                <div class="transaction-status ${transaction.status}">${transaction.status}</div>
            </div>
        `).join('');
    }

    generateSampleData() {
        if (this.inventory.length === 0) {
            const sampleItems = [
                { name: 'Laptop', price: 45000, quantity: 5, category: 'electronics' },
                { name: 'Smartphone', price: 25000, quantity: 10, category: 'electronics' },
                { name: 'T-Shirt', price: 500, quantity: 50, category: 'clothing' },
                { name: 'Book', price: 300, quantity: 25, category: 'books' },
                { name: 'Headphones', price: 2000, quantity: 15, category: 'electronics' }
            ];

            sampleItems.forEach(item => this.addItem(item));
        }

        if (this.transactions.length === 0) {
            const sampleTransactions = [
                {
                    id: Date.now() - 1000,
                    description: 'Payment to supplier',
                    amount: 50000,
                    type: 'payment',
                    status: 'completed',
                    date: new Date(Date.now() - 86400000).toISOString()
                },
                {
                    id: Date.now() - 2000,
                    description: 'Customer refund',
                    amount: 2500,
                    type: 'refund',
                    status: 'completed',
                    date: new Date(Date.now() - 172800000).toISOString()
                }
            ];

            sampleTransactions.forEach(transaction => this.addTransaction(transaction));
        }
    }

    // Theme Management
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        localStorage.setItem('theme', this.currentTheme);
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const themeIcon = themeToggle.querySelector('i');
            if (themeIcon) {
                themeIcon.className = this.currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
            }
        }
    }

    // Event Listeners
    setupEventListeners() {
        // Voice bot controls
        const voiceBtn = document.getElementById('voiceBtn');
        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => {
                if (this.isVoiceActive) {
                    this.recognition.stop();
                } else {
                    document.getElementById('voiceBot').classList.add('active');
                    this.recognition.start();
                }
            });
        }

        document.getElementById('closeVoice').addEventListener('click', () => {
            document.getElementById('voiceBot').classList.remove('active');
            if (this.isVoiceActive) {
                this.recognition.stop();
            }
        });

        const startVoiceBtn = document.getElementById('startVoice');
        if (startVoiceBtn) {
            startVoiceBtn.addEventListener('click', () => {
                document.getElementById('voiceBot').classList.add('active');
                if (!this.isVoiceActive) {
                    this.recognition.start();
                }
            });
        }

        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        // Login modal
        document.getElementById('loginBtn').addEventListener('click', () => {
            document.getElementById('loginModal').classList.add('active');
        });

        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            // Simple login simulation
            if (email && password) {
                this.speak('Login successful! Welcome to StreetsMart');
                document.getElementById('loginModal').classList.remove('active');
                // Reset form
                e.target.reset();
            }
        });

        // Add item modal
        document.getElementById('addItem').addEventListener('click', () => {
            document.getElementById('addItemModal').classList.add('active');
        });

        document.getElementById('closeModal').addEventListener('click', () => {
            document.getElementById('addItemModal').classList.remove('active');
        });

        document.getElementById('cancelAdd').addEventListener('click', () => {
            document.getElementById('addItemModal').classList.remove('active');
        });

        // Add item form
        document.getElementById('addItemForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const itemData = {
                name: formData.get('itemName') || document.getElementById('itemName').value,
                price: formData.get('itemPrice') || document.getElementById('itemPrice').value,
                quantity: formData.get('itemQuantity') || document.getElementById('itemQuantity').value,
                category: formData.get('itemCategory') || document.getElementById('itemCategory').value
            };
            
            this.addItem(itemData);
            document.getElementById('addItemModal').classList.remove('active');
            e.target.reset();
        });

        // Payment form
        document.getElementById('paymentForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const paymentData = {
                recipient: formData.get('recipient') || document.getElementById('recipient').value,
                amount: formData.get('amount') || document.getElementById('amount').value,
                description: formData.get('description') || document.getElementById('description').value
            };
            
            await this.processPayment(paymentData);
            e.target.reset();
        });

        // Transaction filter
        document.getElementById('transactionFilter').addEventListener('change', (e) => {
            this.filterTransactions(e.target.value);
        });

        // Get Started button
        document.getElementById('getStartedBtn').addEventListener('click', () => {
            this.speak('Welcome to StreetsMart! Let\'s get started with your sales management');
            document.getElementById('inventory').scrollIntoView({ behavior: 'smooth' });
        });

        // Learn More button
        document.getElementById('learnMoreBtn').addEventListener('click', () => {
            this.speak('Learn more about our analytics features');
            document.getElementById('analytics').scrollIntoView({ behavior: 'smooth' });
        });

        // View inventory button (if exists)
        const viewInventoryBtn = document.getElementById('viewInventory');
        if (viewInventoryBtn) {
            viewInventoryBtn.addEventListener('click', () => {
                document.getElementById('inventory').scrollIntoView({ behavior: 'smooth' });
            });
        }

        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('active');
            }
        });
    }

    filterTransactions(filter) {
        let filteredTransactions = this.transactions;
        const now = new Date();
        
        switch (filter) {
            case 'today':
                filteredTransactions = this.transactions.filter(t => {
                    const transactionDate = new Date(t.date);
                    return transactionDate.toDateString() === now.toDateString();
                });
                break;
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                filteredTransactions = this.transactions.filter(t => new Date(t.date) >= weekAgo);
                break;
            case 'month':
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                filteredTransactions = this.transactions.filter(t => new Date(t.date) >= monthAgo);
                break;
        }
        
        this.displayFilteredTransactions(filteredTransactions);
    }

    displayFilteredTransactions(transactions) {
        const list = document.getElementById('transactionsList');
        if (!list) return;

        if (transactions.length === 0) {
            list.innerHTML = `
                <div class="empty-state" style="padding: 2rem; text-align: center;">
                    <i class="fas fa-receipt" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                    <h3>No transactions found</h3>
                    <p>No transactions match the selected filter</p>
                </div>
            `;
            return;
        }

        list.innerHTML = transactions.map(transaction => `
            <div class="transaction-item">
                <div class="transaction-info">
                    <div class="transaction-description">${transaction.description}</div>
                    <div class="transaction-date">${new Date(transaction.date).toLocaleDateString()}</div>
                </div>
                <div class="transaction-amount">₹${transaction.amount.toFixed(2)}</div>
                <div class="transaction-status ${transaction.status}">${transaction.status}</div>
            </div>
        `).join('');
    }

    editItem(id) {
        const item = this.inventory.find(i => i.id === id);
        if (item) {
            const newName = prompt('Enter new name:', item.name);
            const newPrice = prompt('Enter new price:', item.price);
            const newQuantity = prompt('Enter new quantity:', item.quantity);
            
            if (newName && newPrice && newQuantity) {
                this.updateItem(id, {
                    name: newName,
                    price: parseFloat(newPrice),
                    quantity: parseInt(newQuantity)
                });
                this.speak(`Updated ${newName}`);
            }
        }
    }
}

// Initialize the application
const app = new AppState();

// Additional utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
}

function formatDate(date) {
    return new Intl.DateTimeFormat('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(date));
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 'k':
                e.preventDefault();
                const voiceBtn = document.getElementById('voiceBtn');
                if (voiceBtn) {
                    voiceBtn.click();
                }
                break;
            case 'n':
                e.preventDefault();
                document.getElementById('addItem').click();
                break;
        }
    }
    
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
        document.getElementById('voiceBot').classList.remove('active');
    }
});

// Service Worker registration for offline functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Export for global access
window.app = app;
