const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (HTML, CSS, JS, uploads)
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname);
        const uniqueName = uuidv4() + extension;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('audio/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only audio and video files are allowed'), false);
        }
    }
});

// ==========================================
// API Routes
// ==========================================

// ==========================================
// Authentication Routes
// ==========================================

// Register new user
app.post('/api/auth/register', async (req, res) => {
    try {
        const { firstName, lastName, username, email, password } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !username || !email || !password) {
            return res.status(400).json({ success: false, error: 'All fields are required' });
        }

        // Check if email already exists
        const [existingEmail] = await db.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingEmail.length > 0) {
            return res.status(400).json({ success: false, error: 'Email already registered' });
        }

        // Check if username already exists
        const [existingUsername] = await db.execute(
            'SELECT id FROM users WHERE username = ?',
            [username]
        );

        if (existingUsername.length > 0) {
            return res.status(400).json({ success: false, error: 'Username already taken' });
        }

        // Simple password hash (for demo - use bcrypt in production)
        const crypto = require('crypto');
        const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

        // Insert new user
        const [result] = await db.execute(
            `INSERT INTO users (first_name, last_name, username, email, password_hash, created_at) 
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [firstName, lastName, username, email, passwordHash]
        );

        res.json({
            success: true,
            message: 'Account created successfully',
            userId: result.insertId
        });
    } catch (error) {
        console.error('Registration error:', error.message);
        res.status(500).json({ success: false, error: 'Registration failed. Please try again.' });
    }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email/Username and password are required' });
        }

        // Hash the password
        const crypto = require('crypto');
        const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

        // Find user by email OR username
        const [users] = await db.execute(
            'SELECT id, first_name, last_name, username, email FROM users WHERE (email = ? OR username = ?) AND password_hash = ?',
            [email, email, passwordHash]
        );

        if (users.length === 0) {
            return res.status(401).json({ success: false, error: 'Invalid email/username or password' });
        }

        const user = users[0];

        res.json({
            success: true,
            user: {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({ success: false, error: 'Login failed. Please try again.' });
    }
});


// Get current user (check if logged in)
app.get('/api/auth/me', async (req, res) => {
    // In a real app, you'd check session/JWT token here
    res.json({ success: false, error: 'Not implemented' });
});

// Audius Proxy - Fetch trending tracks
app.get('/api/music', async (req, res) => {
    try {
        const response = await fetch(
            'https://discoveryprovider.audius.co/v1/tracks/trending?app_name=MusicLibraryApp',
            {
                headers: { 'Accept': 'application/json' },
                timeout: 30000
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch from Audius');
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Audius API error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// List all media files
app.get('/api/library', async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT id, filename, original_name, file_type, mime_type, file_size, 
                    duration, title, artist, upload_date, file_path 
             FROM media_files ORDER BY upload_date DESC`
        );

        // Transform snake_case to camelCase for frontend
        const data = rows.map(row => ({
            id: row.id,
            filename: row.filename,
            originalName: row.original_name,
            fileType: row.file_type,
            mimeType: row.mime_type,
            fileSize: row.file_size,
            duration: row.duration,
            title: row.title,
            artist: row.artist,
            uploadDate: row.upload_date,
            filePath: row.file_path
        }));

        res.json({ success: true, data });
    } catch (error) {
        console.error('Library fetch error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Stream media file with range support
app.get('/api/library/stream', async (req, res) => {
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ error: 'Missing id parameter' });
    }

    try {
        const [rows] = await db.execute(
            'SELECT filename, file_path, mime_type FROM media_files WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'File not found' });
        }

        const { file_path, mime_type } = rows[0];
        const filePath = path.join(__dirname, file_path);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found on disk' });
        }

        const stat = fs.statSync(filePath);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
            // Handle range request for seeking
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

            if (start >= fileSize) {
                res.status(416).set('Content-Range', `bytes */${fileSize}`);
                return res.end();
            }

            const chunkSize = (end - start) + 1;
            const stream = fs.createReadStream(filePath, { start, end });

            res.status(206).set({
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize,
                'Content-Type': mime_type
            });

            stream.pipe(res);
        } else {
            // Full file transfer
            res.set({
                'Content-Length': fileSize,
                'Content-Type': mime_type,
                'Accept-Ranges': 'bytes'
            });

            fs.createReadStream(filePath).pipe(res);
        }
    } catch (error) {
        console.error('Stream error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Upload media file
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        const { filename, originalname, mimetype, size } = req.file;
        const fileType = mimetype.startsWith('audio/') ? 'audio' : 'video';

        // Extract title from filename (remove extension)
        let title = originalname;
        if (title.includes('.')) {
            title = title.substring(0, title.lastIndexOf('.'));
        }

        const artist = req.body.artist || 'Unknown Artist';
        const duration = parseInt(req.body.duration) || 0;
        const filePath = 'uploads/' + filename;

        // Save to database
        const [result] = await db.execute(
            `INSERT INTO media_files 
             (filename, original_name, file_type, mime_type, file_size, title, artist, duration, file_path) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [filename, originalname, fileType, mimetype, size, title, artist, duration, filePath]
        );

        res.json({
            success: true,
            id: result.insertId,
            filename,
            title,
            artist,
            fileType,
            duration
        });
    } catch (error) {
        console.error('Upload error:', error.message);
        // Delete uploaded file if database insert failed
        if (req.file) {
            fs.unlink(req.file.path, () => { });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete media file
app.delete('/api/library', async (req, res) => {
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ success: false, error: 'Missing id parameter' });
    }

    try {
        // Get file path first
        const [rows] = await db.execute(
            'SELECT file_path FROM media_files WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'File not found' });
        }

        const filePath = path.join(__dirname, rows[0].file_path);

        // Delete from database
        const [result] = await db.execute(
            'DELETE FROM media_files WHERE id = ?',
            [id]
        );

        if (result.affectedRows > 0) {
            // Delete physical file
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            res.json({ success: true });
        } else {
            res.status(404).json({ success: false, error: 'File not found' });
        }
    } catch (error) {
        console.error('Delete error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║           🎵 Music Library Server Started 🎵              ║
╠══════════════════════════════════════════════════════════╣
║  Server running at: http://localhost:${PORT}                ║
║  Open your browser and navigate to the URL above         ║
╚══════════════════════════════════════════════════════════╝
    `);
});
