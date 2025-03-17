const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

const pool = new Pool({
    user: 'your_db_user',
    host: 'localhost',
    database: 'store_rating_db',
    password: 'your_db_password',
    port: 5432,
});

// User Registration
app.post('/api/register', async (req, res) => {
    const { name, email, password, address } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const role = 'Normal User'; // Default role
    try {
        const newUser  = await pool.query(
            'INSERT INTO users (name, email, password, address, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, email, hashedPassword, address, role]
        );
        res.json(newUser .rows[0]);
    } catch (err) {
        res.status(500).json(err);
    }
});

// User Login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length > 0) {
        const isMatch = await bcrypt.compare(password, user.rows[0].password);
        if (isMatch) {
            const token = jwt.sign({ id: user.rows[0].id, role: user.rows[0].role }, 'your_jwt_secret');
            res.json({ token });
        } else {
            res.status(400).json({ message: 'Invalid credentials' });
        }
    } else {
        res.status(400).json({ message: 'User  not found' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
