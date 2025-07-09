// Scripts/common.js

// --- Global Utility Functions ---

function updateCartCountDisplay() {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountElement.textContent = totalItems;
    }
}

function updateLikeCountDisplay() {
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const likeCountElement = document.getElementById('like-count');
    if (likeCountElement) {
        likeCountElement.textContent = favorites.length;
    }
}

function createProductCard(product) {
    const isSale = product.originalPrice && product.originalPrice > product.price;
    const priceDisplay = isSale
        ? `<del>Ksh ${product.originalPrice.toLocaleString('en-KE')}</del> <strong>Ksh ${product.price.toLocaleString('en-KE')}</strong>`
        : `Ksh ${product.price.toLocaleString('en-KE')}`;

    const productCardHTML = `
        <a href="product-detail.html?id=${product.id}" class="product-card-link"
           data-id="${product.id}" data-name="${product.name}" data-price="${product.price}" data-img="${product.img}">
            <div class="product-card">
                <img src="${product.img}" alt="${product.name}" onerror="this.onerror=null;this.src='https://placehold.co/300x300/F8F8F8/333?text=Image+Not+Found';" />
                <h3>${product.name}</h3>
                <p>${priceDisplay}</p>
                <div class="card-actions">
                    <button class="like-btn" aria-label="Add to Favorites"
                            data-id="${product.id}" data-name="${product.name}" data-price="${product.price}" data-img="${product.img}">♥</button>
                    <button class="cart-btn"
                            data-id="${product.id}" data-name="${product.name}" data-price="${product.price}" data-img="${product.img}">Add to Cart</button>
                </div>
            </div>
        </a>
    `;
    return productCardHTML;
}


// --- Event Listeners for Cart and Favorites (delegated for dynamic content) ---

function setupGlobalEventListeners() {
    document.body.addEventListener('click', function (event) {
        // Add to Cart
        if (event.target.classList.contains('cart-btn')) {
            event.preventDefault();
            event.stopPropagation(); // Stop event from bubbling up to the product-card-link

            const btn = event.target;
            const item = {
                id: btn.dataset.id,
                name: btn.dataset.name,
                price: parseFloat(btn.dataset.price),
                img: btn.dataset.img,
                quantity: 1
            };

            // If product-detail page, get selected size and quantity
            if (btn.id === 'add-to-cart-btn') {
                 const productId = getProductIdFromUrl();
                 const product = allProductsData[productId];
                 if (!product) {
                     alert("Product data not found for adding to cart.");
                     return;
                 }
                const sizeSelect = document.getElementById('product-size');
                const quantityInput = document.getElementById('product-quantity');

                const selectedSize = sizeSelect ? sizeSelect.value : "One Size"; // Default for items without size
                const quantity = quantityInput ? parseInt(quantityInput.value) : 1;

                if (sizeSelect && !selectedSize) {
                    alert("Please select a size.");
                    return;
                }
                if (quantity < 1) {
                    alert("Quantity must be at least 1.");
                    return;
                }
                if (product.quantityAvailable && quantity > product.quantityAvailable) {
                    alert(`Only ${product.quantityAvailable} available in stock.`);
                    return;
                }

                item.id = product.id + (selectedSize !== "One Size" ? '-' + selectedSize : ''); // Unique ID with size
                item.name = product.name + (selectedSize !== "One Size" ? ' (' + selectedSize + ')' : '');
                item.size = selectedSize;
                item.quantity = quantity;
            }


            try {
                let cart = JSON.parse(localStorage.getItem('cart')) || [];
                const existingItemIndex = cart.findIndex(cartItem => cartItem.id === item.id);

                if (existingItemIndex > -1) {
                    cart[existingItemIndex].quantity += item.quantity;
                    alert(`Added ${item.quantity} more "${item.name}" to your cart! Total: ${cart[existingItemIndex].quantity}`);
                } else {
                    cart.push(item);
                    alert(`"${item.name}" added to cart!`);
                }

                localStorage.setItem('cart', JSON.stringify(cart));
                updateCartCountDisplay();
            } catch (e) {
                console.error("Error managing localStorage for cart:", e);
                alert("There was an issue adding to your cart. Please try again.");
            }
        }

        // Add to Favorites
        if (event.target.classList.contains('like-btn')) {
            event.preventDefault();
            event.stopPropagation(); // Stop event from bubbling up to the product-card-link

            const btn = event.target;
            const item = {
                id: btn.dataset.id,
                name: btn.dataset.name,
                price: parseFloat(btn.dataset.price),
                img: btn.dataset.img
            };

            try {
                let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
                const existingItemIndex = favorites.findIndex(favItem => favItem.id === item.id);

                if (existingItemIndex === -1) {
                    favorites.push(item);
                    localStorage.setItem('favorites', JSON.stringify(favorites));
                    alert(`"${item.name}" added to your favorites!`);
                    btn.classList.add('favorited'); // Add the 'favorited' class to change color
                    updateLikeCountDisplay();
                } else {
                    // Option to remove from favorites if already there
                    // favorites.splice(existingItemIndex, 1);
                    // localStorage.setItem('favorites', JSON.stringify(favorites));
                    // alert(`"${item.name}" removed from favorites.`);
                    // btn.classList.remove('favorited');
                    alert(`"${item.name}" is already in your favorites!`);
                }
            } catch (e) {
                console.error("Error managing localStorage for favorites:", e);
                alert("There was an issue adding to your favorites. Please try again.");
            }
            // Update the display immediately for the clicked button
            updateProductFavoriteStatus();
        }
    });

    // Dropdown Menu Logic
    const toggleBtn = document.getElementById("shopToggle");
    const menu = document.getElementById("shopMenu");

    if (toggleBtn && menu) {
        toggleBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            menu.classList.toggle("show-menu");
        });

        document.addEventListener("click", function (e) {
            if (!menu.contains(e.target) && !toggleBtn.contains(e.target)) {
                menu.classList.remove("show-menu");
            }
        });
    }

    // Function to check and update favorite status of products on the page
    function updateProductFavoriteStatus() {
        const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        document.querySelectorAll('.like-btn').forEach(btn => {
            const productId = btn.dataset.id;
            if (favorites.some(fav => fav.id === productId)) {
                btn.classList.add('favorited');
            } else {
                btn.classList.remove('favorited');
            }
        });
    }

    // Initial call to update favorite status when common.js loads
    updateProductFavoriteStatus();

}


// Initialize counts and setup global event listeners when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    updateCartCountDisplay();
    updateLikeCountDisplay();
    setupGlobalEventListeners();
});

// Helper for product-detail.html to get product ID from URL
function getProductIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// Scripts/common.js

// Function to update cart count display
function updateCartCountDisplay() {
    // This is a placeholder. You'll likely store cart items in localStorage.
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = cartItems.length;
    }
}

// Function to update like count display (favorites)
function updateLikeCountDisplay() {
    // This is a placeholder. You'll likely store liked items in localStorage.
    const likedItems = JSON.parse(localStorage.getItem('likedItems')) || [];
    const likeCountElement = document.getElementById('like-count');
    if (likeCountElement) {
        likeCountElement.textContent = likedItems.length;
    }
}

// Function to add item to cart (placeholder)
function addToCart(product) {
    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    const existingItem = cartItems.find(item => item.id === product.id);

    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1; // Increment quantity
    } else {
        cartItems.push({ ...product, quantity: 1 }); // Add new item with quantity 1
    }

    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    updateCartCountDisplay();
    alert(`${product.name} added to cart!`); // User feedback
}

// Function to add item to favorites (placeholder)
function addToFavorites(product) {
    let likedItems = JSON.parse(localStorage.getItem('likedItems')) || [];
    const isLiked = likedItems.some(item => item.id === product.id);

    if (!isLiked) {
        likedItems.push(product);
        localStorage.setItem('likedItems', JSON.stringify(likedItems));
        updateLikeCountDisplay();
        alert(`${product.name} added to favorites!`); // User feedback
    } else {
        alert(`${product.name} is already in your favorites!`); // User feedback
    }
}


// --- Dropdown Toggle Logic ---
function initializeDropdowns() {
    const toggleBtn = document.getElementById("shopToggle");
    const menu = document.getElementById("shopMenu");

    if (toggleBtn && menu) { // Ensure elements exist before adding listeners
        toggleBtn.addEventListener("click", function(e) {
            e.stopPropagation(); // Prevent click from bubbling up
            menu.classList.toggle("show-menu");
        });

        // Close the menu when clicking outside
        document.addEventListener("click", function(e) {
            if (!menu.contains(e.target) && !toggleBtn.contains(e.target)) {
                menu.classList.remove("show-menu");
            }
        });
    }
}

// Ensure the dropdown initialization runs when the DOM is ready
document.addEventListener("DOMContentLoaded", initializeDropdowns);