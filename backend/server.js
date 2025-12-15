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

// ==========================================
// 1. SMART REGISTRATION (Handle Guests)
// ==========================================
app.post('/register', async (req, res) => {
    const { name, middleName, surname, pesel, phone, email, password } = req.body;

    try {
        const pool = await sql.connect(dbConfig);
        
        // Encrypt Password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Check if user exists (Guest or Real)
        const checkUser = await pool.request()
            .input('email', sql.NVarChar, email)
            .input('pesel', sql.NVarChar, pesel)
            .query('SELECT id, password_hash FROM users WHERE email = @email OR pesel = @pesel');

        if (checkUser.recordset.length > 0) {
            const user = checkUser.recordset[0];

            // SCENARIO A: User exists but is a GUEST (No password) -> UPGRADE THEM
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
            
            // SCENARIO B: User exists and has a password -> ERROR
            return res.status(409).json({ message: 'User already exists!' });
        }

        // SCENARIO C: New User -> INSERT
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

// ==========================================
// 2. GUEST REQUEST SUBMISSION
// ==========================================
app.post('/submit-request', async (req, res) => {
    // We receive EVERYTHING from the form
    const { name, middleName, surname, pesel, phone, email, requestType, subcategory, description } = req.body;

    try {
        const pool = await sql.connect(dbConfig);
        let userId;

        // Step 1: Check if user exists
        const userCheck = await pool.request()
            .input('email', sql.NVarChar, email)
            .input('pesel', sql.NVarChar, pesel)
            .query('SELECT id FROM users WHERE email = @email OR pesel = @pesel');

        if (userCheck.recordset.length > 0) {
            // User exists (Guest or Registered) -> Use their ID
            userId = userCheck.recordset[0].id;
        } else {
            // User does NOT exist -> Create "Guest" (Password is NULL)
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

        // Step 2: Create the Request linked to that User ID
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

// ==========================================
// LOGIN ENDPOINT (Returns User Data)
// ==========================================
app.post('/login', async (req, res) => {
    const { userId, password } = req.body; // userId is the Email

    try {
        const pool = await sql.connect(dbConfig);
        
        // 1. Find User by Email
        const result = await pool.request()
            .input('email', sql.NVarChar, userId)
            .query('SELECT * FROM users WHERE email = @email');

        const user = result.recordset[0];

        // 2. Validate User & Password
        if (!user || !user.password_hash) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const validPass = await bcrypt.compare(password, user.password_hash);
        if (!validPass) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        // 3. Return User Data (Exclude sensitive hash)
        res.json({
            success: true,
            user: {
                first_name: user.first_name,
                middle_name: user.middle_name,
                last_name: user.last_name,
                pesel: user.pesel,
                phone_number: user.phone_number,
                email: user.email
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));