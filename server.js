const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;
const USERS_FILE = path.join(__dirname, 'users.json');
const SECRET_KEY = 'your_secret_key'; // In a real app, use an environment variable

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); // Serve static files (HTML, etc.)

// Helper function to read users from file
const readUsers = () => {
    if (!fs.existsSync(USERS_FILE)) {
        return [];
    }
    const data = fs.readFileSync(USERS_FILE);
    return JSON.parse(data);
};

// Helper function to write users to file
const writeUsers = (users) => {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

// Signup Route
app.post('/api/signup', async (req, res) => {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const users = readUsers();
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: Date.now(), fullName, email, password: hashedPassword };
    users.push(newUser);
    writeUsers(users);

    res.status(201).json({ message: 'User registered successfully' });
});

// Login Route
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    const users = readUsers();
    const user = users.find(u => u.email === email);
    if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '1h' });

    res.status(200).json({
        message: 'Login successful',
        token,
        user: { id: user.id, fullName: user.fullName, email: user.email }
    });
});

// Root Route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'M1.HTML'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
