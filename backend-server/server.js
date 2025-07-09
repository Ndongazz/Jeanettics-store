// server.js - Backend Server for Jeanettics Authentication

const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs'); // For password hashing
const jwt = require('jsonwebtoken'); // For JSON Web Tokens
const dotenv = require('dotenv'); // For loading environment variables from .env file

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000; // Use PORT from .env or default to 3000
const JWT_SECRET = process.env.JWT_SECRET; // Get JWT secret from .env

// --- IMPORTANT: Mock Database ---
// In a real application, 'users' would be a connection to a persistent database
// like PostgreSQL, MongoDB, MySQL, etc., where data is stored securely and permanently.
// For this demonstration, 'users' is an array in memory, so data will be lost when the server restarts.
const users = []; // Stores objects like { id: 1, email: 'user@example.com', passwordHash: '...', name: 'John Doe' }

// --- Middleware ---
app.use(bodyParser.json()); // Middleware to parse JSON request bodies

// --- CORS (Cross-Origin Resource Sharing) Configuration ---
// This is crucial during development when your frontend (e.g., running via Live Server)
// is on a different origin (e.g., http://127.0.0.1:5500) than your backend (http://localhost:3000).
// For a production environment, you should configure this more strictly to allow
// requests only from your specific frontend domain(s) for security reasons.
app.use((req, res, next) => {
    // Allow requests from any origin during development (e.g., your frontend HTML files)
    res.header('Access-Control-Allow-Origin', '*');
    // Allow common headers for requests
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    // Allow common HTTP methods
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    // Handle preflight requests (OPTIONS method)
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next(); // Pass control to the next middleware or route handler
});

// --- ROUTES ---

// 1. User Registration / Sign Up Route
// Endpoint: POST /api/signup
app.post('/api/signup', async (req, res) => {
    const { email, password, name } = req.body;

    // Basic validation
    if (!email || !password || !name) {
        return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    // Check if user already exists (in our mock database)
    if (users.some(u => u.email === email)) {
        return res.status(409).json({ message: 'User with this email already exists.' });
    }

    try {
        // Generate a salt and hash the password
        // The salt adds randomness to the hash, preventing rainbow table attacks
        const salt = await bcrypt.genSalt(10); // 10 rounds is a good default for security vs. performance
        const passwordHash = await bcrypt.hash(password, salt); // Hash the provided password

        // Create a new user object
        const newUser = {
            id: users.length + 1, // Simple ID generation for mock DB
            name: name,
            email: email,
            passwordHash: passwordHash // Store the hashed password
        };

        users.push(newUser); // Add the new user to our mock database

        console.log(`User registered: ${newUser.email}`);
        res.status(201).json({ message: 'Account created successfully!' });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Server error during signup.' });
    }
});

// 2. User Login Route
// Endpoint: POST /api/login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Find the user in our mock database by email
    const user = users.find(u => u.email === email);

    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials (User not found).' });
    }

    try {
        // Compare the provided plain-text password with the stored hashed password
        const isMatch = await bcrypt.compare(password, user.passwordHash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials (Password mismatch).' });
        }

        // Credentials are valid - generate a JSON Web Token (JWT)
        // The JWT payload contains non-sensitive user information (like ID, email)
        const token = jwt.sign(
            { id: user.id, email: user.email, name: user.name }, // Payload: data stored in the token
            JWT_SECRET,                                         // Secret key to sign the token (from .env)
            { expiresIn: '1h' }                                 // Token expiration time (e.g., 1 hour)
        );

        console.log(`User logged in: ${user.email}`);
        res.status(200).json({
            message: 'Login successful!',
            token: token,
            user: { // Optionally send back some user details (without password hash!)
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// 3. Middleware to Protect Routes
// This function checks if a valid JWT is provided in the request header
const authenticateToken = (req, res, next) => {
    // Get the Authorization header (e.g., "Bearer <TOKEN>")
    const authHeader = req.headers['authorization'];
    // Extract the token part
    const token = authHeader && authHeader.split(' ')[1]; // token will be undefined if no header or no Bearer part

    if (!token) {
        // If no token is provided, deny access
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        // Verify the token using the secret key
        const decoded = jwt.verify(token, JWT_SECRET);
        // If successful, the 'decoded' object contains the payload we signed earlier ({id, email, name})
        req.user = decoded; // Attach the decoded user information to the request object
        next(); // Proceed to the next middleware or the actual route handler
    } catch (error) {
        // If token is invalid (e.g., expired, tampered with), deny access
        console.error('Token verification failed:', error.message);
        return res.status(403).json({ message: 'Invalid token.' }); // 403 Forbidden indicates token exists but is invalid
    }
};

// 4. Protected Route (Example: User Profile Data)
// Endpoint: GET /api/profile
// This route will only be accessible if a valid JWT is provided in the Authorization header.
app.get('/api/profile', authenticateToken, (req, res) => {
    // If we reach this point, 'authenticateToken' middleware has verified the JWT
    // and attached the user's decoded information to req.user.
    const currentUser = users.find(u => u.id === req.user.id);

    if (!currentUser) {
        return res.status(404).json({ message: 'User not found in our records.' });
    }

    // Send back relevant user data (NEVER send the password hash!)
    res.json({
        message: 'Welcome to your protected profile!',
        user: {
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email
        }
    });
});

// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    // You might want to remove JWT_SECRET logging in production
    console.log(`JWT Secret (for dev): ${JWT_SECRET ? 'Loaded' : 'NOT SET - Check .env!'}`);
});
