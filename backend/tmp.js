const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// SQL server config
const dbConfig = {
    user: 'townhall_admin',
    password: 'SecureHasuo77@',
    server: 'townhall-server-s198229.database.windows.net',
    database: 'townhall_db',
    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};

// Test DB connection
sql.connect(dbConfig).then(pool => {
    if (pool.connected) console.log('Connected to SQL Server successfully - AZURE');
}).catch(err => console.error('Database Connection Failed:', err));

// Guests - register
app.post('/register', async (req, res) => {
    const { name, middleName, surname, pesel, phone, email, password } = req.body;

    try {
        const pool = await sql.connect(dbConfig);

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const checkUser = await pool.request()
            .input('email', sql.NVarChar, email)
            .input('pesel', sql.NVarChar, pesel)
            .query('SELECT id, password_hash FROM users WHERE email = @email OR pesel = @pesel');

        if (checkUser.recordset.length > 0) {
            const user = checkUser.recordset[0];
            if (user.password_hash === null) {
                await pool.request()
                    .input('id', sql.Int, user.id)
                    .input('first', sql.NVarChar, name)
                    .input('last', sql.NVarChar, surname)
                    .input('phone', sql.NVarChar, phone)
                    .input('pass', sql.NVarChar, passwordHash)
                    .query(`
                        UPDATE users 
                        SET first_name = @first, last_name = @last, phone_number = @phone, 
                            password_hash = @pass, is_active = 1
                        WHERE id = @id
                    `);
                return res.status(200).json({ message: 'Account registered successfully! (Guest account upgraded)' });
            }
            return res.status(409).json({ message: 'User already exists!' });
        }

        await pool.request()
            .input('first', sql.NVarChar, name)
            .input('middle', sql.NVarChar, middleName)
            .input('last', sql.NVarChar, surname)
            .input('pesel', sql.NVarChar, pesel)
            .input('phone', sql.NVarChar, phone)
            .input('email', sql.NVarChar, email)
            .input('pass', sql.NVarChar, passwordHash)
            .query(`
                INSERT INTO users (first_name, middle_name, last_name, pesel, phone_number, email, password_hash, is_active)
                VALUES (@first, @middle, @last, @pesel, @phone, @email, @pass, 1)
            `);

        res.status(201).json({ message: 'User registered successfully!' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database error' });
    }
});

// Guest requests
app.post('/submit-request', async (req, res) => {
    const { name, middleName, surname, pesel, phone, email, requestType, subcategory, description } = req.body;

    try {
        const pool = await sql.connect(dbConfig);
        let userId;

        const userCheck = await pool.request()
            .input('email', sql.NVarChar, email)
            .input('pesel', sql.NVarChar, pesel)
            .query('SELECT id FROM users WHERE email = @email OR pesel = @pesel');

        if (userCheck.recordset.length > 0) {
            userId = userCheck.recordset[0].id;
        } else {
            const newUser = await pool.request()
                .input('first', sql.NVarChar, name)
                .input('middle', sql.NVarChar, middleName)
                .input('last', sql.NVarChar, surname)
                .input('pesel', sql.NVarChar, pesel)
                .input('phone', sql.NVarChar, phone)
                .input('email', sql.NVarChar, email)
                .query(`
                    INSERT INTO users (first_name, middle_name, last_name, pesel, phone_number, email, password_hash, is_active)
                    OUTPUT INSERTED.id
                    VALUES (@first, @middle, @last, @pesel, @phone, @email, NULL, 0)
                `);
            userId = newUser.recordset[0].id;
        }

        const result = await pool.request()
            .input('uid', sql.Int, userId)
            .input('type', sql.NVarChar, requestType)
            .input('sub', sql.NVarChar, subcategory)
            .input('desc', sql.NVarChar, description)
            .query(`
                INSERT INTO requests (user_id, request_type, subcategory, description)
                OUTPUT INSERTED.request_id
                VALUES (@uid, @type, @sub, @desc)
            `);

        res.status(201).json({
            success: true,
            message: 'Request submitted successfully!',
            requestId: `REQ-${result.recordset[0].request_id}`
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

// ----------------- LOGIN SIMULATION -----------------
const loginAttempts = new Map();

app.post('/login', async (req, res) => {
    const { userId, password } = req.body;

    // 1. Check lock in-memory
    const attempts = loginAttempts.get(userId) || 0;
    if (attempts >= 5) {
        return res.status(403).json({ success: false, message: 'Account is temporarily locked.' });
    }

    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('email', sql.NVarChar, userId)
            .query('SELECT * FROM users WHERE email = @email');

        const user = result.recordset[0];

        if (!user || !user.password_hash) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const validPass = await bcrypt.compare(password, user.password_hash);

        if (!validPass) {
            loginAttempts.set(userId, attempts + 1);
            if (attempts + 1 >= 5) {
                return res.status(403).json({ success: false, message: 'Account locked.' });
            }
            return res.status(401).json({ success: false, message: 'Invalid password.' });
        }

        // success: reset attempts
        loginAttempts.delete(userId);
        res.json({ success: true, user: user });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));
