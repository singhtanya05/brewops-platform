class BrewOpsApp {
    constructor() {
        this.apiBaseUrl = 'http://localhost:8080/api/v1';
        this.tokenKey = 'brewops_token';
        this.roleKey = 'brewops_role';
        
        // Cart local state
        this.sessionId = localStorage.getItem('brewops_sessionId') || 'session-' + Date.now();
        localStorage.setItem('brewops_sessionId', this.sessionId);
        
        this.currentView = 'store';
        
        // Cached data
        this.menu = [];
        this.suppliers = [];
        
        // Polling timer
        this.kitchenInterval = null;
        this.trackerInterval = null;
    }

    init() {
        this.restoreSession();
        this.loadMenu();
        this.updateStoreStatus();
        this.setupMascotInteractions();
        
        // Initial drawer display
        this.updateCartDrawer();
        
        // Update store status every minute
        setInterval(() => this.updateStoreStatus(), 60000);
    }

    // AUTH HELPER METHODS
    restoreSession() {
        const token = localStorage.getItem(this.tokenKey);
        const role = localStorage.getItem(this.roleKey);
        
        const loginBtn = document.getElementById('loginHeaderBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const avatar = document.getElementById('userAvatar');
        const roleBadge = document.getElementById('userRoleBadge');
        
        if (token && role) {
            roleBadge.textContent = role;
            roleBadge.style.backgroundColor = role === 'ADMIN' ? 'var(--accent-orange)' : 'var(--text-secondary)';
            
            loginBtn.classList.add('hidden');
            logoutBtn.classList.remove('hidden');
            avatar.classList.remove('hidden');
            avatar.textContent = role.charAt(0);
            
            // Adjust sidebar navigation items
            document.getElementById('navKitchen').classList.remove('hidden');
            if (role === 'ADMIN') {
                document.getElementById('navSuppliers').classList.remove('hidden');
                document.getElementById('navInventory').classList.remove('hidden');
            }
        } else {
            roleBadge.textContent = 'GUEST';
            roleBadge.style.backgroundColor = 'var(--accent-matcha)';
            
            loginBtn.classList.remove('hidden');
            logoutBtn.classList.add('hidden');
            avatar.classList.add('hidden');
            
            document.getElementById('navKitchen').classList.add('hidden');
            document.getElementById('navSuppliers').classList.add('hidden');
            document.getElementById('navInventory').classList.add('hidden');
        }
    }

    showLogin() {
        this.switchView('auth');
    }

    async handleAuthSubmit(e) {
        e.preventDefault();
        const email = document.getElementById('authEmail').value;
        const password = document.getElementById('authPassword').value;
        
        try {
            const resp = await fetch(`${this.apiBaseUrl}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            if (!resp.ok) throw new Error('Authentication failed');
            const data = await resp.json();
            
            // Save info
            localStorage.setItem(this.tokenKey, data.token);
            // Parse token roles simply
            const payload = JSON.parse(atob(data.token.split('.')[1]));
            const roles = payload.roles || [];
            const primaryRole = roles.includes('ADMIN') ? 'ADMIN' : (roles.includes('STAFF') ? 'STAFF' : 'CUSTOMER');
            
            localStorage.setItem(this.roleKey, primaryRole);
            
            this.restoreSession();
            this.switchView(primaryRole === 'ADMIN' ? 'suppliers' : 'kitchen');
            
            // Reset form
            document.getElementById('authForm').reset();
        } catch (err) {
            alert(err.message);
        }
    }

    logout() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.roleKey);
        this.restoreSession();
        this.switchView('store');
    }

    getAuthHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        const token = localStorage.getItem(this.tokenKey);
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }

    // VIEW SWAPPING
    switchView(view) {
        this.toggleSidebar(false);
        this.toggleRightDrawer(false);
        
        this.currentView = view;
        
        // Hide all main section containers
        document.getElementById('viewAuth').classList.add('hidden');
        document.getElementById('viewStore').classList.add('hidden');
        document.getElementById('viewKitchen').classList.add('hidden');
        document.getElementById('viewSuppliers').classList.add('hidden');
        document.getElementById('viewInventory').classList.add('hidden');
        
        // Hide all right drawer variants
        document.getElementById('drawerCart').classList.add('hidden');
        document.getElementById('drawerTracker').classList.add('hidden');
        document.getElementById('drawerAdminForms').classList.add('hidden');
        document.getElementById('drawerCreatePO').classList.add('hidden');
        
        // Stop any active interval loops
        clearInterval(this.kitchenInterval);
        
        // Highlight active nav item
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        
        // Activate target section
        if (view === 'auth') {
            document.getElementById('viewAuth').classList.remove('hidden');
            document.getElementById('drawerCart').classList.remove('hidden');
        } else if (view === 'store') {
            document.getElementById('viewStore').classList.remove('hidden');
            document.getElementById('drawerCart').classList.remove('hidden');
            document.getElementById('navStore').classList.add('active');
            this.loadMenu();
        } else if (view === 'kitchen') {
            document.getElementById('viewKitchen').classList.remove('hidden');
            document.getElementById('drawerCart').classList.remove('hidden');
            document.getElementById('navKitchen').classList.add('active');
            this.loadKitchenQueue();
            this.kitchenInterval = setInterval(() => this.loadKitchenQueue(), 5000);
        } else if (view === 'suppliers') {
            document.getElementById('viewSuppliers').classList.remove('hidden');
            document.getElementById('drawerAdminForms').classList.remove('hidden');
            document.getElementById('navSuppliers').classList.add('active');
            document.getElementById('adminFormTitle').textContent = "Create Supplier";
            this.loadPurchaseOrders();
            this.loadLowStockAlerts();
        } else if (view === 'inventory') {
            document.getElementById('viewInventory').classList.remove('hidden');
            document.getElementById('drawerAdminForms').classList.remove('hidden');
            document.getElementById('navInventory').classList.add('active');
            document.getElementById('adminFormTitle').textContent = "Restock Warnings";
            this.loadInventory();
            this.loadLowStockAlerts();
        }
    }

    // CUSTOMER: MENU PORTAL
    filterMenu(category, button) {
        // Toggle tab classes
        document.querySelectorAll('.category-tabs .btn-clay').forEach(btn => btn.classList.remove('active-tab'));
        if (button) button.classList.add('active-tab');

        const menuGrid = document.getElementById('menuGrid');
        menuGrid.innerHTML = '';

        this.menu.forEach(cat => {
            cat.products.forEach(product => {
                // Category matching rules
                const prodName = product.name.toLowerCase();
                const matches = (category === 'all') || (cat.slug === category);

                if (!matches) return;

                product.variants.forEach(variant => {
                    const card = document.createElement('div');
                    card.className = 'clay-card';
                    card.style.display = 'flex';
                    card.style.flexDirection = 'column';
                    card.style.position = 'relative';
                    card.style.padding = '24px 20px 32px 20px';
                    
                    let emoji = '☕';
                    let bgGradient = 'radial-gradient(circle, #FBF7F4 0%, #F1E9E4 100%)';
                    if (prodName.includes('matcha')) {
                        emoji = '🍵';
                        bgGradient = 'radial-gradient(circle, #F2F8F2 0%, #E3EEE3 100%)';
                    } else if (prodName.includes('cold') || prodName.includes('lemonade') || prodName.includes('fizz') || prodName.includes('brew')) {
                        emoji = '🥤';
                        bgGradient = 'radial-gradient(circle, #EBF3F8 0%, #D4E5F0 100%)';
                    } else if (cat.slug === 'bakery') {
                        emoji = '🥐';
                        bgGradient = 'radial-gradient(circle, #FCF8F2 0%, #F5EADB 100%)';
                    }
                    
                    card.innerHTML = `
                        <div style="display: flex; gap: 20px; align-items: center; width: 100%;">
                            <!-- Left: Drink illustration box -->
                            <div class="drink-image-box" style="width: 130px; height: 130px; flex-shrink: 0; margin-bottom: 0; background: ${bgGradient}; display: flex; justify-content: center; align-items: center; border-radius: 24px; box-shadow: var(--shadow-clay-input); border: 2px solid rgba(255,255,255,0.7); position: relative; overflow: hidden; transition: transform 0.2s ease;">
                                <!-- Glossy highlight overlay -->
                                <div style="position: absolute; top: 0; left: 0; width: 100%; height: 50%; background: linear-gradient(to bottom, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 100%); pointer-events: none; border-radius: 24px 24px 0 0;"></div>
                                <!-- Floating emoji -->
                                <span style="font-size: 64px; display: inline-block; filter: drop-shadow(0 8px 16px rgba(0,0,0,0.15)); transform: rotate(-5deg); transition: transform 0.2s ease;">${emoji}</span>
                            </div>
                            <!-- Right: Drink Details -->
                            <div style="flex: 1; display: flex; flex-direction: column; gap: 4px; overflow: hidden;">
                                <div class="drink-name" style="font-size: 15px; margin-bottom: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${product.name}</div>
                                <div style="font-size: 11px; font-weight: 600; color: var(--accent-coffee); opacity: 0.85; margin-bottom: 2px;">${variant.name}</div>
                                <div style="font-size: 10px; color: var(--text-secondary);">SKU: ${variant.sku} | Stock: ${variant.availableQuantity}</div>
                                <div class="drink-meta" style="margin-top: 6px; display: flex; justify-content: space-between; align-items: center; width: 100%;">
                                    <span class="drink-price" style="font-size: 15px; font-weight:700;">$${variant.price.toFixed(2)}</span>
                                    <button class="btn-clay btn-primary" style="padding: 6px 12px; font-size: 11px;" onclick="app.openCustomizationModal('${variant.variantId}', ${variant.price}, '${product.name} - ${variant.name}', '${product.description || ""}')">Add</button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Bottom Overlapping Pill Badge: Live Feedback Score -->
                        <div style="position: absolute; bottom: -12px; left: 50%; transform: translateX(-50%); background: #EAF3EB; border: 1.5px solid #C4DFC7; border-radius: 20px; padding: 4px 14px; font-family: 'Outfit', sans-serif; font-size: 10px; font-weight: 700; color: #508055; display: flex; align-items: center; gap: 6px; box-shadow: var(--shadow-clay-button); white-space: nowrap; pointer-events: none; z-index: 10;">
                            <span style="background: #7DA07A; width: 6px; height: 6px; border-radius: 50%; display: inline-block;"></span>
                            LIVE FEEDBACK SCORE: <span style="color: var(--text-primary);">4.8 ★</span>
                        </div>
                    `;
                    menuGrid.appendChild(card);
                });
            });
        });
    }

    async loadMenu() {
        try {
            const resp = await fetch(`${this.apiBaseUrl}/menu`);
            if (!resp.ok) throw new Error('Could not load menu');
            this.menu = await resp.json();
            this.isOfflineMode = false;
            const banner = document.getElementById('offlineDemoBanner');
            if (banner) banner.classList.add('hidden');
        } catch (err) {
            console.warn("Server offline. Running in Offline Demo Mode.", err);
            this.isOfflineMode = true;
            const banner = document.getElementById('offlineDemoBanner');
            if (banner) banner.classList.remove('hidden');
            
            // Rich fallback mock menu
            this.menu = [
                {
                    name: "Coffee",
                    slug: "coffee",
                    products: [
                        {
                            name: "Signature Vanilla Latte",
                            description: "Rich espresso with house-made vanilla bean syrup and silky steamed milk",
                            variants: [
                                { variantId: "latte-small", name: "Small", sku: "LATTE-SMALL", price: 4.00, availableQuantity: 50 },
                                { variantId: "latte-medium", name: "Medium", sku: "LATTE-MEDIUM", price: 4.75, availableQuantity: 50 }
                            ]
                        },
                        {
                            name: "Organic Cold Brew",
                            description: "Steeped for 18 hours in cold filtered water for an ultra-smooth finish",
                            variants: [
                                { variantId: "cb-reg", name: "Regular", sku: "CB-REG", price: 3.75, availableQuantity: 60 },
                                { variantId: "cb-nitro", name: "Nitro", sku: "CB-NITRO", price: 4.50, availableQuantity: 40 }
                            ]
                        }
                    ]
                },
                {
                    name: "Matcha",
                    slug: "matcha",
                    products: [
                        {
                            name: "Ceremonial Matcha Latte",
                            description: "Stone-ground green tea whisked with creamy steamed milk",
                            variants: [
                                { variantId: "matcha-hot", name: "Hot", sku: "MATCHA-HOT", price: 4.50, availableQuantity: 30 },
                                { variantId: "matcha-iced", name: "Iced", sku: "MATCHA-ICED", price: 4.75, availableQuantity: 30 }
                            ]
                        },
                        {
                            name: "Strawberry Matcha Fusion",
                            description: "Iced matcha layered over fresh strawberry puree and milk",
                            variants: [
                                { variantId: "strawberry-matcha-iced", name: "Iced", sku: "STRAWBERRY-MATCHA-ICED", price: 5.25, availableQuantity: 25 }
                            ]
                        }
                    ]
                },
                {
                    name: "Cold Fusions",
                    slug: "cold",
                    products: [
                        {
                            name: "Lavender Honey Lemonade",
                            description: "Fresh squeezed lemon juice infused with natural lavender and honey",
                            variants: [
                                { variantId: "lav-lem-reg", name: "Regular", sku: "LAV-LEM-REG", price: 4.25, availableQuantity: 35 }
                            ]
                        },
                        {
                            name: "Passionfruit Hibiscus Fizz",
                            description: "Shaken organic hibiscus tea, passionfruit syrup, and sparkling water",
                            variants: [
                                { variantId: "passion-fizz-reg", name: "Regular", sku: "PASSION-FIZZ-REG", price: 4.50, availableQuantity: 35 }
                            ]
                        }
                    ]
                },
                {
                    name: "Bakery",
                    slug: "bakery",
                    products: [
                        {
                            name: "Artisanal Croissant",
                            description: "Fresh buttery flakey pastry baked daily in house",
                            variants: [
                                { variantId: "croissant-reg", name: "Regular", sku: "CROISSANT-REG", price: 3.00, availableQuantity: 10 }
                            ]
                        }
                    ]
                }
            ];
        }
        this.renderCategoryTabs();
        this.filterMenu('all');
    }

    // CART OPERATIONS
    async addToCart(variantId) {
        try {
            const resp = await fetch(`${this.apiBaseUrl}/cart/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    variantId: variantId,
                    quantity: 1
                })
            });
            if (!resp.ok) throw new Error('Out of stock or invalid item');
            this.updateCartDrawer();
            this.loadMenu(); // Refresh quantities
        } catch (err) {
            alert(err.message);
        }
    }

    async updateCartDrawer() {
        let cart = null;
        const container = document.getElementById('cartItemsContainer');
        const totalSpan = document.getElementById('cartTotalVal');
        const cartBadge = document.getElementById('cartBadge');
        
        if (this.isOfflineMode) {
            cart = JSON.parse(localStorage.getItem('caffeine_offline_cart') || '{"items":[]}');
        } else {
            try {
                const resp = await fetch(`${this.apiBaseUrl}/cart/${this.sessionId}`);
                if (resp.ok && resp.status !== 204) {
                    cart = await resp.json();
                } else {
                    cart = { items: [], totalAmount: 0 };
                }
            } catch (err) {
                console.warn("Server offline, switching to offline mode.", err);
                this.isOfflineMode = true;
                const banner = document.getElementById('offlineDemoBanner');
                if (banner) banner.classList.remove('hidden');
                cart = JSON.parse(localStorage.getItem('caffeine_offline_cart') || '{"items":[]}');
            }
        }
        
        if (!cart || !cart.items || cart.items.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 20px 0;">Cart is empty. Add a drink to start!</div>';
            totalSpan.textContent = '$0.00';
            if (cartBadge) cartBadge.classList.add('hidden');
            return;
        }
        
        // Calculate and display badge quantity
        let totalQty = 0;
        cart.items.forEach(it => totalQty += it.quantity);
        if (cartBadge) {
            if (totalQty > 0) {
                cartBadge.textContent = totalQty;
                cartBadge.classList.remove('hidden');
            } else {
                cartBadge.classList.add('hidden');
            }
        }
        
        container.innerHTML = '';
        let total = 0;
        const savedCustoms = JSON.parse(localStorage.getItem('caffeine_customizations') || '{}');
        
        cart.items.forEach(item => {
            const lineTotal = item.unitPrice * item.quantity;
            total += lineTotal;
            
            const customText = savedCustoms[item.variantId] || '';
            
            const div = document.createElement('div');
            div.className = 'cart-item';
            div.innerHTML = `
                <div style="flex: 1; padding-right: 8px;">
                    <div style="font-weight:600; font-size:13px;">${item.productName}</div>
                    <div style="font-size:11px; color:var(--accent-coffee); font-weight:500;">${item.variantName} ${customText}</div>
                    <div style="font-size:11px; color:var(--text-secondary);">$${item.unitPrice.toFixed(2)} x ${item.quantity}</div>
                </div>
                <div class="item-qty-controls">
                    <button class="btn-clay" style="padding:4px 8px; font-size:11px" onclick="app.updateCartQty('${item.cartItemId}', ${item.quantity - 1})">-</button>
                    <span style="font-size:13px; font-weight:600">${item.quantity}</span>
                    <button class="btn-clay" style="padding:4px 8px; font-size:11px" onclick="app.updateCartQty('${item.cartItemId}', ${item.quantity + 1})">+</button>
                </div>
            `;
            container.appendChild(div);
        });
        
        totalSpan.textContent = `$${total.toFixed(2)}`;
    }

    async updateCartQty(itemId, newQty) {
        if (this.isOfflineMode) {
            const offlineCart = JSON.parse(localStorage.getItem('caffeine_offline_cart') || '{"items":[]}');
            if (newQty <= 0) {
                offlineCart.items = offlineCart.items.filter(it => it.cartItemId !== itemId);
            } else {
                const item = offlineCart.items.find(it => it.cartItemId === itemId);
                if (item) {
                    item.quantity = newQty;
                    item.lineTotal = item.quantity * item.unitPrice;
                }
            }
            localStorage.setItem('caffeine_offline_cart', JSON.stringify(offlineCart));
            this.updateCartDrawer();
            this.loadMenu();
            return;
        }
        
        try {
            if (newQty <= 0) {
                // Delete item
                await fetch(`${this.apiBaseUrl}/cart/items/${itemId}?sessionId=${this.sessionId}`, {
                    method: 'DELETE'
                });
            } else {
                // Update qty
                await fetch(`${this.apiBaseUrl}/cart/items/${itemId}?sessionId=${this.sessionId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ quantity: newQty })
                });
            }
            this.updateCartDrawer();
            this.loadMenu();
        } catch (err) {
            console.error(err);
        }
    }

    // PAYMENT MODAL
    openPaymentModal() {
        const totalSpan = document.getElementById('cartTotalVal');
        if (totalSpan.textContent === '$0.00') return;
        
        document.getElementById('paymentModalTotal').textContent = totalSpan.textContent;
        document.getElementById('paymentBackdrop').classList.add('open');
        document.getElementById('paymentModal').classList.add('open');
        
        // Hide cart drawer
        this.toggleRightDrawer(false);
    }
    
    closePaymentModal() {
        document.getElementById('paymentBackdrop').classList.remove('open');
        document.getElementById('paymentModal').classList.remove('open');
    }
    
    async processPayment(btnElement) {
        const originalText = btnElement.innerHTML;
        btnElement.innerHTML = '🔄 Processing...';
        btnElement.style.pointerEvents = 'none';
        
        setTimeout(() => {
            btnElement.innerHTML = '✅ Approved!';
            setTimeout(() => {
                this.closePaymentModal();
                btnElement.innerHTML = originalText;
                btnElement.style.pointerEvents = 'auto';
                this.checkoutCart();
            }, 800);
        }, 1200);
    }

    // CHECKOUT & TRACK TIMELINE
    async checkoutCart() {
        if (this.isOfflineMode) {
            // Offline simulation checkout
            const cart = JSON.parse(localStorage.getItem('caffeine_offline_cart') || '{"items":[]}');
            if (cart.items.length === 0) return;
            
            const orderId = 'order-' + Date.now();
            const orderNum = 'OFFLINE-' + Math.floor(Math.random() * 1000000);
            
            // Clear local cart
            localStorage.setItem('caffeine_offline_cart', '{"items":[]}');
            this.updateCartDrawer();
            
            // Start mock preparation timer
            this.startOfflineSimulationTracker(orderId, orderNum, cart.items);
            return;
        }
        
        try {
            const resp = await fetch(`${this.apiBaseUrl}/orders`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ sessionId: this.sessionId })
            });
            if (!resp.ok) throw new Error('Checkout failed');
            const order = await resp.json();
            
            // Create payment
            const payResp = await fetch(`${this.apiBaseUrl}/payments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: order.orderId,
                    idempotencyKey: 'key-' + Date.now()
                })
            });
            const payment = await payResp.json();
            
            // Execute dev bypass payment complete
            await fetch(`${this.apiBaseUrl}/payments/${payment.paymentId}/complete`, {
                method: 'POST'
            });
            
            // Launch live tracker
            this.startLiveTracker(order.orderId, order.orderNumber);
        } catch (err) {
            alert(err.message);
        }
    }

    startLiveTracker(orderId, orderNum) {
        document.getElementById('drawerCart').classList.add('hidden');
        document.getElementById('trackerReceipt').classList.add('hidden');
        const tracker = document.getElementById('drawerTracker');
        tracker.classList.remove('hidden');
        document.getElementById('trackerOrderNum').textContent = `Order Tracking #${orderNum.substring(orderNum.length - 6)}`;
        
        const checkStatus = async () => {
            try {
                const resp = await fetch(`${this.apiBaseUrl}/orders/${orderId}/status`);
                const statusData = await resp.json();
                
                document.getElementById('nodePaid').className = 'timeline-node active';
                document.getElementById('nodePreparing').className = 'timeline-node';
                document.getElementById('nodeReady').className = 'timeline-node';
                
                if (statusData.status === 'PREPARING') {
                    document.getElementById('nodePreparing').className = 'timeline-node active';
                } else if (statusData.status === 'READY' || statusData.status === 'COMPLETED') {
                    document.getElementById('nodePreparing').className = 'timeline-node active';
                    document.getElementById('nodeReady').className = 'timeline-node active';
                    
                    // Show receipt
                    const receiptPanel = document.getElementById('trackerReceipt');
                    const receiptItems = document.getElementById('receiptItems');
                    const receiptTotal = document.getElementById('receiptTotal');
                    
                    receiptItems.innerHTML = '';
                    let rTotal = 0;
                    
                    const savedCustoms = JSON.parse(localStorage.getItem('caffeine_customizations') || '{}');
                    
                    statusData.items.forEach(it => {
                        const lineTotal = it.price * it.quantity;
                        rTotal += lineTotal;
                        const customText = savedCustoms[it.variantId] || '';
                        receiptItems.innerHTML += `
                            <div style="display:flex; justify-content:space-between; font-size:11px;">
                                <span>${it.quantity}x ${it.productName} (${it.variantName}) ${customText}</span>
                                <span>$${lineTotal.toFixed(2)}</span>
                            </div>
                        `;
                    });
                    
                    receiptTotal.textContent = `$${rTotal.toFixed(2)}`;
                    receiptPanel.classList.remove('hidden');
                    
                    clearInterval(this.trackerInterval);
                    
                    // Play notification chime and alert
                    app.playChime();
                    setTimeout(() => alert("🎉 Your fresh brew is ready for pickup!"), 100);
                }
            } catch (err) {
                console.error(err);
            }
        };
        
        checkStatus();
        this.trackerInterval = setInterval(checkStatus, 3000);
    }

    resetStoreView() {
        clearInterval(this.trackerInterval);
        this.sessionId = 'session-' + Date.now();
        localStorage.setItem('brewops_sessionId', this.sessionId);
        this.switchView('store');
        this.updateCartDrawer();
    }

    // KITCHEN VIEW BOARD
    async loadKitchenQueue() {
        try {
            const resp = await fetch(`${this.apiBaseUrl}/kitchen`, {
                headers: this.getAuthHeaders()
            });
            if (!resp.ok) return;
            const orders = await resp.json();
            
            const paidCol = document.getElementById('kitchenQueuePaid');
            const prepCol = document.getElementById('kitchenQueuePrep');
            const readyCol = document.getElementById('kitchenQueueReady');
            
            paidCol.innerHTML = '';
            prepCol.innerHTML = '';
            readyCol.innerHTML = '';
            
            orders.forEach(order => {
                const card = document.createElement('div');
                card.className = 'clay-card kanban-card';
                
                const itemsStr = order.items.map(it => `${it.quantity}x ${it.productName} (${it.variantName})`).join('<br>');
                
                let actionBtn = '';
                if (order.status === 'PAID') {
                    actionBtn = `<button class="btn-clay btn-primary" style="width:100%; margin-top:8px;" onclick="app.updateKitchenStatus('${order.orderId}', 'PREPARING')">Start Brewing</button>`;
                } else if (order.status === 'PREPARING') {
                    actionBtn = `<button class="btn-clay btn-matcha" style="width:100%; margin-top:8px;" onclick="app.updateKitchenStatus('${order.orderId}', 'READY')">Mark Ready</button>`;
                } else if (order.status === 'READY') {
                    actionBtn = `<button class="btn-clay" style="width:100%; margin-top:8px;" onclick="app.updateKitchenStatus('${order.orderId}', 'COMPLETED')">Complete Pickup</button>`;
                }
                
                card.innerHTML = `
                    <div style="font-weight:700; margin-bottom:6px;">Order #${order.orderNumber.substring(order.orderNumber.length - 6)}</div>
                    <div style="font-size:12px; color:var(--text-secondary); margin-bottom:8px;">${itemsStr}</div>
                    ${actionBtn}
                `;
                
                if (order.status === 'PAID') paidCol.appendChild(card);
                else if (order.status === 'PREPARING') prepCol.appendChild(card);
                else if (order.status === 'READY') readyCol.appendChild(card);
            });
        } catch (err) {
            console.error(err);
        }
    }

    async updateKitchenStatus(orderId, newStatus) {
        try {
            const resp = await fetch(`${this.apiBaseUrl}/kitchen/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ status: newStatus })
            });
            if (!resp.ok) throw new Error('Status transition forbidden');
            this.loadKitchenQueue();
        } catch (err) {
            alert(err.message);
        }
    }

    // ADMIN: SUPPLIERS & PO LIFECYCLE
    async loadPurchaseOrders() {
        try {
            const resp = await fetch(`${this.apiBaseUrl}/purchase-orders`, {
                headers: this.getAuthHeaders()
            });
            if (!resp.ok) return;
            const pos = await resp.json();
            
            const tbody = document.getElementById('poTableBody');
            tbody.innerHTML = '';
            
            pos.forEach(po => {
                const tr = document.createElement('tr');
                
                let actions = '';
                if (po.status === 'DRAFT') {
                    actions = `<button class="btn-clay btn-primary" style="padding:4px 8px; font-size:12px;" onclick="app.orderPurchaseOrder('${po.id}')">Order</button>`;
                } else if (po.status === 'ORDERED') {
                    actions = `<button class="btn-clay btn-matcha" style="padding:4px 8px; font-size:12px;" onclick="app.receivePurchaseOrder('${po.id}')">Receive Delivery</button>`;
                } else {
                    actions = `<span style="font-size:12px; color:var(--text-secondary);">Archived</span>`;
                }
                
                tr.innerHTML = `
                    <td style="font-weight:600;">${po.poNumber}</td>
                    <td>${po.supplier.name}</td>
                    <td>$${po.totalAmount.toFixed(2)}</td>
                    <td><span class="status-pill" style="background-color:${po.status === 'RECEIVED' ? 'var(--accent-matcha)' : 'var(--text-secondary)'}">${po.status}</span></td>
                    <td>${actions}</td>
                `;
                tbody.appendChild(tr);
            });
        } catch (err) {
            console.error(err);
        }
    }

    async orderPurchaseOrder(poId) {
        try {
            const resp = await fetch(`${this.apiBaseUrl}/purchase-orders/${poId}/order`, {
                method: 'POST',
                headers: this.getAuthHeaders()
            });
            if (!resp.ok) throw new Error('Failed to transition PO');
            this.loadPurchaseOrders();
        } catch (err) {
            alert(err.message);
        }
    }

    async receivePurchaseOrder(poId) {
        try {
            const resp = await fetch(`${this.apiBaseUrl}/purchase-orders/${poId}/receive`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ receivedByUserId: null, notes: "Delivered in full" })
            });
            if (!resp.ok) throw new Error('Failed to receive PO items');
            this.loadPurchaseOrders();
            this.loadLowStockAlerts();
        } catch (err) {
            alert(err.message);
        }
    }

    // ADMIN: SUPPLIER FORMS
    async handleCreateSupplier(e) {
        e.preventDefault();
        const name = document.getElementById('supplierName').value;
        const contactName = document.getElementById('supplierContact').value;
        const email = document.getElementById('supplierEmail').value;
        const phone = document.getElementById('supplierPhone').value;
        
        try {
            const resp = await fetch(`${this.apiBaseUrl}/suppliers`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ name, contactName, email, phone })
            });
            if (!resp.ok) throw new Error('Supplier creation failed');
            
            document.getElementById('supplierForm').reset();
            alert('Supplier onboarded successfully!');
        } catch (err) {
            alert(err.message);
        }
    }

    async openNewPOModal() {
        document.getElementById('drawerAdminForms').classList.add('hidden');
        document.getElementById('drawerCreatePO').classList.remove('hidden');
        
        // Populate suppliers selection
        const supResp = await fetch(`${this.apiBaseUrl}/suppliers`, { headers: this.getAuthHeaders() });
        const suppliersList = await supResp.json();
        const supSelect = document.getElementById('poSupplierSelect');
        supSelect.innerHTML = '';
        suppliersList.forEach(s => {
            supSelect.innerHTML += `<option value="${s.id}">${s.name}</option>`;
        });
        
        // Populate products selection
        const variantSelect = document.getElementById('poItemVariant');
        variantSelect.innerHTML = '';
        this.menu.forEach(cat => {
            cat.products.forEach(p => {
                p.variants.forEach(v => {
                    variantSelect.innerHTML += `<option value="${v.variantId}">${p.name} - ${v.name} (${v.sku})</option>`;
                });
            });
        });
    }

    async handleCreatePO(e) {
        e.preventDefault();
        const supplierId = document.getElementById('poSupplierSelect').value;
        const variantId = document.getElementById('poItemVariant').value;
        const quantity = parseInt(document.getElementById('poItemQty').value);
        const unitCost = parseFloat(document.getElementById('poItemCost').value);
        
        try {
            const resp = await fetch(`${this.apiBaseUrl}/purchase-orders`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({
                    supplierId,
                    poNumber: 'PO-' + Date.now(),
                    items: [{ variantId, quantity, unitCost }]
                })
            });
            if (!resp.ok) throw new Error('PO drafting failed');
            
            document.getElementById('drawerCreatePO').classList.add('hidden');
            document.getElementById('drawerAdminForms').classList.remove('hidden');
            this.loadPurchaseOrders();
        } catch (err) {
            alert(err.message);
        }
    }

    // ADMIN: INVENTORY
    async loadInventory() {
        try {
            const resp = await fetch(`${this.apiBaseUrl}/admin/inventory/low-stock`, {
                headers: this.getAuthHeaders()
            });
            if (!resp.ok) return;
            const items = await resp.json();
            
            const tbody = document.getElementById('inventoryTableBody');
            tbody.innerHTML = '';
            
            items.forEach(item => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="font-weight:600;">${item.variantName}</td>
                    <td>${item.sku}</td>
                    <td style="color:${item.availableQuantity < item.lowStockThreshold ? 'var(--color-danger)' : 'inherit'}; font-weight:bold;">${item.availableQuantity}</td>
                    <td>${item.lowStockThreshold}</td>
                    <td>
                        <button class="btn-clay btn-primary" style="padding:4px 8px; font-size:12px;" onclick="app.adjustSafetyThreshold('${item.variantId}', ${item.lowStockThreshold + 5})">+5</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } catch (err) {
            console.error(err);
        }
    }

    async adjustSafetyThreshold(variantId, newThreshold) {
        try {
            // Put threshold logic here or trigger restock adjust for mock
            await fetch(`${this.apiBaseUrl}/admin/inventory/variants/${variantId}/adjust`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ quantityDelta: 0, reason: "Adjustment test" }) // Just refreshes config details
            });
            this.loadInventory();
        } catch (err) {
            console.error(err);
        }
    }

    // DYNAMIC STOCK LEVEL SYSTEM WARNING ALARMS
    async loadLowStockAlerts() {
        try {
            const resp = await fetch(`${this.apiBaseUrl}/admin/inventory/low-stock`, {
                headers: this.getAuthHeaders()
            });
            if (!resp.ok) return;
            const items = await resp.json();
            
            const container = document.getElementById('lowStockAlertsContainer');
            container.innerHTML = '';
            
            let alertCount = 0;
            items.forEach(item => {
                if (item.availableQuantity < item.lowStockThreshold) {
                    alertCount++;
                    const card = document.createElement('div');
                    card.className = 'clay-card alert-card';
                    card.innerHTML = `
                        <span class="alert-badge high">STOCK EXHAUSTED</span>
                        <div style="font-weight:700; font-size:13px;">${item.variantName}</div>
                        <div style="font-size:11px; color:var(--text-secondary);">Available: ${item.availableQuantity} units (Limit: ${item.lowStockThreshold})</div>
                    `;
                    container.appendChild(card);
                }
            });
            
            if (alertCount === 0) {
                container.innerHTML = '<div style="text-align:center; color:var(--text-secondary); font-size:12px; padding: 20px 0;">All stock levels stable.</div>';
            }
        } catch (err) {
            console.error(err);
        }
    }

    // DYNAMIC CATEGORY RENDERER
    renderCategoryTabs() {
        const container = document.getElementById('categoryTabs');
        if (!container) return;
        
        container.innerHTML = `<button class="btn-clay btn-primary active-tab" onclick="app.filterMenu('all', this)" id="tabAll">All Drinks</button>`;
        
        this.menu.forEach(category => {
            const button = document.createElement('button');
            button.className = 'btn-clay';
            button.textContent = category.name;
            button.onclick = (e) => this.filterMenu(category.slug, e.target);
            container.appendChild(button);
        });
    }

    // STORE HOURS DYNAMIC BADGE
    updateStoreStatus() {
        const statusBadge = document.getElementById('storeStatusBadge');
        if (!statusBadge) return;
        const now = new Date();
        const hrs = now.getHours();
        if (hrs >= 7 && hrs < 20) {
            statusBadge.textContent = '🟢 OPEN NOW';
            statusBadge.style.backgroundColor = 'var(--accent-matcha)';
        } else {
            statusBadge.textContent = '🔴 CLOSED';
            statusBadge.style.backgroundColor = 'var(--color-danger)';
        }
    }

    // MASCOT INTERACTION CONTROLLER
    setupMascotInteractions() {
        const mascotWrapper = document.getElementById('mascotWrapper');
        const mascotIcon = document.getElementById('mascotIcon');
        const mascotBubble = document.getElementById('mascotBubble');
        
        if (!mascotWrapper || !mascotIcon || !mascotBubble) return;
        
        const quotes = [
            "Life begins after coffee. ☕",
            "Be like a coffee bean—shine under pressure! 🏺",
            "Our ceremonial matcha is stone-ground and whisked with love. 🍵",
            "Have you tried the Strawberry Matcha Fusion? Perfect for today!",
            "Double shot of espresso: highly recommended. ⚡",
            "Stressed, blessed, and coffee obsessed. 🏺",
            "Keep grinding, stay smooth! ☕"
        ];
        
        mascotWrapper.addEventListener('click', () => {
            mascotIcon.classList.remove('mascot-bounce');
            void mascotIcon.offsetWidth; // Force reflow
            mascotIcon.classList.add('mascot-bounce');
            
            const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
            mascotBubble.textContent = randomQuote;
            mascotBubble.classList.remove('hidden');
            
            clearTimeout(this.mascotBubbleTimeout);
            this.mascotBubbleTimeout = setTimeout(() => {
                mascotBubble.classList.add('hidden');
            }, 3000);
        });
    }

    // CUSTOMIZATION MODAL CONTROLLERS
    openCustomizationModal(variantId, basePrice, drinkName, description) {
        document.getElementById('modalVariantId').value = variantId;
        document.getElementById('modalBasePrice').value = basePrice;
        document.getElementById('modalDrinkName').textContent = drinkName;
        document.getElementById('modalDrinkDesc').textContent = description;
        
        const form = document.getElementById('customizationForm');
        form.reset();
        
        this.updateModalPrice();
        document.getElementById('customizationModal').classList.remove('hidden');
    }

    updateModalPrice() {
        const basePrice = parseFloat(document.getElementById('modalBasePrice').value || 0);
        let extra = 0;
        
        const milkOption = document.querySelector('input[name="milkOption"]:checked');
        if (milkOption && (milkOption.value === 'Oat' || milkOption.value === 'Almond' || milkOption.value === 'Soy')) {
            extra += 0.50;
        }
        
        const total = basePrice + extra;
        document.getElementById('modalTotalPrice').textContent = `$${total.toFixed(2)}`;
    }

    closeCustomizationModal() {
        document.getElementById('customizationModal').classList.add('hidden');
    }

    async confirmCustomization(e) {
        e.preventDefault();
        const variantId = document.getElementById('modalVariantId').value;
        const milk = document.querySelector('input[name="milkOption"]:checked').value;
        const sweetness = document.querySelector('input[name="sweetnessOption"]:checked').value;
        const temp = document.querySelector('input[name="tempOption"]:checked').value;
        
        const customDetails = `(${temp}, ${milk} Milk, ${sweetness} Sweet)`;
        
        if (this.isOfflineMode) {
            let foundVariant = null;
            let foundProduct = null;
            this.menu.forEach(cat => {
                cat.products.forEach(p => {
                    p.variants.forEach(v => {
                        if (v.variantId === variantId) {
                            foundVariant = v;
                            foundProduct = p;
                        }
                    });
                });
            });
            
            if (foundVariant) {
                const offlineCart = JSON.parse(localStorage.getItem('caffeine_offline_cart') || '{"items":[]}');
                
                let itemPrice = foundVariant.price;
                if (milk === 'Oat' || milk === 'Almond' || milk === 'Soy') {
                    itemPrice += 0.50;
                }
                
                const existing = offlineCart.items.find(it => it.variantId === variantId);
                if (existing) {
                    existing.quantity += 1;
                    existing.lineTotal = existing.quantity * existing.unitPrice;
                } else {
                    offlineCart.items.push({
                        cartItemId: 'item-' + Date.now(),
                        variantId: variantId,
                        variantSku: foundVariant.sku,
                        productName: foundProduct.name,
                        variantName: foundVariant.name,
                        quantity: 1,
                        unitPrice: itemPrice,
                        lineTotal: itemPrice
                    });
                }
                
                localStorage.setItem('caffeine_offline_cart', JSON.stringify(offlineCart));
                
                this.customizations = JSON.parse(localStorage.getItem('caffeine_customizations') || '{}');
                this.customizations[variantId] = customDetails;
                localStorage.setItem('caffeine_customizations', JSON.stringify(this.customizations));
                
                this.closeCustomizationModal();
                this.updateCartDrawer();
                this.loadMenu();
                this.toggleRightDrawer(true);
            }
            return;
        }
        
        try {
            const resp = await fetch(`${this.apiBaseUrl}/cart/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    variantId: variantId,
                    quantity: 1
                })
            });
            if (!resp.ok) throw new Error('Out of stock or invalid item');
            
            // Save customizations locally mapped by variantId
            this.customizations = JSON.parse(localStorage.getItem('caffeine_customizations') || '{}');
            this.customizations[variantId] = customDetails;
            localStorage.setItem('caffeine_customizations', JSON.stringify(this.customizations));
            
            this.closeCustomizationModal();
            this.updateCartDrawer();
            this.loadMenu(); // Refresh quantities
            
            // Auto slide-out cart drawer on add!
            this.toggleRightDrawer(true);
        } catch (err) {
            alert(err.message);
        }
    }

    // SYNTHESIZED BARISTA BELL CHIME
    playChime() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            const startTime = audioCtx.currentTime;
            
            notes.forEach((freq, idx) => {
                const noteTime = startTime + idx * 0.12;
                osc.frequency.setValueAtTime(freq, noteTime);
                gainNode.gain.setValueAtTime(0.15, noteTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, noteTime + 0.3);
            });
            
            osc.start(startTime);
            osc.stop(startTime + notes.length * 0.12 + 0.4);
        } catch (e) {
            console.error("Audio error", e);
        }
    }

    // DRAWER & SIDEBAR TOGGLE HANDLERS
    toggleSidebar(forceState) {
        const sidebar = document.querySelector('.sidebar');
        const backdrop = document.getElementById('sidebarBackdrop');
        if (!sidebar || !backdrop) return;
        
        const isOpen = sidebar.classList.contains('open');
        const nextState = (forceState !== undefined) ? forceState : !isOpen;
        
        if (nextState) {
            sidebar.classList.add('open');
            backdrop.classList.remove('hidden');
        } else {
            sidebar.classList.remove('open');
            backdrop.classList.add('hidden');
        }
    }

    toggleRightDrawer(forceState) {
        const drawer = document.getElementById('rightDrawer');
        const backdrop = document.getElementById('drawerBackdrop');
        if (!drawer || !backdrop) return;
        
        const isOpen = drawer.classList.contains('open');
        const nextState = (forceState !== undefined) ? forceState : !isOpen;
        
        if (nextState) {
            drawer.classList.add('open');
            backdrop.classList.remove('hidden');
        } else {
            drawer.classList.remove('open');
            backdrop.classList.add('hidden');
        }
    }

    // OFFLINE TIMELINE SIMULATOR
    startOfflineSimulationTracker(orderId, orderNum, items) {
        document.getElementById('drawerCart').classList.add('hidden');
        document.getElementById('trackerReceipt').classList.add('hidden');
        const tracker = document.getElementById('drawerTracker');
        tracker.classList.remove('hidden');
        document.getElementById('trackerOrderNum').textContent = `Order Tracking #${orderNum.substring(orderNum.length - 6)}`;
        
        const nodePaid = document.getElementById('nodePaid');
        const nodePreparing = document.getElementById('nodePreparing');
        const nodeReady = document.getElementById('nodeReady');
        
        nodePaid.className = 'timeline-node active';
        nodePreparing.className = 'timeline-node';
        nodeReady.className = 'timeline-node';
        
        let stage = 0;
        
        const tick = () => {
            stage++;
            if (stage === 1) {
                nodePreparing.className = 'timeline-node active';
            } else if (stage === 2) {
                nodeReady.className = 'timeline-node active';
                
                // Populate receipt panel
                const receiptPanel = document.getElementById('trackerReceipt');
                const receiptItems = document.getElementById('receiptItems');
                const receiptTotal = document.getElementById('receiptTotal');
                
                receiptItems.innerHTML = '';
                let rTotal = 0;
                
                const savedCustoms = JSON.parse(localStorage.getItem('caffeine_customizations') || '{}');
                
                items.forEach(it => {
                    const lineTotal = it.unitPrice * it.quantity;
                    rTotal += lineTotal;
                    const customText = savedCustoms[it.variantId] || '';
                    receiptItems.innerHTML += `
                        <div style="display:flex; justify-content:space-between; font-size:11px;">
                            <span>${it.quantity}x ${it.productName} (${it.variantName}) ${customText}</span>
                            <span>$${lineTotal.toFixed(2)}</span>
                        </div>
                    `;
                });
                
                receiptTotal.textContent = `$${rTotal.toFixed(2)}`;
                receiptPanel.classList.remove('hidden');
                
                clearInterval(this.trackerInterval);
                
                app.playChime();
                setTimeout(() => alert("🎉 (Demo Offline) Your fresh brew is ready for pickup!"), 100);
            }
        };
        
        this.trackerInterval = setInterval(tick, 3000);
    }
}

// Global application instance
const app = new BrewOpsApp();
window.addEventListener('DOMContentLoaded', () => app.init());
