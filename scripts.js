// ===== CONFIGURACIÓN GLOBAL =====
const CONFIG = {
    API_URL: 'https://api.forgeline.com',
    CURRENCY: 'L.',
    DECIMALS: 2,
    ANIMATION_DURATION: 300,
    DEBOUNCE_DELAY: 300
};

// ===== ESTADO GLOBAL =====
const STATE = {
    currentSection: 'inicio',
    cart: {
        items: [],
        total: 0
    },
    search: {
        query: '',
        results: [],
        suggestions: []
    },
    filters: {
        category: '',
        price: '',
        sort: 'popular'
    },
    products: [],
    categories: [],
    isLoading: false
};

// ===== UTILIDADES =====
const Utils = {
    // Formatear precio
    formatPrice: (price) => {
        return `${CONFIG.CURRENCY}${parseFloat(price).toFixed(CONFIG.DECIMALS)}`;
    },

    // Debounce para optimizar búsquedas
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Animación de números
    animateNumber: (element, target, duration = 1000) => {
        const start = 0;
        const increment = target / (duration / 16);
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current);
        }, 16);
    },

    // Mostrar notificación
    showNotification: (message, type = 'info') => {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, CONFIG.ANIMATION_DURATION);
        }, 3000);
    },

    // Validar formulario
    validateForm: (formData) => {
        const errors = [];
        
        if (!formData.name || formData.name.trim().length < 2) {
            errors.push('El nombre debe tener al menos 2 caracteres');
        }
        
        if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.push('Ingresa un email válido');
        }
        
        if (!formData.message || formData.message.trim().length < 10) {
            errors.push('El mensaje debe tener al menos 10 caracteres');
        }
        
        return errors;
    }
};

// ===== NAVEGACIÓN POR PÁGINAS =====
const PageNavigator = {
    init: () => {
        PageNavigator.setupEventListeners();
        // Mostrar la página inicial que ya tiene la clase .active
    },

    setupEventListeners: () => {
        document.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.dataset.target;
                if (targetId) {
                    PageNavigator.showPage(targetId);

                    // Si el link tiene info adicional (ej. para el form de contacto)
                    if (link.dataset.subject) {
                        const contactSubject = document.getElementById('contactSubject');
                        if(contactSubject) {
                            contactSubject.value = link.dataset.subject;
                        }
                    }
                }
            });
        });
        
        // Botón de garantía
        const garantiaBtn = document.getElementById('garantiaBtn');
        if (garantiaBtn) {
            garantiaBtn.addEventListener('click', () => {
                Utils.showNotification('Todos nuestros productos tienen garantía directa del fabricante.', 'info');
            });
        }
    },

    showPage: (pageId) => {
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
            window.scrollTo(0, 0); // Volver al inicio de la página
        }

        Navigation.updateActiveLink(pageId);
    }
};

// ===== NAVEGACIÓN (BARRA SUPERIOR) =====
const Navigation = {
    init: () => {
        Navigation.setupScrollEffects();
        Navigation.setupNavLinks();
    },

    setupScrollEffects: () => {
        const navbar = document.getElementById('mainNavbar');
        
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    },

    setupNavLinks: () => {
        document.querySelectorAll('.navbar-link').forEach(link => {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                // Mapear IDs de href a IDs de página
                const pageIdMap = {
                    'inicio': 'page-inicio',
                    'productos': 'page-productos',
                    'servicios': 'page-servicios',
                    'contacto': 'page-contacto'
                };
                PageNavigator.showPage(pageIdMap[targetId]);
            });
        });
    },

    updateActiveLink: (pageId) => {
        const targetHref = pageId.replace('page-', '');
        document.querySelectorAll('.navbar-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${targetHref}`) {
                link.classList.add('active');
            }
        });
    }
};

// ===== BUSCADOR =====
const Search = {
    init: () => {
        Search.setupEventListeners();
        Search.loadSuggestions();
    },

    setupEventListeners: () => {
        const searchToggle = document.getElementById('searchToggle');
        const searchClose = document.getElementById('searchClose');
        const searchInput = document.getElementById('searchInput');
        const searchOverlay = document.getElementById('searchOverlay');
        const searchForm = document.getElementById('searchForm');

        if (searchToggle) {
            searchToggle.addEventListener('click', () => {
                searchOverlay.classList.add('active');
                searchInput.focus();
            });
        }

        if (searchClose) {
            searchClose.addEventListener('click', () => {
                searchOverlay.classList.remove('active');
            });
        }

        if (searchOverlay) {
            searchOverlay.addEventListener('click', (e) => {
                if (e.target === searchOverlay) {
                    searchOverlay.classList.remove('active');
                }
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                Search.performSearch(e.target.value);
            }, CONFIG.DEBOUNCE_DELAY));
        }
        
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                Search.performSearch(searchInput.value);
            });
        }
    },

    loadSuggestions: () => {
        // Cargar sugerencias populares
        const suggestions = [
            'Martillo',
            'Taladro',
            'Destornillador',
            'Llave inglesa',
            'Cable eléctrico',
            'Tubería PVC',
            'Pintura',
            'Cemento'
        ];
        
        STATE.search.suggestions = suggestions;
    },

    performSearch: async (query) => {
        if (!query.trim()) {
            Search.clearResults();
            return;
        }

        STATE.search.query = query;
        
        try {
            // Simular búsqueda en productos
            const results = STATE.products.filter(product => 
                product.name.toLowerCase().includes(query.toLowerCase()) ||
                product.category.toLowerCase().includes(query.toLowerCase())
            );
            
            Search.displayResults(results);
        } catch (error) {
            console.error('Error en búsqueda:', error);
            Utils.showNotification('Error al realizar la búsqueda', 'error');
        }
    },

    displayResults: (results) => {
        const suggestionsContainer = document.getElementById('searchSuggestions');
        if (!suggestionsContainer) return;

        suggestionsContainer.innerHTML = '';

        if (results.length === 0) {
            suggestionsContainer.innerHTML = '<div class="search-suggestion">No se encontraron resultados</div>';
            return;
        }

        results.slice(0, 5).forEach(product => {
            const suggestion = document.createElement('div');
            suggestion.className = 'search-suggestion';
            suggestion.innerHTML = `
                <div class="suggestion-content">
                    <strong>${product.name}</strong>
                    <span>${product.category}</span>
                </div>
                <div class="suggestion-price">${Utils.formatPrice(product.price)}</div>
            `;
            
            suggestion.addEventListener('click', () => {
                Search.selectProduct(product);
            });
            
            suggestionsContainer.appendChild(suggestion);
        });
    },

    selectProduct: (product) => {
        // Cerrar búsqueda y mostrar producto
        document.getElementById('searchOverlay').classList.remove('active');
        Products.showProductModal(product);
    },

    clearResults: () => {
        const suggestionsContainer = document.getElementById('searchSuggestions');
        if (suggestionsContainer) {
            suggestionsContainer.innerHTML = '';
        }
    }
};

// ===== PRODUCTOS =====
const Products = {
    init: () => {
        Products.loadProducts();
        Products.setupFilters();
    },

    loadProducts: async () => {
        try {
            STATE.isLoading = true;
            
            // Simular carga de productos
            const mockProducts = [
                // Herramientas Manuales
                {
                    id: 1,
                    name: 'Martillo Profesional',
                    category: 'Herramientas Manuales',
                    price: 1500,
                    image: 'assets/images/martillo.jpeg',
                    description: 'Martillo de alta calidad para trabajos profesionales',
                    stock: 50
                },
                {
                    id: 3,
                    name: 'Destornillador Set',
                    category: 'Herramientas Manuales',
                    price: 800,
                    image: 'assets/images/destornillador.png',
                    description: 'Set completo de destornilladores profesionales',
                    stock: 100
                },
                {
                    id: 7,
                    name: 'Llave Ajustable Cromada',
                    category: 'Herramientas Manuales',
                    price: 950,
                    image: 'assets/images/llave.png',
                    description: 'Llave ajustable de acero cromado, alta resistencia',
                    stock: 80
                },
                // Herramientas Eléctricas
                {
                    id: 2,
                    name: 'Taladro Inalámbrico 20V',
                    category: 'Herramientas Eléctricas',
                    price: 8500,
                    image: 'assets/images/Taladro Inalambrico.jpeg',
                    description: 'Taladro inalámbrico de 20V con batería de litio incluida',
                    stock: 25
                },
                {
                    id: 8,
                    name: 'Sierra Circular 7 1/4"',
                    category: 'Herramientas Eléctricas',
                    price: 6200,
                    image: 'assets/images/Sierra Circular.jpg',
                    description: 'Sierra circular potente para cortes precisos en madera',
                    stock: 15
                },
                {
                    id: 9,
                    name: 'Lijadora Orbital',
                    category: 'Herramientas Eléctricas',
                    price: 4800,
                    image: 'assets/images/lijadora.jpeg',
                    description: 'Lijadora para acabados finos en madera y metal',
                    stock: 35
                },
                // Plomería
                {
                    id: 5,
                    name: 'Tubería PVC 2m',
                    category: 'Plomería',
                    price: 1200,
                    image: 'assets/images/Tubería PVC 2m.jpeg',
                    description: 'Tubería PVC de 2 metros para plomería',
                    stock: 75
                },
                {
                    id: 10,
                    name: 'Llave de Agua Cromada',
                    category: 'Plomería',
                    price: 250,
                    image: 'assets/images/Llave de Agua.jpeg',
                    description: 'Llave de agua para lavamanos con acabado cromado',
                    stock: 300
                },
                {
                    id: 11,
                    name: 'Set de Herramientas de Plomería',
                    category: 'Plomería',
                    price: 2450,
                    image: 'assets/images/Set de Herramientas Plomería.jpg',
                    description: 'Kit completo para reparaciones de plomería',
                    stock: 90
                },
                // Electricidad
                {
                    id: 4,
                    name: 'Cable Eléctrico #12 (Rollo 100m)',
                    category: 'Electricidad',
                    price: 2500,
                    image: 'assets/images/cable.jpg',
                    description: 'Cable eléctrico de alta conductividad para instalaciones seguras',
                    stock: 200
                },
                {
                    id: 12,
                    name: 'Multímetro Digital',
                    category: 'Electricidad',
                    price: 1180,
                    image: 'assets/images/Multimetro Digital.jpeg',
                    description: 'Multímetro para mediciones de voltaje, corriente y resistencia',
                    stock: 250
                },
                {
                    id: 13,
                    name: 'Interruptor Sencillo',
                    category: 'Electricidad',
                    price: 150,
                    image: 'assets/images/interruptor.jpg',
                    description: 'Interruptor de luz sencillo para empotrar',
                    stock: 300
                },
                // Construcción
                {
                    id: 14,
                    name: 'Casco de Seguridad',
                    category: 'Construcción',
                    price: 500,
                    image: 'assets/images/Casco de Seguridad.jpg',
                    description: 'Casco de seguridad industrial para protección',
                    stock: 20
                },
                {
                    id: 15,
                    name: 'Botas de Seguridad',
                    category: 'Construcción',
                    price: 1750,
                    image: 'assets/images/Botas de Seguridad.png',
                    description: 'Botas de seguridad con punta de acero',
                    stock: 60
                },
                {
                    id: 16,
                    name: 'Cemento (Bolsa 42.5kg)',
                    category: 'Construcción',
                    price: 250,
                    image: 'assets/images/Cemento.png',
                    description: 'Cemento de uso general para construcción',
                    stock: 120
                },
                // Pinturas
                {
                    id: 6,
                    name: 'Pintura Interior (Galón)',
                    category: 'Pinturas',
                    price: 1800,
                    image: 'assets/images/pintura.jpg',
                    description: 'Pintura interior de alta calidad, acabado mate lavable',
                    stock: 30
                },
                {
                    id: 17,
                    name: 'Set de Brochas (5 Piezas)',
                    category: 'Pinturas',
                    price: 420,
                    image: 'assets/images/Brocha Set 5pcs.jpeg',
                    description: 'Set de brochas de cerdas sintéticas para un acabado uniforme',
                    stock: 150
                },
                {
                    id: 18,
                    name: 'Rodillo Profesional 9"',
                    category: 'Pinturas',
                    price: 350,
                    image: 'assets/images/Rodillo Profesional.jpeg',
                    description: 'Rodillo de felpa para una aplicación rápida y sin goteo',
                    stock: 100
                },
                // Jardinería
                {
                    id: 19,
                    name: 'Tijeras de Podar',
                    category: 'Jardinería',
                    price: 380,
                    image: 'assets/images/Tijeras de podar.jpg',
                    description: 'Tijeras de podar de alta resistencia para jardín',
                    stock: 80
                },
                {
                    id: 20,
                    name: 'Manguera de Riego 15m',
                    category: 'Jardinería',
                    price: 650,
                    image: 'assets/images/manguera.jpg',
                    description: 'Manguera flexible y resistente con pistola de riego',
                    stock: 40
                },
                {
                    id: 21,
                    name: 'Set de Jardinería (3 piezas)',
                    category: 'Jardinería',
                    price: 450,
                    image: 'assets/images/set-jardin.jpg',
                    description: 'Kit básico de jardinería con pala, rastrillo y trasplantador',
                    stock: 110
                }
            ];
            
            STATE.products = mockProducts;
            Products.renderProducts(mockProducts);
            
        } catch (error) {
            console.error('Error cargando productos:', error);
            Utils.showNotification('Error al cargar productos', 'error');
        } finally {
            STATE.isLoading = false;
        }
    },

    renderProducts: (products) => {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) return;

        productsGrid.innerHTML = '';

        products.forEach(product => {
            const productCard = Products.createProductCard(product);
            productsGrid.appendChild(productCard);
        });
    },

    createProductCard: (product) => {
        const card = document.createElement('div');
        card.className = 'producto-card';
        card.innerHTML = `
            <div class="producto-card-image">
                <img src="${product.image}" alt="${product.name}" loading="lazy">
                ${product.stock < 10 ? '<div class="producto-card-badge">Pocas unidades</div>' : ''}
            </div>
            <div class="producto-card-content">
                <h3 class="producto-card-title">${product.name}</h3>
                <p class="producto-card-description">${product.description}</p>
                <div class="producto-card-price">${Utils.formatPrice(product.price)}</div>
                <div class="producto-card-actions">
                    <button class="btn btn-outline btn-sm" onclick="Products.showProductModal(${JSON.stringify(product).replace(/"/g, '&quot;')})">
                        <i class="fas fa-eye"></i>
                        Ver Detalles
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="Cart.addItem(${product.id})">
                        <i class="fas fa-cart-plus"></i>
                        Agregar
                    </button>
                </div>
            </div>
        `;
        
        return card;
    },

    setupFilters: () => {
        const productFilterForm = document.getElementById('productFilterForm');

        if (productFilterForm) {
            productFilterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(productFilterForm);
                STATE.filters.category = formData.get('category');
                STATE.filters.price = formData.get('price');
                STATE.filters.sort = formData.get('sort');
                Products.applyFilters();
            });
        }
    },

    applyFilters: () => {
        let filteredProducts = [...STATE.products];

        // Filtro por categoría
        if (STATE.filters.category) {
            filteredProducts = filteredProducts.filter(product => 
                product.category === STATE.filters.category
            );
        }

        // Filtro por precio
        if (STATE.filters.price) {
            const [min, max] = STATE.filters.price.split('-').map(Number);
            filteredProducts = filteredProducts.filter(product => {
                if (max) {
                    return product.price >= min && product.price <= max;
                } else {
                    return product.price >= min;
                }
            });
        }

        // Ordenamiento
        switch (STATE.filters.sort) {
            case 'price-asc':
                filteredProducts.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                filteredProducts.sort((a, b) => b.price - a.price);
                break;
            case 'name-asc':
                filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'name-desc':
                filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
                break;
            default:
                // Mantener orden original (popular)
                break;
        }

        Products.renderProducts(filteredProducts);
    },

    showProductModal: (product) => {
        const modal = document.getElementById('productModal');
        const modalTitle = document.getElementById('modalProductTitle');
        const modalImage = document.getElementById('modalProductImage');
        const modalPrice = document.getElementById('modalProductPrice');
        const modalDescription = document.getElementById('modalProductDescription');

        if (modalTitle) modalTitle.textContent = product.name;
        if (modalImage) modalImage.src = product.image;
        if (modalPrice) modalPrice.textContent = Utils.formatPrice(product.price);
        if (modalDescription) modalDescription.textContent = product.description;

        modal.classList.add('active');

        // Configurar botones del modal
        const modalClose = document.getElementById('modalClose');
        const modalAddToCart = document.getElementById('modalAddToCart');
        const quantityMinus = document.getElementById('modalQuantityMinus');
        const quantityPlus = document.getElementById('modalQuantityPlus');
        const quantityInput = document.getElementById('modalQuantity');

        if (modalClose) {
            modalClose.addEventListener('click', () => {
                modal.classList.remove('active');
            });
        }

        if (modalAddToCart) {
            modalAddToCart.addEventListener('click', () => {
                const quantity = parseInt(quantityInput.value) || 1;
                Cart.addItem(product.id, quantity);
                modal.classList.remove('active');
            });
        }

        if (quantityMinus) {
            quantityMinus.addEventListener('click', () => {
                const currentValue = parseInt(quantityInput.value) || 1;
                if (currentValue > 1) {
                    quantityInput.value = currentValue - 1;
                }
            });
        }

        if (quantityPlus) {
            quantityPlus.addEventListener('click', () => {
                const currentValue = parseInt(quantityInput.value) || 1;
                quantityInput.value = currentValue + 1;
            });
        }
    }
};

// ===== CARRITO =====
const Cart = {
    init: () => {
        Cart.setupEventListeners();
        Cart.loadFromStorage();
        Cart.updateDisplay();
    },

    setupEventListeners: () => {
        const cartToggle = document.getElementById('cartToggle');
        const cartWidget = document.getElementById('cartWidget');
        const clearCart = document.getElementById('clearCart');
        const checkoutBtn = document.getElementById('checkoutBtn');

        if (cartToggle) {
            cartToggle.addEventListener('click', () => {
                cartWidget.classList.toggle('active');
            });
        }

        if (clearCart) {
            clearCart.addEventListener('click', () => {
                Cart.clear();
            });
        }

        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                Cart.checkout();
            });
        }
    },

    addItem: (productId, quantity = 1) => {
        const product = STATE.products.find(p => p.id === productId);
        if (!product) return;

        const existingItem = STATE.cart.items.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            STATE.cart.items.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: quantity
            });
        }

        Cart.updateTotal();
        Cart.saveToStorage();
        Cart.updateDisplay();
        
        Utils.showNotification(`${product.name} agregado al carrito`, 'success');
    },

    removeItem: (productId) => {
        STATE.cart.items = STATE.cart.items.filter(item => item.id !== productId);
        Cart.updateTotal();
        Cart.saveToStorage();
        Cart.updateDisplay();
    },

    updateQuantity: (productId, quantity) => {
        const item = STATE.cart.items.find(item => item.id === productId);
        if (item) {
            if (quantity <= 0) {
                Cart.removeItem(productId);
            } else {
                item.quantity = quantity;
                Cart.updateTotal();
                Cart.saveToStorage();
                Cart.updateDisplay();
            }
        }
    },

    updateTotal: () => {
        STATE.cart.total = STATE.cart.items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    },

    updateDisplay: () => {
        // Actualizar contador en navbar
        const cartCount = document.getElementById('cartCount');
        const cartWidgetCount = document.getElementById('cartWidgetCount');
        const totalItems = STATE.cart.items.reduce((total, item) => total + item.quantity, 0);
        
        if (cartCount) cartCount.textContent = totalItems;
        if (cartWidgetCount) cartWidgetCount.textContent = totalItems;

        // Actualizar contenido del carrito
        const cartContent = document.getElementById('cartContent');
        const cartTotal = document.getElementById('cartTotal');
        
        if (cartContent) {
            cartContent.innerHTML = '';
            
            if (STATE.cart.items.length === 0) {
                cartContent.innerHTML = '<p class="text-center">Tu carrito está vacío</p>';
            } else {
                STATE.cart.items.forEach(item => {
                    const cartItem = document.createElement('div');
                    cartItem.className = 'cart-item';
                    cartItem.innerHTML = `
                        <div class="cart-item-image">
                            <img src="${item.image}" alt="${item.name}">
                        </div>
                        <div class="cart-item-details">
                            <div class="cart-item-title">${item.name}</div>
                            <div class="cart-item-price">${Utils.formatPrice(item.price)}</div>
                            <div class="cart-item-quantity">
                                <button class="quantity-btn" onclick="Cart.updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                                <input type="number" class="quantity-input" value="${item.quantity}" min="1" onchange="Cart.updateQuantity(${item.id}, parseInt(this.value))">
                                <button class="quantity-btn" onclick="Cart.updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                            </div>
                        </div>
                    `;
                    cartContent.appendChild(cartItem);
                });
            }
        }

        if (cartTotal) {
            cartTotal.textContent = Utils.formatPrice(STATE.cart.total);
        }
    },

    clear: () => {
        STATE.cart.items = [];
        STATE.cart.total = 0;
        Cart.saveToStorage();
        Cart.updateDisplay();
        Utils.showNotification('Carrito limpiado', 'info');
    },

    checkout: () => {
        if (STATE.cart.items.length === 0) {
            Utils.showNotification('Tu carrito está vacío', 'warning');
            return;
        }

        // En lugar de procesar la compra, mostramos el modal de datos del cliente
        const customerModal = document.getElementById('customerModal');
        if (customerModal) {
            customerModal.classList.add('active');
        }
    },

    saveToStorage: () => {
        localStorage.setItem('forgeline_cart', JSON.stringify(STATE.cart));
    },

    loadFromStorage: () => {
        const savedCart = localStorage.getItem('forgeline_cart');
        if (savedCart) {
            STATE.cart = JSON.parse(savedCart);
        }
    }
};

// ===== CHAT =====
const Chat = {
    init: () => {
        Chat.setupEventListeners();
        Chat.loadResponses();
    },

    setupEventListeners: () => {
        const chatToggle = document.getElementById('chatToggle');
        const contactToggle = document.getElementById('contactToggle');
        const chatWidget = document.getElementById('chatWidget');
        const chatClose = document.getElementById('chatClose');
        const chatSend = document.getElementById('chatSend');
        const chatInput = document.getElementById('chatInput');

        // Función para alternar el chat
        const toggleChat = () => {
            const isActive = chatWidget.classList.contains('active');
            
            if (isActive) {
                // Ocultar chat
                chatWidget.classList.remove('active');
                // Remover indicador visual del botón
                contactToggle.classList.remove('active');
                chatToggle.classList.remove('active');
            } else {
                // Mostrar chat
                chatWidget.classList.add('active');
                // Agregar indicador visual al botón
                contactToggle.classList.add('active');
                chatToggle.classList.add('active');
                
                // Enfocar el input del chat
                setTimeout(() => {
                    if (chatInput) {
                        chatInput.focus();
                    }
                }, 300);
                
                // Mostrar notificación de bienvenida
                Utils.showNotification('¡Asistente virtual activado! ¿En qué puedo ayudarte?', 'info');
            }
        };

        // Botón flotante del chat (botón de comentarios)
        if (chatToggle) {
            chatToggle.addEventListener('click', toggleChat);
        }

        // Botón de servicio al cliente (botón naranja con headset)
        if (contactToggle) {
            contactToggle.addEventListener('click', toggleChat);
        }

        // Botón de cerrar chat
        if (chatClose) {
            chatClose.addEventListener('click', () => {
                chatWidget.classList.remove('active');
            });
        }

        // Envío de mensajes
        if (chatSend && chatInput) {
            chatSend.addEventListener('click', () => {
                Chat.sendMessage();
            });

            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    Chat.sendMessage();
                }
            });
        }

        // Cerrar chat al hacer clic fuera de él
        document.addEventListener('click', (e) => {
            if (chatWidget && chatWidget.classList.contains('active')) {
                const isClickInsideChat = chatWidget.contains(e.target);
                const isClickOnToggle = contactToggle.contains(e.target) || chatToggle.contains(e.target);
                
                if (!isClickInsideChat && !isClickOnToggle) {
                    chatWidget.classList.remove('active');
                    contactToggle.classList.remove('active');
                    chatToggle.classList.remove('active');
                }
            }
        });
    },

    loadResponses: () => {
        Chat.responses = {
            'hola': '¡Hola! ¿En qué puedo ayudarte hoy?',
            'precio': 'Nuestros precios son muy competitivos. ¿Qué producto te interesa?',
            'entrega': 'Ofrecemos entrega en 24 horas para productos en stock.',
            'garantia': 'Todos nuestros productos tienen garantía oficial del fabricante.',
            'contacto': 'Puedes contactarnos al +504 9583-4797 o por WhatsApp.',
            'horario': 'Estamos abiertos de lunes a sábado de 8:00 AM a 6:00 PM.',
            'ubicacion': 'Estamos ubicados en Peña Blanca, barrio al centro, calle principal, Cortés, Honduras.'
        };
    },

    sendMessage: () => {
        const chatInput = document.getElementById('chatInput');
        const chatMessages = document.getElementById('chatMessages');
        
        if (!chatInput || !chatMessages) return;

        const message = chatInput.value.trim();
        if (!message) return;

        // Agregar mensaje del usuario
        Chat.addMessage(message, 'user');
        chatInput.value = '';

        // Simular respuesta del bot
        setTimeout(() => {
            const response = Chat.getResponse(message);
            Chat.addMessage(response, 'bot');
        }, 1000);
    },

    addMessage: (text, type) => {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        messageDiv.innerHTML = `
            <div class="message-content">
                <p>${text}</p>
            </div>
        `;

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    },

    getResponse: (message) => {
        const lowerMessage = message.toLowerCase();
        
        for (const [key, response] of Object.entries(Chat.responses)) {
            if (lowerMessage.includes(key)) {
                return response;
            }
        }
        
        return 'Gracias por tu mensaje. Un representante te contactará pronto.';
    }
};

// ===== FACTURACIÓN =====
const Invoice = {
    init: () => {
        Invoice.setupEventListeners();
    },

    setupEventListeners: () => {
        const customerForm = document.getElementById('customerForm');
        const customerModalClose = document.getElementById('customerModalClose');

        if (customerForm) {
            customerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(customerForm);
                const customerData = {
                    name: formData.get('name'),
                    rtn: formData.get('rtn'),
                    address: formData.get('address'),
                };

                // Validar datos de tarjeta (simulación)
                const cardData = {
                    number: document.getElementById('cardNumber').value,
                    expiry: document.getElementById('cardExpiry').value,
                    cvv: document.getElementById('cardCvv').value,
                };

                const cardErrors = Invoice.validateCard(cardData);
                if (cardErrors.length > 0) {
                    cardErrors.forEach(error => Utils.showNotification(error, 'error'));
                    return;
                }

                Invoice.generate(customerData);
            });
        }

        if (customerModalClose) {
            customerModalClose.addEventListener('click', () => {
                document.getElementById('customerModal').classList.remove('active');
                // Limpiar el scroll del modal
                const modalContent = document.querySelector('.customer-modal .modal-content');
                if (modalContent) {
                    modalContent.scrollTop = 0;
                }
            });
        }

        // Cerrar modal al hacer clic fuera de él
        const customerModal = document.getElementById('customerModal');
        if (customerModal) {
            customerModal.addEventListener('click', (e) => {
                if (e.target === customerModal) {
                    customerModal.classList.remove('active');
                    // Limpiar el scroll del modal
                    const modalContent = customerModal.querySelector('.modal-content');
                    if (modalContent) {
                        modalContent.scrollTop = 0;
                    }
                }
            });
        }
    },

    validateCard: (cardData) => {
        const errors = [];
        if (!/^\d{16}$/.test(cardData.number.replace(/\s/g, ''))) {
            errors.push('El número de tarjeta debe tener 16 dígitos.');
        }
        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardData.expiry)) {
            errors.push('La fecha de vencimiento debe estar en formato MM/AA.');
        }
        if (!/^\d{3,4}$/.test(cardData.cvv)) {
            errors.push('El CVV debe tener 3 o 4 dígitos.');
        }
        return errors;
    },

    generate: (customerData) => {
        const companyData = {
            name: 'ForgeLine S. de R.L.',
            rtn: '0801-1234-567890',
            address: 'Peña Blanca, barrio al centro, Cortés, Honduras',
            phone: '+504 9583-4797',
            email: 'info@forgeline.com'
        };

        const now = new Date();
        const invoiceId = now.getTime();
        const subtotal = STATE.cart.total;
        const isv = subtotal * 0.15;
        const total = subtotal + isv;

        let itemsHtml = '';
        STATE.cart.items.forEach(item => {
            itemsHtml += `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 8px; border: 1px solid #ddd; font-size: 12px;">${item.name}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-size: 12px;">${item.quantity}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 12px;">L.${parseFloat(item.price).toFixed(2)}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 12px;">L.${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
            `;
        });

        const invoiceHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: white; border: 1px solid #eee; box-sizing: border-box;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0056b3; padding-bottom: 10px; margin-bottom: 20px;">
                    <div style="text-align: left;">
                        <h1 style="color: #0056b3; margin: 0; font-size: 24px;">${companyData.name}</h1>
                        <p style="margin: 2px 0; font-size: 12px;">${companyData.address}</p>
                        <p style="margin: 2px 0; font-size: 12px;">RTN: ${companyData.rtn}</p>
                        <p style="margin: 2px 0; font-size: 12px;">Tel: ${companyData.phone} | Email: ${companyData.email}</p>
                    </div>
                    <div style="text-align: right;">
                        <h2 style="margin: 0; color: #0056b3; font-size: 20px;">FACTURA</h2>
                        <p style="margin: 2px 0; font-size: 12px;"># ${invoiceId}</p>
                        <p style="margin: 2px 0; font-size: 12px;">Fecha: ${now.toLocaleDateString('es-HN')}</p>
                    </div>
                </div>

                <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; background: #f9f9f9;">
                    <h3 style="margin-top: 0; color: #0056b3; font-size: 16px;">Datos del Cliente</h3>
                    <p style="margin: 5px 0; font-size: 12px;"><strong>Nombre:</strong> ${customerData.name}</p>
                    <p style="margin: 5px 0; font-size: 12px;"><strong>RTN:</strong> ${customerData.rtn}</p>
                    <p style="margin: 5px 0; font-size: 12px;"><strong>Dirección:</strong> ${customerData.address}</p>
                </div>

                <h3 style="margin-top: 30px; color: #0056b3; border-bottom: 1px solid #eee; padding-bottom: 5px; font-size: 16px;">Detalles de la Compra</h3>
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px;">
                    <thead>
                        <tr style="background-color: #f2f2f2;">
                            <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Producto</th>
                            <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Cantidad</th>
                            <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Precio Unitario</th>
                            <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Total</th>
                        </tr>
                    </thead>
                    <tbody>${itemsHtml}</tbody>
                </table>

                <div style="margin-top: 30px; text-align: right;">
                    <p style="font-size: 14px; margin: 5px 0;"><strong>Subtotal:</strong> L.${subtotal.toFixed(2)}</p>
                    <p style="font-size: 14px; margin: 5px 0;"><strong>ISV (15%):</strong> L.${isv.toFixed(2)}</p>
                    <h3 style="color: #0056b3; font-size: 18px; margin: 10px 0;"><strong>Total a Pagar:</strong> L.${total.toFixed(2)}</h3>
                </div>

                <div style="margin-top: 30px; text-align: left; font-size: 11px; color: #333; border-top: 1px solid #eee; padding-top: 10px;">
                    <p><strong>Garantía:</strong> Todos los productos cuentan con garantía de uso según las políticas de ForgeLine S. de R.L. Para más información, comuníquese con nuestro equipo de soporte.</p>
                </div>

                <div style="margin-top: 40px; text-align: center; font-size: 14px; color: #0056b3;">
                    <p>¡Gracias por su compra en ForgeLine! Su satisfacción es nuestra prioridad.</p>
                </div>
            </div>
        `;

        // Crear el contenido HTML completo de la factura
        const fullInvoiceHtml = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Factura ForgeLine - ${invoiceId}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 20px;
                        background: #f5f5f5;
                    }
                    .invoice-container {
                        max-width: 800px;
                        margin: 0 auto;
                        background: white;
                        padding: 30px;
                        border-radius: 8px;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    }
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        border-bottom: 2px solid #0056b3;
                        padding-bottom: 20px;
                        margin-bottom: 30px;
                    }
                    .company-info h1 {
                        color: #0056b3;
                        margin: 0;
                        font-size: 24px;
                    }
                    .company-info p {
                        margin: 2px 0;
                        font-size: 12px;
                        color: #666;
                    }
                    .invoice-info h2 {
                        margin: 0;
                        color: #0056b3;
                        font-size: 20px;
                    }
                    .invoice-info p {
                        margin: 2px 0;
                        font-size: 12px;
                        color: #666;
                    }
                    .customer-section {
                        margin-bottom: 30px;
                        padding: 20px;
                        border: 1px solid #ddd;
                        border-radius: 5px;
                        background: #f9f9f9;
                    }
                    .customer-section h3 {
                        margin-top: 0;
                        color: #0056b3;
                        font-size: 16px;
                    }
                    .customer-section p {
                        margin: 5px 0;
                        font-size: 12px;
                    }
                    .products-section h3 {
                        color: #0056b3;
                        border-bottom: 1px solid #eee;
                        padding-bottom: 10px;
                        font-size: 16px;
                    }
                    .products-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 15px;
                        font-size: 12px;
                    }
                    .products-table th {
                        background-color: #f2f2f2;
                        padding: 12px 8px;
                        text-align: left;
                        border: 1px solid #ddd;
                        font-weight: bold;
                    }
                    .products-table td {
                        padding: 12px 8px;
                        border: 1px solid #ddd;
                    }
                    .products-table th:nth-child(2),
                    .products-table td:nth-child(2) {
                        text-align: center;
                    }
                    .products-table th:nth-child(3),
                    .products-table td:nth-child(3),
                    .products-table th:nth-child(4),
                    .products-table td:nth-child(4) {
                        text-align: right;
                    }
                    .totals-section {
                        margin-top: 30px;
                        text-align: right;
                    }
                    .totals-section p {
                        font-size: 14px;
                        margin: 5px 0;
                    }
                    .totals-section h3 {
                        color: #0056b3;
                        font-size: 18px;
                        margin: 10px 0;
                    }
                    .footer {
                        margin-top: 40px;
                        text-align: center;
                        font-size: 14px;
                        color: #0056b3;
                        border-top: 1px solid #eee;
                        padding-top: 20px;
                    }
                    .warranty {
                        margin-top: 30px;
                        text-align: left;
                        font-size: 11px;
                        color: #333;
                        border-top: 1px solid #eee;
                        padding-top: 15px;
                    }
                    .print-button {
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        background: #0056b3;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 14px;
                    }
                    .print-button:hover {
                        background: #003d82;
                    }
                    @media print {
                        .print-button {
                            display: none;
                        }
                        body {
                            background: white;
                        }
                        .invoice-container {
                            box-shadow: none;
                        }
                    }
                </style>
            </head>
            <body>
                <button class="print-button" onclick="window.print()">🖨️ Imprimir Factura</button>
                <div class="invoice-container">
                    <div class="header">
                        <div class="company-info">
                            <h1>${companyData.name}</h1>
                            <p>${companyData.address}</p>
                            <p>RTN: ${companyData.rtn}</p>
                            <p>Tel: ${companyData.phone} | Email: ${companyData.email}</p>
                        </div>
                        <div class="invoice-info">
                            <h2>FACTURA</h2>
                            <p># ${invoiceId}</p>
                            <p>Fecha: ${now.toLocaleDateString('es-HN')}</p>
                        </div>
                    </div>

                    <div class="customer-section">
                        <h3>Datos del Cliente</h3>
                        <p><strong>Nombre:</strong> ${customerData.name}</p>
                        <p><strong>RTN:</strong> ${customerData.rtn}</p>
                        <p><strong>Dirección:</strong> ${customerData.address}</p>
                    </div>

                    <div class="products-section">
                        <h3>Detalles de la Compra</h3>
                        <table class="products-table">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Cantidad</th>
                                    <th>Precio Unitario</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHtml}
                            </tbody>
                        </table>
                    </div>

                    <div class="totals-section">
                        <p><strong>Subtotal:</strong> L.${subtotal.toFixed(2)}</p>
                        <p><strong>ISV (15%):</strong> L.${isv.toFixed(2)}</p>
                        <h3><strong>Total a Pagar:</strong> L.${total.toFixed(2)}</h3>
                    </div>

                    <div class="warranty">
                        <p><strong>Garantía:</strong> Todos los productos cuentan con garantía de uso según las políticas de ForgeLine S. de R.L. Para más información, comuníquese con nuestro equipo de soporte.</p>
                    </div>

                    <div class="footer">
                        <p>¡Gracias por su compra en ForgeLine! Su satisfacción es nuestra prioridad.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Abrir la factura en una nueva ventana
        const newWindow = window.open('', '_blank', 'width=900,height=700,scrollbars=yes,resizable=yes');
        newWindow.document.write(fullInvoiceHtml);
        newWindow.document.close();

        // Limpiar el modal y el carrito
            document.getElementById('customerModal').classList.remove('active');
            document.getElementById('customerForm').reset();
            Cart.clear();
        Utils.showNotification('¡Compra realizada con éxito! Su factura se ha abierto en una nueva ventana.', 'success');
    }
};

// ===== FORMULARIOS =====
const Forms = {
    init: () => {
        Forms.setupContactForm();
    },

    setupContactForm: () => {
        const contactForm = document.getElementById('contactForm');
        if (!contactForm) return;

        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(contactForm);
            const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                subject: formData.get('subject'),
                message: formData.get('message')
            };

            const errors = Utils.validateForm(data);
            if (errors.length > 0) {
                errors.forEach(error => {
                    Utils.showNotification(error, 'error');
                });
                return;
            }

            try {
                // Simular envío de formulario
                await Forms.submitContactForm(data);
                contactForm.reset();
                Utils.showNotification('Mensaje enviado con éxito', 'success');
            } catch (error) {
                Utils.showNotification('Error al enviar mensaje', 'error');
            }
        });
    },

    submitContactForm: async (data) => {
        // Simular envío a servidor
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('Datos del formulario:', data);
                resolve();
            }, 1000);
        });
    }
};

// ===== ESTADÍSTICAS =====
const Stats = {
    init: () => {
        Stats.animateNumbers();
    },

    animateNumbers: () => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const numberElement = entry.target;
                    const target = parseInt(numberElement.dataset.target);
                    Utils.animateNumber(numberElement, target);
                    observer.unobserve(numberElement);
                }
            });
        });

        document.querySelectorAll('.stat-number').forEach(element => {
            observer.observe(element);
        });
    }
};

// ===== CATEGORÍAS =====
const Categories = {
    init: () => {
        Categories.loadCategories();
    },

    loadCategories: () => {
        const categories = [
            { name: 'Herramientas Manuales', icon: 'fas fa-hammer', count: 150 },
            { name: 'Herramientas Eléctricas', icon: 'fas fa-bolt', count: 80 },
            { name: 'Plomería', icon: 'fas fa-faucet', count: 120 },
            { name: 'Electricidad', icon: 'fas fa-plug', count: 95 },
            { name: 'Construcción', icon: 'fas fa-hard-hat', count: 200 },
            { name: 'Pinturas', icon: 'fas fa-paint-roller', count: 60 },
            { name: 'Jardinería', icon: 'fas fa-leaf', count: 45 }
        ];

        Categories.renderCategories(categories);
    },

    renderCategories: (categories) => {
        const categoriesGrid = document.getElementById('categoriasGrid');
        if (!categoriesGrid) return;

        categoriesGrid.innerHTML = '';

        categories.forEach(category => {
            const categoryCard = document.createElement('div');
            categoryCard.className = 'categoria-card';
            categoryCard.innerHTML = `
                <div class="categoria-icon">
                    <i class="${category.icon}"></i>
                </div>
                <h3 class="categoria-title">${category.name}</h3>
                <p class="categoria-count">${category.count} productos</p>
            `;
            
            categoryCard.addEventListener('click', () => {
                Categories.selectCategory(category.name);
            });
            
            categoriesGrid.appendChild(categoryCard);
        });
    },

    selectCategory: (categoryName) => {
        // Filtrar productos por categoría
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.value = categoryName;
            STATE.filters.category = categoryName;
            Products.applyFilters();
        }
        
        // Scroll a la grilla de productos
        const productsGrid = document.getElementById('productsGrid');
        if (productsGrid) {
            productsGrid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
};

// ===== FOOTER LINKS =====
const FooterLinks = {
    init: () => {
        FooterLinks.setupEventListeners();
    },

    setupEventListeners: () => {
        // Mapeo de enlaces del footer a sus destinos
        const footerLinks = {
            // Productos
            'productos': 'page-productos',
            // Servicios
            'servicios': 'page-servicios',
            // Información
            'contacto': 'page-contacto',
            'ubicacion': 'page-contacto', // La ubicación está en la sección de contacto
            'horarios': 'page-contacto',  // Los horarios están en la sección de contacto
            'politicas': 'page-contacto', // Por ahora redirigimos a contacto
            'terminos': 'page-contacto'   // Por ahora redirigimos a contacto
        };

        // Agregar event listeners a todos los enlaces del footer
        document.querySelectorAll('.footer-section a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                const href = link.getAttribute('href');
                const linkText = link.textContent.trim();
                
                if (href && href.startsWith('#')) {
                    const targetId = href.substring(1); // Remover el #
                    
                    // Manejar enlaces de productos específicos
                    if (targetId === 'productos' && linkText !== 'Productos') {
                        // Es un enlace de categoría específica
                        FooterLinks.filterProductsByCategory(linkText);
                        PageNavigator.showPage('page-productos');
                        Utils.showNotification(`Mostrando productos de ${linkText}`, 'info');
                        return;
                    }
                    
                    if (footerLinks[targetId]) {
                        // Navegar a la página correspondiente
                        PageNavigator.showPage(footerLinks[targetId]);
                        
                        // Scroll suave a la sección específica si es necesario
                        FooterLinks.scrollToSection(targetId);
                        
                        // Mostrar notificación
                        Utils.showNotification(`Navegando a ${linkText}`, 'info');
                    }
                }
            });
        });
    },

    scrollToSection: (sectionId) => {
        // Scroll específico para ciertas secciones
        setTimeout(() => {
            switch (sectionId) {
                case 'ubicacion':
                    // Scroll al mapa en la sección de contacto
                    const mapSection = document.querySelector('.map-section');
                    if (mapSection) {
                        mapSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                    break;
                case 'horarios':
                    // Scroll a la información de horarios
                    const contactInfo = document.querySelector('.contact-info');
                    if (contactInfo) {
                        contactInfo.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                    break;
                case 'politicas':
                    // Mostrar información de políticas
                    Utils.showNotification('Políticas de la empresa: Garantía de 1 año en todos los productos, devoluciones en 30 días, envío gratuito en compras superiores a L.5,000', 'info');
                    break;
                case 'terminos':
                    // Mostrar términos y condiciones
                    Utils.showNotification('Términos y Condiciones: Todos los precios incluyen ISV, envío disponible en toda Honduras, métodos de pago: efectivo, tarjeta y transferencia', 'info');
                    break;
            }
        }, 500);
    },

    // Función para filtrar productos por categoría
    filterProductsByCategory: (categoryName) => {
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.value = categoryName;
            STATE.filters.category = categoryName;
            Products.applyFilters();
            
            // Scroll a la grilla de productos
            const productsGrid = document.getElementById('productsGrid');
            if (productsGrid) {
                productsGrid.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }
};

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando ForgeLine...');
    
    // Inicializar módulos
    PageNavigator.init();
    Navigation.init();
    Search.init();
    Products.init();
    Cart.init();
    Chat.init();
    Forms.init();
    Stats.init();
    Categories.init();
    Invoice.init();
    FooterLinks.init();
    
    console.log('✅ ForgeLine inicializado correctamente');
});

// ===== EXPORTAR FUNCIONES GLOBALES =====
window.Cart = Cart;
window.Products = Products;
window.Utils = Utils;