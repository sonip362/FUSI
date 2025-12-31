// --- Cart Operations ---

const addItemToCart = (product) => {
    if (!product) return; // Guard
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    saveState();
    renderCart();
    showToast(`${product.name} added to cart`, 'success');
};

const removeFromCart = (productId) => {
    cart = cart.filter(item => item.id !== productId);
    saveState();
    renderCart();
};

const increaseCartItemQuantity = (productId) => {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity++;
        saveState();
        renderCart();
    }
};

const decreaseCartItemQuantity = (productId) => {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity--;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            saveState();
            renderCart();
        }
    }
};

const clearCart = () => {
    if (cart.length === 0) return;
    const overlay = document.getElementById('cart-confirm-overlay');
    if (!overlay) return;
    overlay.classList.remove('hidden');
    setTimeout(() => overlay.classList.remove('opacity-0', 'scale-95'), 20);
};

const closeCartConfirm = () => {
    const overlay = document.getElementById('cart-confirm-overlay');
    if (!overlay) return;
    overlay.classList.add('opacity-0', 'scale-95');
    setTimeout(() => overlay.classList.add('hidden'), 300);
};

const renderCart = () => {
    const cartEmptyState = document.getElementById('cart-empty-state');
    const cartItemsList = document.getElementById('cart-items-list');
    const cartFooter = document.getElementById('cart-footer');
    const cartSubtotal = document.getElementById('cart-subtotal');
    const clearCartBtn = document.getElementById('clear-cart-btn');

    if (!cartEmptyState || !cartItemsList || !cartFooter || !cartSubtotal) return;

    if (cart.length === 0) {
        cartEmptyState.classList.remove('hidden');
        cartItemsList.classList.add('hidden');
        cartItemsList.innerHTML = '';
        cartFooter.classList.add('hidden');
        if (clearCartBtn) clearCartBtn.classList.add('hidden');
    } else {
        cartEmptyState.classList.add('hidden');
        cartItemsList.classList.remove('hidden');
        cartFooter.classList.remove('hidden');
        if (clearCartBtn) clearCartBtn.classList.remove('hidden');

        const subtotal = cart.reduce((sum, item) => {
            return sum + (parsePrice(item.price) * (Number(item.quantity) || 1));
        }, 0);

        cartItemsList.innerHTML = cart.map(item => {
            const quantity = Number(item.quantity) || 1;
            const itemPrice = parsePrice(item.price) * quantity;

            return `
                <li class="flex py-6">
                    <div class="w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                        <img src="${item.imageUrl}" alt="${item.name}" class="w-full h-auto object-cover object-center" 
                             onerror="this.onerror=null;this.src='https://placehold.co/100x125/F7F5F2/1A1A1A?text=IMG';">
                    </div>
                    <div class="ml-4 flex flex-1 flex-col">
                        <div>
                            <div class="flex justify-between text-base font-medium text-royal-black">
                                <h3 class="font-serif"><a href="#">${item.name}</a></h3>
                                <p class="ml-4">${formatPrice(itemPrice)}</p>
                            </div>
                            <p class="mt-1 text-sm text-gray-600">${item.category}</p>
                        </div>
                        <div class="flex flex-1 items-end justify-between text-sm">
                            <div class="flex items-center border border-gray-200 rounded">
                                <button type="button" class="decrease-cart-item-qty-btn w-7 h-7 flex items-center justify-center text-lg text-gray-600 hover:bg-gray-100" data-id="${item.id}" aria-label="Decrease quantity">-</button>
                                <span class="w-8 text-center text-sm font-medium text-gray-800">${item.quantity}</span>
                                <button type="button" class="increase-cart-item-qty-btn w-7 h-7 flex items-center justify-center text-lg text-gray-600 hover:bg-gray-100" data-id="${item.id}" aria-label="Increase quantity">+</button>
                            </div>
                            <div class="flex">
                                <button type="button" class="remove-cart-item-btn font-medium text-royal-black hover:text-gray-700" data-id="${item.id}">Remove</button>
                            </div>
                        </div>
                    </div>
                </li>
            `;
        }).join('');

        cartSubtotal.textContent = formatPrice(subtotal);
    }

    // update badges after DOM changes
    if (typeof updateBadges === 'function') updateBadges();
};
