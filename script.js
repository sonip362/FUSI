document.addEventListener('DOMContentLoaded', function () {

    // --- App State (Global) ---
    let cart = [];
    let wishlist = [];

    // --- Prevent default on placeholder links ---
    document.querySelectorAll('a[href="#"]').forEach(link => {
        link.addEventListener('click', e => e.preventDefault());
    });


    // --- State Management ---

    // Fix #5: Validate LocalStorage on parse with try...catch
    const loadState = () => {
        try {
            cart = JSON.parse(localStorage.getItem('ris_cart') || '[]');
        } catch {
            cart = [];
            console.warn("Corrupted cart data in localStorage, resetting.");
        }
        try {
            wishlist = JSON.parse(localStorage.getItem('ris_wishlist') || '[]');
        } catch {
            wishlist = [];
            console.warn("Corrupted wishlist data in localStorage, resetting.");
        }
    };

    const saveState = () => {
        localStorage.setItem('ris_cart', JSON.stringify(cart));
        localStorage.setItem('ris_wishlist', JSON.stringify(wishlist));
    };

    // Initialize state on load
    loadState();

    // --- Helper Functions ---

    const parsePrice = (priceString) => {
        return Number(String(priceString).replace(/[^0-9.-]+/g, ""));
    };

    const formatPrice = (priceNumber) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(priceNumber).replace('INR', '₹');
    };

    const showToast = (message, iconType = 'success', duration = 2000) => {
        const toast = document.getElementById('toast-notification');
        if (!toast) return; // Guard

        const toastMessage = document.getElementById('toast-message');
        const toastIconSuccess = document.getElementById('toast-icon-success');
        const toastIconWishlist = document.getElementById('toast-icon-wishlist');

        if (window.toastTimeout) clearTimeout(window.toastTimeout);

        if (toastMessage) toastMessage.textContent = message;
        if (toastIconSuccess && toastIconWishlist) {
            if (iconType === 'success') {
                toastIconSuccess.classList.remove('hidden');
                toastIconWishlist.classList.add('hidden');
            } else if (iconType === 'wishlist') {
                toastIconSuccess.classList.add('hidden');
                toastIconWishlist.classList.remove('hidden');
            }
        }

        toast.classList.add('show');

        window.toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    };

    // Fix #4: Validate data from DOM
    const getProductData = (cardElement) => {
        if (!cardElement || !cardElement.dataset) {
            console.warn("Could not find product card element.");
            return null;
        }

        const product = {
            id: cardElement.dataset.id,
            name: cardElement.dataset.name,
            price: cardElement.dataset.price,
            imageUrl: cardElement.dataset.imageUrl,
            category: cardElement.dataset.category,
            description: cardElement.dataset.description,
        };

        // Validation
        if (!product.id || !product.name || !product.price || !product.imageUrl) {
            console.warn("Product card is missing required data-attributes.", cardElement);
            return null;
        }

        return product;
    };

    // --- Cart & Wishlist Logic ---

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

    const addItemToWishlist = (product) => {
        if (!product) return; // Guard
        const existingItem = wishlist.find(item => item.id === product.id);
        if (!existingItem) {
            wishlist.push(product);
            saveState();
            renderWishlist();
            showToast(`${product.name} added to wishlist`, 'wishlist');
        } else {
            showToast(`${product.name} is already in your wishlist`, 'wishlist');
        }
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

    const removeFromWishlist = (productId) => {
        wishlist = wishlist.filter(item => item.id !== productId);
        saveState();
        renderWishlist();
    };

    const clearCart = () => {
        if (cart.length === 0) return;
        const overlay = document.getElementById('cart-confirm-overlay');
        if (!overlay) return;
        overlay.classList.remove('hidden');
        setTimeout(() => overlay.classList.remove('opacity-0', 'scale-95'), 20);
    };

    const clearWishlist = () => {
        if (wishlist.length === 0) return;
        const overlay = document.getElementById('wishlist-confirm-overlay');
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

    const closeWishlistConfirm = () => {
        const overlay = document.getElementById('wishlist-confirm-overlay');
        if (!overlay) return;
        overlay.classList.add('opacity-0', 'scale-95');
        setTimeout(() => overlay.classList.add('hidden'), 300);
    };

    const updateBadges = () => {
        const cartBadgeDesktop = document.getElementById('cart-badge-desktop');
        const cartBadgeMobile = document.getElementById('cart-badge-mobile');
        const wishlistBadgeDesktop = document.getElementById('wishlist-badge-desktop');
        const wishlistBadgeMobile = document.getElementById('wishlist-badge-mobile');

        const cartCount = cart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
        const wishlistCount = wishlist.length;

        [[cartBadgeDesktop, cartCount], [cartBadgeMobile, cartCount]].forEach(([el, count]) => {
            if (!el) return;
            if (count > 0) { el.textContent = count; el.classList.remove('hidden'); }
            else { el.classList.add('hidden'); }
        });

        [[wishlistBadgeDesktop, wishlistCount], [wishlistBadgeMobile, wishlistCount]].forEach(([el, count]) => {
            if (!el) return;
            if (count > 0) { el.textContent = count; el.classList.remove('hidden'); }
            else { el.classList.add('hidden'); }
        });
    };

    // --- Render Functions ---

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
        updateBadges();
    };

    const renderWishlist = () => {
        const wishlistEmptyState = document.getElementById('wishlist-empty-state');
        const wishlistItemsList = document.getElementById('wishlist-items-list');
        const clearWishlistBtn = document.getElementById('clear-wishlist-btn');

        if (!wishlistEmptyState || !wishlistItemsList) return;

        if (wishlist.length === 0) {
            wishlistEmptyState.classList.remove('hidden');
            wishlistItemsList.classList.add('hidden');
            wishlistItemsList.innerHTML = '';
            if (clearWishlistBtn) clearWishlistBtn.classList.add('hidden');
        } else {
            wishlistEmptyState.classList.add('hidden');
            wishlistItemsList.classList.remove('hidden');
            if (clearWishlistBtn) clearWishlistBtn.classList.remove('hidden');

            wishlistItemsList.innerHTML = wishlist.map(item => `
                    <li class="flex py-6">
                        <div class="w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                            <img src="${item.imageUrl}" alt="${item.name}" class="w-full h-auto object-cover object-center"
                                 onerror="this.onerror=null;this.src='https://placehold.co/100x125/F7F5F2/1A1A1A?text=IMG';">
                        </div>
                        <div class="ml-4 flex flex-1 flex-col">
                            <div>
                                <div class="flex justify-between text-base font-medium text-royal-black">
                                    <h3 class="font-serif"><a href="#">${item.name}</a></h3>
                                    <p class="ml-4">${item.price}</p>
                                </div>
                                <p class="mt-1 text-sm text-gray-600">${item.category}</p>
                            </div>
                            <div class="flex flex-1 items-end justify-between text-sm">
                                <button type="button" class="add-to-cart-from-wishlist-btn font-medium text-royal-black hover:text-gray-700" data-id="${item.id}">Move to Cart</button>
                                <div class="flex">
                                    <button type="button" class="remove-wishlist-item-btn font-medium text-royal-black hover:text-gray-700" data-id="${item.id}">Remove</button>
                                </div>
                            </div>
                        </div>
                    </li>
                `).join('');
        }

        // update badges after DOM changes
        updateBadges();
    };

    // --- Page Initialization ---

    // Menu
    const menuBtn = document.getElementById('mobile-menu-btn');
    const closeBtn = document.getElementById('mobile-menu-close-btn');
    const menu = document.getElementById('mobile-menu');
    const menuLinks = document.querySelectorAll('.mobile-menu-link');

    // Fix #3: Add guards
    if (menuBtn && closeBtn && menu && menuLinks.length > 0) {
        menuBtn.addEventListener('click', () => menu.classList.remove('hidden'));
        closeBtn.addEventListener('click', () => menu.classList.add('hidden'));
        menuLinks.forEach(link => {
            link.addEventListener('click', () => menu.classList.add('hidden'));
        });
    }

    // --- Scroll Logic ---
    const mainHeader = document.getElementById('main-header');
    const heroTitle = document.getElementById('hero-title-text');
    const backTopBtn = document.getElementById('backTop');
    const heroImage = document.querySelector('#home picture img');

    const handleScroll = () => {
        const scrollY = window.scrollY;

        // Header visibility (Fix #3: Add guards)
        if (mainHeader) {
            if (scrollY > 50) {
                mainHeader.classList.remove('-translate-y-full', 'opacity-0');
                if (heroTitle) heroTitle.classList.add('opacity-0');
            } else {
                mainHeader.classList.add('-translate-y-full', 'opacity-0');
                if (heroTitle) heroTitle.classList.remove('opacity-0');
            }
        }

        // Back to Top button visibility (Fix #3: Add guard)
        if (backTopBtn) {
            if (scrollY > 300) {
                backTopBtn.classList.add('show');
            } else {
                backTopBtn.classList.remove('show');
            }
        }

        // Parallax effect on hero image
        if (heroImage) {
            const parallaxSpeed = 0.5; // Image moves at 50% of scroll speed
            heroImage.style.transform = `translateY(${scrollY * parallaxSpeed}px)`;
        }
    };

    // Throttled Scroll Listener
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                handleScroll();
                ticking = false;
            });
            ticking = true;
        }
    });

    // --- Modal Logic ---

    // Fix #10: Abstracted Modal Function
    const initializeModal = (options) => {
        const { modal, panel, openBtns, closeBtn, backdrop, onClose } = options;
        if (!modal || !panel || !closeBtn || !backdrop) return;

        const open = (e) => {
            if (e) e.preventDefault();
            // Scroll Lock
            document.body.classList.add('overflow-hidden');

            modal.classList.remove('hidden');
            setTimeout(() => {
                if (panel.classList.contains('translate-x-full')) {
                    panel.classList.remove('translate-x-full'); // Slide-in
                } else {
                    panel.classList.remove('opacity-0', 'scale-95'); // Quick-view fade-in
                }
            }, 20);
        };

        const close = () => {
            // Unlock Scroll
            document.body.classList.remove('overflow-hidden');

            if (panel.classList.contains('transition-transform')) {
                panel.classList.add('translate-x-full'); // Slide-out
                setTimeout(() => {
                    modal.classList.add('hidden');
                    if (onClose) onClose();
                }, 500);
            } else {
                panel.classList.add('opacity-0', 'scale-95'); // Quick-view fade-out
                setTimeout(() => {
                    modal.classList.add('hidden');
                    if (onClose) onClose();
                }, 300);
            }
        };

        if (openBtns && openBtns.length > 0) {
            openBtns.forEach(btn => {
                if (btn) btn.addEventListener('click', open); // Guard for each button
            });
        }

        closeBtn.addEventListener('click', close);
        backdrop.addEventListener('click', close);

        return { open, close }; // Return controls for manual use
    };

    const cartConfirmOk = document.getElementById('cart-confirm-ok');
    const cartConfirmCancel = document.getElementById('cart-confirm-cancel');
    const wishlistConfirmOk = document.getElementById('wishlist-confirm-ok');
    const wishlistConfirmCancel = document.getElementById('wishlist-confirm-cancel');

    if (cartConfirmOk) {
        cartConfirmOk.addEventListener('click', () => {
            cart = [];
            saveState();
            renderCart();
            showToast('Cart cleared', 'success');
            closeCartConfirm();
        });
    }
    if (cartConfirmCancel) cartConfirmCancel.addEventListener('click', closeCartConfirm);

    if (wishlistConfirmOk) {
        wishlistConfirmOk.addEventListener('click', () => {
            wishlist = [];
            saveState();
            renderWishlist();
            showToast('Wishlist cleared', 'success');
            closeWishlistConfirm();
        });
    }
    if (wishlistConfirmCancel) wishlistConfirmCancel.addEventListener('click', closeWishlistConfirm);


    // Wishlist Modal (Fix #10)
    const wishlistModal = initializeModal({
        modal: document.getElementById('wishlist-modal'),
        panel: document.getElementById('wishlist-panel'),
        openBtns: [
            document.getElementById('wishlist-btn-desktop'),
            document.getElementById('wishlist-btn-mobile')
        ],
        closeBtn: document.getElementById('close-wishlist-modal'),
        backdrop: document.getElementById('wishlist-backdrop'),
        onClose: closeWishlistConfirm
    });

    // Cart Modal (Fix #10)
    const cartModal = initializeModal({
        modal: document.getElementById('cart-modal'),
        panel: document.getElementById('cart-panel'),
        openBtns: [
            document.getElementById('cart-btn-desktop'),
            document.getElementById('cart-btn-mobile')
        ],
        closeBtn: document.getElementById('close-cart-modal'),
        backdrop: document.getElementById('cart-backdrop'),
        onClose: closeCartConfirm
    });

    // Quick View Modal (Fix #1, #10)
    const quickViewModalCtl = initializeModal({
        modal: document.getElementById('quick-view-modal'),
        panel: document.getElementById('quick-view-panel'),
        openBtns: [], // No standard open buttons, opened manually
        closeBtn: document.getElementById('close-quick-view-modal'),
        backdrop: document.getElementById('quick-view-backdrop'),
        onClose: () => {
            currentQuickViewProduct = null; // Fix: Clear reference to prevent memory leak
        }
    });

    // --- Manual Modal Controls & Event Listeners ---

    let currentQuickViewProduct = null;

    const openQuickView = (product) => {
        if (!product || !quickViewModalCtl) return; // Guard

        currentQuickViewProduct = product;
        const quickViewImageUrl = product.imageUrl.replace('400x500', '800x1000');

        // Guarded element checks
        const imgEl = document.getElementById('quick-view-image');
        const nameEl = document.getElementById('quick-view-name');
        const priceEl = document.getElementById('quick-view-price');
        const descEl = document.getElementById('quick-view-description');

        if (imgEl) {
            imgEl.src = quickViewImageUrl;
            imgEl.alt = product.name;
            imgEl.onerror = function () {
                this.onerror = null;
                this.src = 'https://placehold.co/800x1000/F7F5F2/1A1A1A?text=Product+Not+Found';
            };
        }
        if (nameEl) nameEl.textContent = product.name;
        if (priceEl) priceEl.textContent = product.price;
        if (descEl) descEl.textContent = product.description;

        quickViewModalCtl.open(); // Manually open the modal

        // Track recently viewed
        addToRecentlyViewed(product);
    };

    // Cart "Continue Shopping" buttons (Fix #3: Guarded)
    const cartContinueShopping = document.getElementById('cart-continue-shopping');
    const cartContinueShoppingFooter = document.getElementById('cart-continue-shopping-footer');

    if (cartContinueShopping && cartModal) {
        cartContinueShopping.addEventListener('click', () => cartModal.close());
    }
    if (cartContinueShoppingFooter && cartModal) {
        cartContinueShoppingFooter.addEventListener('click', (e) => {
            e.preventDefault();
            cartModal.close();
        });
    }

    // --- Event Delegation for Product Cards ---
    const productGrid = document.getElementById('collection-product-grid');
    if (productGrid) {
        productGrid.addEventListener('click', (e) => {
            const productCard = e.target.closest('.product-card');
            if (!productCard) return;

            // Fix #4: Check if product data is valid before proceeding
            const product = getProductData(productCard);
            if (!product) return; // Stop if data is invalid

            if (e.target.closest('.quick-view-btn')) {
                e.preventDefault(); e.stopPropagation();
                openQuickView(product);
            } else if (e.target.closest('.add-to-cart-btn')) {
                e.preventDefault(); e.stopPropagation();
                addItemToCart(product);
            } else if (e.target.closest('.add-to-wishlist-btn')) {
                e.preventDefault(); e.stopPropagation();
                addItemToWishlist(product);
            }
        });
    }

    // Quick View Modal Button Listeners (Fix #1, #3)
    const quickViewAddToCartBtn = document.getElementById('quick-view-add-to-cart');
    const quickViewAddToWishlistBtn = document.getElementById('quick-view-add-to-wishlist');

    if (quickViewAddToCartBtn && quickViewModalCtl) {
        quickViewAddToCartBtn.addEventListener('click', () => {
            if (currentQuickViewProduct) {
                addItemToCart(currentQuickViewProduct);
                quickViewModalCtl.close();
            }
        });
    }

    if (quickViewAddToWishlistBtn && quickViewModalCtl) {
        quickViewAddToWishlistBtn.addEventListener('click', () => {
            if (currentQuickViewProduct) {
                addItemToWishlist(currentQuickViewProduct);
                quickViewModalCtl.close();
            }
        });
    }

    // Cart & Wishlist dynamic button Listeners (Fix #3: Guarded)
    const cartItemsList = document.getElementById('cart-items-list');
    const wishlistItemsList = document.getElementById('wishlist-items-list');

    if (cartItemsList) {
        cartItemsList.addEventListener('click', (e) => {
            const removeBtn = e.target.closest('.remove-cart-item-btn');
            const increaseBtn = e.target.closest('.increase-cart-item-qty-btn');
            const decreaseBtn = e.target.closest('.decrease-cart-item-qty-btn');

            if (removeBtn) {
                e.preventDefault();
                removeFromCart(removeBtn.dataset.id);
            }
            if (increaseBtn) {
                e.preventDefault();
                increaseCartItemQuantity(increaseBtn.dataset.id);
            }
            if (decreaseBtn) {
                e.preventDefault();
                decreaseCartItemQuantity(decreaseBtn.dataset.id);
            }
        });
    }

    if (wishlistItemsList) {
        wishlistItemsList.addEventListener('click', (e) => {
            const removeBtn = e.target.closest('.remove-wishlist-item-btn');
            const moveToCartBtn = e.target.closest('.add-to-cart-from-wishlist-btn');

            if (removeBtn) {
                e.preventDefault();
                removeFromWishlist(removeBtn.dataset.id);
            }

            if (moveToCartBtn) {
                e.preventDefault();
                const productId = moveToCartBtn.dataset.id;
                const productToMove = wishlist.find(item => item.id === productId);

                if (productToMove) {
                    addItemToCart(productToMove);
                    removeFromWishlist(productId);
                }
            }
        });
    }

    // Clear All Listeners
    const clearCartBtn = document.getElementById('clear-cart-btn');
    const clearWishlistBtn = document.getElementById('clear-wishlist-btn');

    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', clearCart);
    }

    if (clearWishlistBtn) {
        clearWishlistBtn.addEventListener('click', clearWishlist);
    }

    // --- Intersection Observer for Animations ---
    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                    observer.unobserve(entry.target); // Animate only once
                }
            });
        }, {
            threshold: 0.1 // Trigger when 10% of the element is visible
        });

        document.querySelectorAll('.fade').forEach(el => {
            observer.observe(el);
        });
    } else {
        // Fallback for older browsers
        document.querySelectorAll('.fade').forEach(el => {
            el.classList.add('fade-in');
        });
    }

    // --- Back to Top Button Logic (Fix #3: Guarded) ---
    if (backTopBtn) {
        backTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // --- Limited Edition Carousel Logic ---
    const initializeLimitedCarousel = () => {
        const carousel = document.getElementById('limited-carousel');
        if (!carousel) return;

        const slides = carousel.querySelectorAll('.carousel-slide');
        const prevBtn = document.getElementById('carousel-prev-btn');
        const nextBtn = document.getElementById('carousel-next-btn');
        const indicators = document.querySelectorAll('.carousel-indicator');
        let currentIndex = 0;
        const totalSlides = slides.length;

        if (totalSlides === 0) return;

        // Function to update slide visibility
        const showSlide = (index) => {
            // Ensure index is within bounds (circular)
            if (index < 0) index = totalSlides - 1;
            if (index >= totalSlides) index = 0;

            currentIndex = index;

            // Update slides
            slides.forEach((slide, i) => {
                if (i === currentIndex) {
                    slide.classList.add('carousel-active');
                    slide.classList.remove('opacity-0', 'pointer-events-none');
                } else {
                    slide.classList.remove('carousel-active');
                    slide.classList.add('opacity-0', 'pointer-events-none');
                }
            });

            // Update indicators
            indicators.forEach((indicator, i) => {
                if (i === currentIndex) {
                    indicator.classList.remove('bg-gray-300', 'hover:bg-gray-400');
                    indicator.classList.add('bg-royal-black');
                } else {
                    indicator.classList.add('bg-gray-300', 'hover:bg-gray-400');
                    indicator.classList.remove('bg-royal-black');
                }
            });
        };

        // Event Listeners
        if (prevBtn) prevBtn.addEventListener('click', () => showSlide(currentIndex - 1));
        if (nextBtn) nextBtn.addEventListener('click', () => showSlide(currentIndex + 1));

        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => showSlide(index));
        });

        // Initialize first slide
        showSlide(0);

        // Optional: Auto-advance every 5 seconds
        let autoPlayInterval = setInterval(() => showSlide(currentIndex + 1), 5000);

        // Pause on hover
        carousel.addEventListener('mouseenter', () => clearInterval(autoPlayInterval));
        carousel.addEventListener('mouseleave', () => {
            clearInterval(autoPlayInterval);
            autoPlayInterval = setInterval(() => showSlide(currentIndex + 1), 5000);
        });
    };

    // Initialize Carousel
    initializeLimitedCarousel();

    // --- Collection Navigation Logic (Fix #3: Guarded) ---
    const initializeCollectionNavigation = () => {
        const collectionCards = document.querySelectorAll('.collection-card');
        const productGrid = document.getElementById('collection-product-grid');
        const productCards = productGrid ? productGrid.querySelectorAll('.product-card') : [];
        const productCardsArray = Array.from(productCards); // For stable default sort
        const collectionCardGrid = document.getElementById('collection-card-grid');
        const backButton = document.getElementById('back-to-collections-btn');
        const collectionTitle = document.getElementById('collection-title');
        const productViewControls = document.getElementById('product-view-controls');
        const searchInput = document.getElementById('product-search-input');
        const sortSelect = document.getElementById('product-sort-select');
        const filterMaterial = document.getElementById('filter-material');
        const filterPriceRange = document.getElementById('filter-price-range');
        const filterFeatures = document.getElementById('filter-features');
        let currentCollectionFilter = '';

        // Guard against missing elements
        if (!productGrid || !collectionCardGrid || !backButton || !collectionTitle || collectionCards.length === 0 || !productViewControls || !searchInput || !sortSelect || !filterMaterial || !filterPriceRange || !filterFeatures) {
            console.warn("Collection navigation, search, sort or filter elements are missing.");
            return;
        }

        // Function to filter, search, and sort products
        const updateProductView = () => {
            const searchTerm = searchInput.value.toLowerCase().trim();
            const sortValue = sortSelect.value;
            const materialFilter = filterMaterial.value;
            const priceRangeFilter = filterPriceRange.value;
            const featuresFilter = filterFeatures.value;

            // Step 1: Filter products by collection, search term, and category filters
            const visibleProducts = productCardsArray.filter(card => {
                const isVisibleByCollection = card.dataset.collection === currentCollectionFilter;
                if (!isVisibleByCollection) return false;

                // Category filters
                if (materialFilter !== 'all' && card.dataset.material !== materialFilter) return false;
                if (priceRangeFilter !== 'all' && card.dataset.priceRange !== priceRangeFilter) return false;
                if (featuresFilter !== 'all' && card.dataset.features !== featuresFilter) return false;

                // Search term
                if (searchTerm === '') return true;

                const productName = (card.dataset.name || '').toLowerCase();
                const productCategory = (card.dataset.category || '').toLowerCase();
                return productName.includes(searchTerm) || productCategory.includes(searchTerm);
            });

            // Step 2: Sort the filtered products
            visibleProducts.sort((a, b) => {
                if (sortValue === 'default') {
                    return productCardsArray.indexOf(a) - productCardsArray.indexOf(b);
                }

                const nameA = (a.dataset.name || '').toLowerCase();
                const nameB = (b.dataset.name || '').toLowerCase();
                const priceA = parsePrice(a.dataset.price || '0');
                const priceB = parsePrice(b.dataset.price || '0');

                switch (sortValue) {
                    case 'name-asc':
                        return nameA.localeCompare(nameB);
                    case 'name-desc':
                        return nameB.localeCompare(nameA);
                    case 'price-asc':
                        return priceA - priceB;
                    case 'price-desc':
                        return priceB - priceA;
                    default:
                        return 0;
                }
            });

            // Step 3: Update the DOM
            productGrid.innerHTML = ''; // Clear the grid
            if (visibleProducts.length > 0) {
                visibleProducts.forEach(card => {
                    productGrid.appendChild(card);
                });
            } else {
                productGrid.innerHTML = `<p class="col-span-full text-center text-gray-600 font-sans py-12">No products found matching your criteria.</p>`;
            }
            updateActiveFiltersDisplay();
        };

        const activeFiltersContainer = document.getElementById('active-filters-container');

        const updateActiveFiltersDisplay = () => {
            if (!activeFiltersContainer) return;

            const materialVal = filterMaterial.value;
            const priceVal = filterPriceRange.value;
            const featuresVal = filterFeatures.value;

            activeFiltersContainer.innerHTML = '';

            const filters = [
                { id: 'material', label: filterMaterial.options[filterMaterial.selectedIndex].text, value: materialVal, element: filterMaterial },
                { id: 'price', label: filterPriceRange.options[filterPriceRange.selectedIndex].text, value: priceVal, element: filterPriceRange },
                { id: 'features', label: filterFeatures.options[filterFeatures.selectedIndex].text, value: featuresVal, element: filterFeatures }
            ];

            const activeFilters = filters.filter(f => f.value !== 'all');

            if (activeFilters.length > 0) {
                activeFiltersContainer.classList.remove('hidden');
                activeFilters.forEach(filter => {
                    const pill = document.createElement('div');
                    pill.className = 'inline-flex items-center bg-gray-200 text-royal-black text-sm px-3 py-1 rounded-full animate-fade-in';
                    pill.innerHTML = `
                        <span>${filter.label}</span>
                        <button type="button" class="ml-2 text-gray-500 hover:text-royal-black focus:outline-none" aria-label="Remove ${filter.label} filter">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        </button>
                    `;

                    pill.querySelector('button').addEventListener('click', () => {
                        filter.element.value = 'all';
                        updateProductView();
                    });

                    activeFiltersContainer.appendChild(pill);
                });
            } else {
                activeFiltersContainer.classList.add('hidden');
            }
        };


        // Add click listener to each collection card
        collectionCards.forEach(card => {
            card.addEventListener('click', () => {
                currentCollectionFilter = card.dataset.collectionFilter;

                // Update the view
                updateProductView();

                // Hide collection cards & title
                collectionCardGrid.classList.add('hidden');
                collectionTitle.classList.add('hidden');

                // Show product grid and controls
                productGrid.classList.remove('hidden');
                productViewControls.classList.remove('hidden');
            });
        });

        // Add click listener to the back button
        backButton.addEventListener('click', () => {
            // Hide product grid and controls
            productGrid.classList.add('hidden');
            productViewControls.classList.add('hidden');

            // Show collection cards & title
            collectionCardGrid.classList.remove('hidden');
            collectionTitle.classList.remove('hidden');

            // Reset search, sort, and filters
            searchInput.value = '';
            sortSelect.value = 'default';
            filterMaterial.value = 'all';
            filterPriceRange.value = 'all';
            filterFeatures.value = 'all';
            currentCollectionFilter = '';
        });

        // Add listeners to controls
        searchInput.addEventListener('input', updateProductView);
        sortSelect.addEventListener('change', updateProductView);
        filterMaterial.addEventListener('change', updateProductView);
        filterPriceRange.addEventListener('change', updateProductView);
        filterFeatures.addEventListener('change', updateProductView);

        // Reset Filters Button Logic
        const resetBtn = document.getElementById('reset-filters-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                searchInput.value = '';
                sortSelect.value = 'default';
                filterMaterial.value = 'all';
                filterPriceRange.value = 'all';
                filterFeatures.value = 'all';
                updateProductView();
            });
        }
    };

    // New: fetch products.json and render product cards into the grid
    const fetchAndRenderProducts = async () => {
        const productGrid = document.getElementById('collection-product-grid');
        if (!productGrid) return;

        try {
            const res = await fetch('./assets/products.json', { cache: "no-store" });
            if (!res.ok) throw new Error('Failed to load products.json');
            const products = await res.json();

            // Build HTML for each product (keep structure & data-* attributes expected by existing JS)
            productGrid.innerHTML = products.map(product => {
                const originalPriceVal = product.originalPrice ? parsePrice(product.originalPrice) : 0;
                const currentPriceVal = parsePrice(product.price);
                const hasDiscount = originalPriceVal > currentPriceVal;

                let discountBadge = '';
                let priceDisplay = `<p class="text-lg font-medium text-royal-black product-price">${product.price}</p>`;

                if (hasDiscount) {
                    const discountPercent = Math.round(((originalPriceVal - currentPriceVal) / originalPriceVal) * 100);
                    // Badge: Visible on mobile (default), Hidden on Desktop unless hovered (using tailwind md: modifiers)
                    discountBadge = `
                        <div class="absolute top-2 left-2 bg-royal-black text-white text-xs font-bold px-2 py-1 rounded z-20 
                                    opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                            ${discountPercent}% discount
                        </div>
                    `;

                    priceDisplay = `
                        <div class="flex flex-col items-end">
                            <span class="text-xs text-gray-500 line-through">${product.originalPrice}</span>
                            <span class="text-lg font-medium text-royal-black product-price">${product.price}</span>
                        </div>
                    `;
                }

                // Low Stock: Show "Only 4 left!!" on specific products (e.g. odd IDs) for visibility
                const showLowStock = parseInt(product.id.replace(/\D/g, '')) % 2 !== 0;
                const lowStockLabel = showLowStock ? `<p class="mt-1 text-xs text-red-600 font-bold animate-pulse">Only 4 left!!</p>` : '';

                return `
				<div class="group relative text-left product-card"
				     data-collection="${product.collection}"
				     data-id="${product.id}"
				     data-name="${product.name}"
				     data-price="${product.price}"
				     data-original-price="${product.originalPrice || ''}"
				     data-image-url="${product.imageUrl}"
				     data-category="${product.category}"
				     data-description="${product.description}"
				     data-material="${product.categoryId?.material || ''}"
				     data-price-range="${product.categoryId?.priceRange || ''}"
				     data-features="${product.categoryId?.features || ''}">
					
					<div class="aspect-[4/5] w-full overflow-hidden rounded-lg bg-gray-200 relative skeleton">
                        ${discountBadge}
					<img src="${product.imageUrl}" 
						 alt="${product.name}" 
						 class="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105 product-image"
						 loading="lazy" width="auto" height="auto"
						 onload="this.classList.add('loaded'); this.parentElement.classList.remove('skeleton');"
						 onerror="this.onerror=null;this.src='https://placehold.co/400x500/F7F5F2/1A1A1A?text=IMG'; this.classList.add('loaded'); this.parentElement.classList.remove('skeleton');">
						<button type="button" class="quick-view-btn absolute inset-0 m-auto h-12 w-32 bg-ivory/90 text-royal-black font-semibold rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20" aria-label="Quick view for ${product.name}">
							Quick View
						</button>
						<button type="button" class="add-to-wishlist-btn absolute top-3 right-3 p-3 rounded-full bg-ivory/90 text-royal-black shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 hover:bg-ivory" aria-label="Add to wishlist">
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 pointer-events-none"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
						</button>
					</div>
					<div class="mt-4 flex justify-between items-start">
						<div class="min-h-[3.5rem] flex flex-col">
							<h3 class="text-lg font-serif text-royal-black"><a href="#" class="product-name hover:underline">${product.name}</a></h3>
							<p class="mt-1 text-sm text-gray-600 product-category">${product.category}</p>
                            ${lowStockLabel}
						</div>
						<div class="text-right flex-shrink-0 pl-2">
							${priceDisplay}
							<button type="button" class="add-to-cart-btn text-sm font-semibold text-gray-700 hover:text-royal-black transition-colors flex items-center justify-end mt-1" aria-label="Add ${product.name} to cart">
								Add<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 ml-1 pointer-events-none"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
							</button>
						</div>
					</div>
				</div>
			`}).join('');

            // Un-hide grid if needed (collection navigation will toggle visibility)
            // productGrid.classList.remove('hidden'); // left to collection navigation logic
        } catch (err) {
            console.error('Error loading products:', err);
            // Show fallback message
            productGrid.innerHTML = `<p class="col-span-full text-center text-gray-600 font-sans py-12">Unable to load products at the moment.</p>`;
        }
    };

    // --- Initial Renders & Inits ---
    // Replace immediate call to initializeCollectionNavigation with fetch chain
    (async () => {
        await fetchAndRenderProducts(); // load products first
        renderCart();
        renderWishlist();
        initializeCollectionNavigation(); // now product cards exist in DOM
    })();

    // --- Background Music Logic ---
    const music = document.getElementById('background-music');
    const musicToggleBtn = document.getElementById('music-toggle-btn');
    const musicOnIcon = document.getElementById('music-on-icon');
    const musicOffIcon = document.getElementById('music-off-icon');

    if (music && musicToggleBtn && musicOnIcon && musicOffIcon) {
        // Attempt to play music, browsers might block this until user interaction
        const playPromise = music.play();

        if (playPromise !== undefined) {
            playPromise.then(_ => {
                // Autoplay started!
                musicToggleBtn.classList.remove('hidden');
            }).catch(error => {
                // Autoplay was prevented.
                console.log("Music autoplay was prevented by the browser. Waiting for user interaction.");
                // We can add a one-time listener to start on first click
                const startMusicOnInteraction = () => {
                    music.play();
                    musicToggleBtn.classList.remove('hidden');
                    document.body.removeEventListener('click', startMusicOnInteraction);
                    document.body.removeEventListener('keydown', startMusicOnInteraction);
                };
                document.body.addEventListener('click', startMusicOnInteraction);
                document.body.addEventListener('keydown', startMusicOnInteraction);
            });
        }

        musicToggleBtn.addEventListener('click', () => {
            if (music.muted) {
                music.muted = false;
                musicOnIcon.classList.remove('hidden');
                musicOffIcon.classList.add('hidden');
            } else {
                music.muted = true;
                musicOnIcon.classList.add('hidden');
                musicOffIcon.classList.remove('hidden');
            }
        });
    }

    // --- Info Modal Logic (Shipping & Sizing Guide) ---
    const infoModal = document.getElementById('info-modal');
    const infoModalPanel = document.getElementById('info-modal-panel');
    const infoModalBackdrop = document.getElementById('info-modal-backdrop');
    const infoModalTitle = document.getElementById('info-modal-title');
    const infoModalContent = document.getElementById('info-modal-content');
    const closeInfoModalBtn = document.getElementById('close-info-modal');
    const openShippingBtn = document.getElementById('open-shipping-modal');
    const openSizingBtn = document.getElementById('open-sizing-modal');

    const openInfoModal = (title, htmlFile) => {
        if (!infoModal || !infoModalPanel || !infoModalContent || !infoModalTitle) return;

        infoModalTitle.textContent = title;
        infoModalContent.innerHTML = '<div class="flex items-center justify-center py-12"><p class="text-gray-500">Loading...</p></div>';

        // Show modal
        infoModal.classList.remove('hidden');
        setTimeout(() => {
            infoModalPanel.classList.remove('opacity-0', 'scale-95');
        }, 20);

        // Fetch content from the HTML file
        fetch(htmlFile)
            .then(res => {
                if (!res.ok) throw new Error('Failed to load content');
                return res.text();
            })
            .then(html => {
                // Parse the HTML and extract just the main content
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const mainContent = doc.querySelector('main') || doc.querySelector('.container') || doc.querySelector('.size-guide') || doc.body;

                if (mainContent) {
                    infoModalContent.innerHTML = mainContent.innerHTML;
                } else {
                    infoModalContent.innerHTML = '<p class="text-gray-600">Content could not be loaded.</p>';
                }
            })
            .catch(err => {
                console.error('Error loading modal content:', err);
                infoModalContent.innerHTML = '<p class="text-gray-600">Failed to load content. Please try again.</p>';
            });
    };

    const closeInfoModal = () => {
        if (!infoModal || !infoModalPanel) return;

        infoModalPanel.classList.add('opacity-0', 'scale-95');
        setTimeout(() => {
            infoModal.classList.add('hidden');
        }, 300);
    };

    // Event listeners for info modal
    if (openShippingBtn) {
        openShippingBtn.addEventListener('click', () => openInfoModal('Shipping & Returns', './assets/shipping.html'));
    }

    if (openSizingBtn) {
        openSizingBtn.addEventListener('click', () => openInfoModal('Sizing Guide', './assets/sizing.html'));
    }

    if (closeInfoModalBtn) {
        closeInfoModalBtn.addEventListener('click', closeInfoModal);
    }

    if (infoModalBackdrop) {
        infoModalBackdrop.addEventListener('click', closeInfoModal);
    }

    // --- Recently Viewed Logic ---

    // Initialize state
    let recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed')) || [];

    // Save to local storage
    const saveRecentlyViewed = () => {
        localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
    };

    // Add to recently viewed
    const addToRecentlyViewed = (product) => {
        if (!product || !product.id) return;

        // Remove if already exists (to bump to top)
        recentlyViewed = recentlyViewed.filter(id => id !== product.id);

        // Add to front
        recentlyViewed.unshift(product.id);

        // Limit to 4 items
        if (recentlyViewed.length > 4) {
            recentlyViewed = recentlyViewed.slice(0, 4);
        }

        saveRecentlyViewed();
        renderRecentlyViewed();
    };

    // Render recently viewed
    const renderRecentlyViewed = async () => {
        const section = document.getElementById('recently-viewed');
        const grid = document.getElementById('recently-viewed-grid');

        if (!section || !grid) return;

        if (recentlyViewed.length === 0) {
            section.classList.add('hidden');
            return;
        }

        // We need the full product data. 
        // Ideally we should have a cached list of all products, but for now we might need to fetch if not available.
        // Since fetchAndRenderProducts runs on load, we can try to grab products from DOM or re-fetch.
        // For reliability, let's fetch products again or assume they are available if we stored them globally. 
        // But to avoid complex state refactoring, let's just fetch them quietly.

        try {
            // Check if we have product cards rendered to scrape data, OR just fetch json again. 
            // Fetching is cleaner.
            const res = await fetch('./assets/products.json', { cache: "force-cache" }); // Use cache if possible
            if (!res.ok) return;
            const allProducts = await res.json();

            const viewedProducts = recentlyViewed.map(id => allProducts.find(p => p.id === id)).filter(p => p);

            if (viewedProducts.length === 0) {
                section.classList.add('hidden');
                return;
            }

            section.classList.remove('hidden');

            grid.innerHTML = viewedProducts.map(product => {
                const originalPriceVal = product.originalPrice ? parsePrice(product.originalPrice) : 0;
                const currentPriceVal = parsePrice(product.price);
                const hasDiscount = originalPriceVal > currentPriceVal;

                let discountBadge = '';
                let priceDisplay = `<p class="text-lg font-medium text-royal-black product-price">${product.price}</p>`;

                if (hasDiscount) {
                    const discountPercent = Math.round(((originalPriceVal - currentPriceVal) / originalPriceVal) * 100);
                    // Badge: Visible on mobile (default), Hidden on Desktop unless hovered (using tailwind md: modifiers)
                    discountBadge = `
                        <div class="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded z-20 
                                    opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                            ${discountPercent}% discount
                        </div>
                    `;

                    priceDisplay = `
                        <div class="flex flex-col items-end">
                            <span class="text-xs text-gray-500 line-through">${product.originalPrice}</span>
                            <span class="text-lg font-medium text-royal-black product-price">${product.price}</span>
                        </div>
                    `;
                }

                // Low Stock: Show "Only 4 left!!" on specific products for recently viewed
                const showLowStock = parseInt(product.id.replace(/\D/g, '')) % 2 !== 0;
                const lowStockLabel = showLowStock ? `<p class="mt-1 text-xs text-red-600 font-bold animate-pulse">Only 4 left!!</p>` : '';

                return `
				<div class="group relative text-left product-card"
				     data-collection="${product.collection}"
				     data-id="${product.id}"
				     data-name="${product.name}"
				     data-price="${product.price}"
				     data-original-price="${product.originalPrice || ''}"
				     data-image-url="${product.imageUrl}"
				     data-category="${product.category}"
				     data-description="${product.description}"
                     data-material="${product.categoryId?.material || ''}"
				     data-price-range="${product.categoryId?.priceRange || ''}"
				     data-features="${product.categoryId?.features || ''}">
					
					<div class="aspect-[4/5] w-full overflow-hidden rounded-lg bg-gray-200 relative skeleton">
                        ${discountBadge}
					<img src="${product.imageUrl}" 
						 alt="${product.name}" 
						 class="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105 product-image"
						 loading="lazy" width="auto" height="auto"
						 onload="this.classList.add('loaded'); this.parentElement.classList.remove('skeleton');"
						 onerror="this.onerror=null;this.src='https://placehold.co/400x500/F7F5F2/1A1A1A?text=IMG'; this.classList.add('loaded'); this.parentElement.classList.remove('skeleton');">
						<button type="button" class="quick-view-btn absolute inset-0 m-auto h-12 w-32 bg-ivory/90 text-royal-black font-semibold rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20" aria-label="Quick view for ${product.name}">
							Quick View
						</button>
						<button type="button" class="add-to-wishlist-btn absolute top-3 right-3 p-3 rounded-full bg-ivory/90 text-royal-black shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 hover:bg-ivory" aria-label="Add to wishlist">
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 pointer-events-none"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
						</button>
					</div>
					<div class="mt-4 flex justify-between items-start">
						<div class="min-h-[3.5rem] flex flex-col">
							<h3 class="text-lg font-serif text-royal-black"><a href="#" class="product-name hover:underline">${product.name}</a></h3>
							<p class="mt-1 text-sm text-gray-600 product-category">${product.category}</p>
                            ${lowStockLabel}
						</div>
						<div class="text-right flex-shrink-0 pl-2">
							${priceDisplay}
							<button type="button" class="add-to-cart-btn text-sm font-semibold text-gray-700 hover:text-royal-black transition-colors flex items-center justify-end mt-1" aria-label="Add ${product.name} to cart">
								Add<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 ml-1 pointer-events-none"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
							</button>
						</div>
					</div>
				</div>
			`
            }).join('');

        } catch (err) {
            console.error('Error rendering recently viewed:', err);
        }
    };

    // Event Delegation for Recently Viewed Grid (Reuse logic via class selectors or new listener)
    const recentlyViewedGrid = document.getElementById('recently-viewed-grid');
    if (recentlyViewedGrid) {
        recentlyViewedGrid.addEventListener('click', (e) => {
            const productCard = e.target.closest('.product-card');
            if (!productCard) return;

            const product = getProductData(productCard);
            if (!product) return;

            if (e.target.closest('.quick-view-btn')) {
                e.preventDefault(); e.stopPropagation();
                openQuickView(product);
            } else if (e.target.closest('.add-to-cart-btn')) {
                e.preventDefault(); e.stopPropagation();
                addItemToCart(product);
            } else if (e.target.closest('.add-to-wishlist-btn')) {
                e.preventDefault(); e.stopPropagation();
                addItemToWishlist(product);
            }
        });
    }

    // --- Keyboard Shortcuts ---
    document.addEventListener('keydown', (e) => {
        // Ignore if user is typing in an input
        const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName);

        // Escape: Close all modals & Mobile Menu & Blur Inputs
        if (e.key === 'Escape') {
            if (wishlistModal) wishlistModal.close();
            if (cartModal) cartModal.close();
            if (quickViewModalCtl) quickViewModalCtl.close();
            closeInfoModal();

            const mobileMenu = document.getElementById('mobile-menu');
            if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
                mobileMenu.classList.add('hidden');
            }

            if (isInput) {
                e.target.blur();
            }
            return;
        }

        // Search: / or Ctrl+K
        if ((e.key === '/' && !isInput) || (e.ctrlKey && e.key === 'k')) {
            e.preventDefault();
            const searchInput = document.getElementById('product-search-input');
            const collectionSection = document.getElementById('shop-by-collection');

            if (collectionSection && searchInput) {
                collectionSection.scrollIntoView({ behavior: 'smooth' });
                // Focus after a short delay to allow scroll to start/complete depending on browser behavior
                setTimeout(() => searchInput.focus({ preventScroll: true }), 500);
            }
            return;
        }

        if (isInput) return; // Stop other shortcuts if typing

        // Carousel Navigation: ArrowLeft / ArrowRight
        if (e.key === 'ArrowLeft') {
            const prevBtn = document.getElementById('carousel-prev-btn');
            if (prevBtn) {
                e.preventDefault();
                prevBtn.click();
            }
        }
        if (e.key === 'ArrowRight') {
            const nextBtn = document.getElementById('carousel-next-btn');
            if (nextBtn) {
                e.preventDefault();
                nextBtn.click();
            }
        }

        // Section Navigation: Shift + ArrowUp / ArrowDown
        if (e.shiftKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
            e.preventDefault();
            const sectionIds = ['home', 'about', 'shop-by-collection', 'limited', 'testimonials', 'recently-viewed', 'faq'];
            const sections = sectionIds.map(id => document.getElementById(id)).filter(el => el);
            const currentScroll = window.scrollY;
            const buffer = 50; // Small buffer

            if (e.key === 'ArrowDown') {
                const nextSection = sections.find(sec => sec.offsetTop > currentScroll + buffer);
                if (nextSection) nextSection.scrollIntoView({ behavior: 'smooth' });
            } else {
                const prevSection = [...sections].reverse().find(sec => sec.offsetTop < currentScroll - buffer);
                if (prevSection) prevSection.scrollIntoView({ behavior: 'smooth' });
            }
        }

        // Cart: c
        if (e.key === 'c' || e.key === 'C') {
            e.preventDefault();
            if (cartModal) cartModal.open();
        }

        // Wishlist: w
        if (e.key === 'w' || e.key === 'W') {
            e.preventDefault();
            if (wishlistModal) wishlistModal.open();
        }

        // Help: ?
        if (e.key === '?') {
            e.preventDefault();
            showToast('Shortcuts: Shift+↑/↓  (Nav), ←/→ (Slide), / (Search), C (Cart), W (Wishlist), Esc (Close Modals)', 'success', 5000);
        }
    });

    // Call render on init
    renderRecentlyViewed();

});