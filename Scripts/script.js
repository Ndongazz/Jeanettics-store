// Function to update the cart count display in the header
function updateCartCountDisplay() {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartCountElement = document.getElementById('cart-count'); // Make sure you have this element in your HTML header (e.g., <span id="cart-count">0</span>)

    if (cartCountElement) {
        // If you want to count total items (including duplicates):
        cartCountElement.textContent = cart.length;
        // If you want to count total unique items based on quantity:
        // cartCountElement.textContent = cart.reduce((total, item) => total + item.quantity, 0);
    }
}

// Initialize cart count on page load
document.addEventListener('DOMContentLoaded', updateCartCountDisplay);

// Add to Cart functionality
document.querySelectorAll('.cart-btn').forEach(btn => {
    btn.addEventListener('click', function (event) {
        event.preventDefault(); // Prevent default button action if it's a link or form submit

        const productElement = this.closest('.product');
        if (!productElement) {
            console.error("Product element not found for 'Add to Cart' button.");
            alert("Could not add item to cart. Please try again.");
            return;
        }

        const item = {
            id: productElement.dataset.id,
            name: productElement.dataset.name,
            price: parseFloat(productElement.dataset.price), // Ensure price is a number
            img: productElement.dataset.img,
            quantity: 1 // Initialize quantity for new items
        };

        try {
            let cart = JSON.parse(localStorage.getItem('cart')) || [];

            // Check if item already exists in cart to update quantity
            const existingItemIndex = cart.findIndex(cartItem => cartItem.id === item.id);

            if (existingItemIndex > -1) {
                // Item exists, increase quantity
                cart[existingItemIndex].quantity += 1;
                alert(`Added another ${item.name} to your cart!`);
            } else {
                // Item does not exist, add new item
                cart.push(item);
                alert(`${item.name} added to cart!`);
            }

            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCountDisplay(); // Update the cart count in the header
        } catch (e) {
            console.error("Error managing localStorage:", e);
            alert("There was an issue adding to your cart. Please try again or clear your browser's local storage.");
        }
    });
});
