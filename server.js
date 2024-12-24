import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from './modules/user.js'; // Import User using ESM syntax
import session from 'express-session';

const app = express();

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({secret: 'notgood'}));

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', 'views');

// Serve static files (if needed)
// app.use(express.static('public'));

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/testdb')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Failed to connect to MongoDB', err));

// Routes
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/register', (req, res) => {
  res.render('index');
});

app.get('/login', (req, res) => {
  res.render('login');
});

// Register route
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send('Username and password are required.');
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    req.session.user_id =  user._id;
    return res.redirect('/secret');
  } catch (err) {
    console.error(err);
    return res.status(500).send('Error registering user.');
  }
});

// Login route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  const validPassword = await bcrypt.compare(password, user.password);
  if (validPassword) {
    req.session.user_id =  user._id;
    res.redirect('/secret');
  }
  else {
    res.redirect('/login');
  }
});

app.post('/logout', (req,res) => {
  req.session.destroy();
  res.redirect('/login');
})

app.get('/secret', (req,res) => {
  if (!req.session.user_id){
    res.redirect('/login');
  }
  res.render("secret");
})

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
