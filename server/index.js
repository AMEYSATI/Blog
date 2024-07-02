import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import pg from 'pg';
import { fileURLToPath } from 'url';
import path from 'path';
import bcrypt from 'bcrypt';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import session from 'express-session';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new pg.Client({
  user: 'postgres',
  host: 'localhost',
  database: 'Blog',
  password: 'importjava.UTIL.*',
  port: 5432,
});

db.connect();

const app = express();
const PORT = 5000;
const saltRounds = 10;

app.use(cors({
  origin: 'http://localhost:3000', // Your frontend URL
  credentials: true // Allow cookies to be sent
}));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.set('trust proxy', 1); // Trust the first proxy
app.use(session({
  secret: 'TOPSECRETWORD',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: true } 
}));
app.use(passport.initialize());
app.use(passport.session());

// Passport configuration and routes...

app.get('/home', async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const result = await db.query('SELECT post_title, post_content FROM userposts');
      res.status(200).json(result.rows);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

app.post('/register', async (req, res) => {
  const { username, userpassword } = req.body;
  try {
    const userCheckResult = await db.query('SELECT * FROM blog WHERE username = $1', [username]);
    if (userCheckResult.rows.length > 0) {
      return res.status(400).send({ error: 'Username already taken' });
    }
    const hashedPassword = await bcrypt.hash(userpassword, saltRounds);
    const result = await db.query('INSERT INTO blog (username, userpassword) VALUES ($1, $2) RETURNING *', [username, hashedPassword]);
    const user = result.rows[0];
    req.login(user, (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send({ error: 'Internal Server Error' });
      }
      res.status(200).send({ message: 'User registered successfully' });
    });
  } catch (error) {
    console.error('Error inserting user:', error);
    res.status(500).send({ error: 'Registration failed' });
  }
});

app.post('/login', (req, res, next) => {
  console.log('Received login request with body:', req.body); // Log the request body
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error('Error during authentication:', err);
      return res.status(500).send({ error: 'Internal Server Error' });
    }
    if (!user) {
      console.log('Authentication failed:', info);
      return res.status(401).send({ error: 'Invalid username or password' });
    }
    req.logIn(user, (err) => {
      if (err) {
        console.error('Error logging in user:', err);
        return res.status(500).send({ error: 'Internal Server Error' });
      }
      return res.status(200).send({ message: 'User logged in successfully' });
    });
  })(req, res, next);
});

app.post('/postblog', async (req, res) => {
  const { postTitle, postContent } = req.body;
  try {
    await db.query('INSERT INTO userposts (post_title, post_content) VALUES ($1, $2)', [postTitle, postContent]);
    res.status(200).send({ message: 'Post inserted successfully' });
  } catch (error) {
    console.error('Error inserting post:', error);
    res.status(500).send({ error: 'Error inserting post' });
  }
});

app.post('/post', async (req, res) => {
  const { postTitle } = req.body;
  console.log('Received request to fetch post:', postTitle); 
  try {
    const result = await db.query('SELECT * FROM userposts WHERE post_title = $1', [postTitle]);
    console.log('Query result:', result.rows); 
    if (result.rows.length > 0) {
      const post = result.rows[0];
      res.status(200).send({ post });
    } else {
      res.status(404).send({ error: 'Post not found' });
    }
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).send({ error: 'Error fetching post' });
  }
});

passport.use(new LocalStrategy(
  {
    usernameField: 'username',
    passwordField: 'userpassword'
  },
  async (username, password, cb) => {
    try {
      const result = await db.query('SELECT * FROM blog WHERE username = $1', [username]);
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
      console.error('Error logging in user:', error);
      return cb(error);
    }
  }
));

passport.serializeUser((user, cb) => {
  cb(null, user.id); // Store user ID in session
});

passport.deserializeUser(async (id, cb) => {
  try {
    const result = await db.query('SELECT * FROM blog WHERE id = $1', [id]);
    if (result.rows.length > 0) {
      cb(null, result.rows[0]);
    } else {
      cb(new Error('User not found'));
    }
  } catch (error) {
    cb(error);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
