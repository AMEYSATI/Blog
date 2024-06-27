import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import pg from 'pg';
import { fileURLToPath } from 'url';
import path from 'path';
import bcrypt from 'bcrypt';
import passport from 'passport';
import { Strategy } from 'passport-local';
import session from 'express-session';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure the PostgreSQL client using environment variables
let { PGHOST, PGDATABASE, PGUSER, PGPASSWORD, ENDPOINT_ID } = process.env;

// Ensure PGPASSWORD is decoded if it was URL-encoded in .env
PGPASSWORD = decodeURIComponent(PGPASSWORD);

const pool = new pg.Pool({
  user: PGUSER,
  host: PGHOST,
  database: PGDATABASE,
  password: PGPASSWORD,
  port: 5432,
  ssl: {
    rejectUnauthorized: false, // Set to true if your Aiven instance requires it
  },
  connectionTimeoutMillis: 3000, // Adjust as needed
});

const app = express();
const PORT = process.env.PORT || 5000;
const saltRounds = 10;

app.use(cors({
    origin: 'https://blog-t7q7.onrender.com',
    credentials: true
}));

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(session({
    secret: 'TOPSECRETWORD',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true, 
        sameSite: 'none', 
        httpOnly: true,
    }
}));


app.use(passport.initialize());
app.use(passport.session());

// Middleware to authenticate if user is logged in
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Example route to fetch user posts if authenticated
app.get("/home", isAuthenticated, async (req, res) => {
    try {
        const result = await pool.query('SELECT post_title, post_content FROM userposts');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Route to register a new user
app.post("/register", async (req, res) => {
    const { username, userpassword } = req.body;
    try {
        const userCheckResult = await pool.query('SELECT * FROM blog WHERE username = $1', [username]);
        if (userCheckResult.rows.length > 0) {
            return res.status(400).send({ error: "Username already taken" });
        }

        const hashedPassword = await bcrypt.hash(userpassword, saltRounds);
        const result = await pool.query('INSERT INTO blog (username, userpassword) VALUES ($1, $2) RETURNING *', [username, hashedPassword]);
        const user = result.rows[0];
        req.login(user, (err) => {
            if (err) {
                console.log(err);
                res.status(500).send({ error: "Registration failed" });
            } else {
                res.status(200).send({ message: "User registered successfully" });
            }
        });

    } catch (error) {
        console.error("Error inserting user:", error);
        res.status(500).send({ error: "Registration failed" });
    }
});

// Route to handle user login
app.post("/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
        if (err) {
            console.error('Error during authentication:', err);
            return res.status(500).send({ error: "Internal Server Error" });
        }
        if (!user) {
            console.log('Authentication failed:', info);
            return res.status(401).send({ error: "Invalid username or password" });
        }
        req.logIn(user, (err) => {
            if (err) {
                console.error('Error logging in user:', err);
                return res.status(500).send({ error: "Internal Server Error" });
            }
            return res.status(200).send({ message: "User logged in successfully" });
        });
    })(req, res, next);
});

// Route to post a new blog post
app.post("/postblog", isAuthenticated, async (req, res) => {
    const { postTitle, postContent } = req.body;
    try {
        await pool.query('INSERT INTO userposts (post_title, post_content) VALUES ($1, $2)', [postTitle, postContent]);
        res.status(200).send({ message: "Post inserted successfully" });
    } catch (error) {
        console.error("Error inserting post:", error);
        res.status(500).send({ error: "Error inserting post" });
    }
});

// Route to fetch a specific post by title
app.post("/post", isAuthenticated, async (req, res) => {
    const { postTitle } = req.body;
    console.log('Received request to fetch post:', postTitle);
    try {
        const result = await pool.query('SELECT * FROM userposts WHERE post_title = $1', [postTitle]);
        console.log('Query result:', result.rows);
        if (result.rows.length > 0) {
            const post = result.rows[0];
            res.status(200).send({ post });
        } else {
            res.status(404).send({ error: "Post not found" });
        }
    } catch (error) {
        console.error("Error fetching post:", error);
        res.status(500).send({ error: "Error fetching post" });
    }
});

// Passport.js local strategy for authentication
passport.use(new Strategy(
    {
        usernameField: 'username',
        passwordField: 'userpassword'
    },
    async (username, password, cb) => {
        try {
            const result = await pool.query('SELECT * FROM blog WHERE username = $1', [username]);
            if (result.rows.length > 0) {
                const user = result.rows[0];
                const storedHashedPassword = user.userpassword;
                bcrypt.compare(password, storedHashedPassword, (err, isMatch) => {
                    if (err) {
                        return cb(err);
                    }
                    if (isMatch) {
                        return cb(null, user);
                    } else {
                        return cb(null, false, { message: 'Incorrect username or password.' });
                    }
                });
            } else {
                return cb(null, false, { message: 'Incorrect username or password.' });
            }
        } catch (error) {
            console.error("Error logging in user:", error);
            return cb(error);
        }
    }
));

passport.serializeUser((user, cb) => {
    cb(null, user.id);
});

passport.deserializeUser(async (id, cb) => {
    try {
        const result = await pool.query('SELECT * FROM blog WHERE id = $1', [id]);
        if (result.rows.length > 0) {
            cb(null, result.rows[0]);
        } else {
            cb(new Error('User not found'));
        }
    } catch (error) {
        cb(error);
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
