const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// SQL Server Configuration
const dbConfig = {
    user: 'townhall_admin',
    password: 'SecureHasuo77@',
    server: 'townhall-server-s198229.database.windows.net',
    database: 'townhall_db',
    options: {
        encrypt: true, 
        trustServerCertificate: false // FALSE is better for Azure (more secure)
    }
};

// Test Connection on Startup
sql.connect(dbConfig).then(pool => {
    if (pool.connected) console.log('Connected to SQL Server successfully - AZURE');
}).catch(err => console.error('Database Connection Failed:', err));

// Registration Endpoint
app.post('/register', async (req, res) => {
    const { name, middleName, surname, pesel, phone, email, password } = req.body;

    try {
        // 1. Encrypt Password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 2. Connect to DB
        const pool = await sql.connect(dbConfig);

        // 3. Insert User (Using Parameters to prevent hacks)
        await pool.request()
            .input('first', sql.NVarChar, name)
            .input('middle', sql.NVarChar, middleName)
            .input('last', sql.NVarChar, surname)
            .input('pesel', sql.NVarChar, pesel)
            .input('phone', sql.NVarChar, phone)
            .input('email', sql.NVarChar, email)
            .input('pass', sql.NVarChar, passwordHash)
            .query(`
                INSERT INTO users (first_name, middle_name, last_name, pesel, phone_number, email, password_hash)
                VALUES (@first, @middle, @last, @pesel, @phone, @email, @pass)
            `);

        res.status(201).json({ message: 'User registered successfully!' });

    } catch (err) {
        console.error(err);
        // Error 2627 is the SQL Server code for "Unique Constraint Violation" (Duplicate Email/PESEL)
        if (err.number === 2627) {
            return res.status(409).json({ message: 'Email or PESEL already exists!' });
        }
        res.status(500).json({ message: 'Database error' });
    }
});

// Request Submission Endpoint
app.post('/submit-request', async (req, res) => {
    const { email, pesel, requestType, subcategory, description } = req.body;

    try {
        const pool = await sql.connect(dbConfig);

        // 1. Verify User Exists
        // We look for a user matching BOTH email and PESEL
        const userCheck = await pool.request()
            .input('email', sql.NVarChar, email)
            .input('pesel', sql.NVarChar, pesel)
            .query('SELECT id FROM users WHERE email = @email AND pesel = @pesel');

        if (userCheck.recordset.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found. Please register an account first, or check your Email/PESEL.' 
            });
        }

        const userId = userCheck.recordset[0].id;

        // 2. Insert Request
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
            
        // 3. Return Success with the new ID
        const newId = result.recordset[0].request_id;
        res.status(201).json({ 
            success: true, 
            message: 'Request submitted!',
            requestId: `REQ-${newId}` 
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));