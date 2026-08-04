const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email and password' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, password });
    res.status(201).json({
      user,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    res.json({ user, token: generateToken(user._id) });
  } 
  catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ user: req.user }); //added by authentication middleware
};

// PUT /api/auth/me
const updateMe = async (req, res) => {
  try {
    const { name, email } = req.body;
    if (name) req.user.name = name;
    if (email) req.user.email = email.toLowerCase();
    await req.user.save();
    res.json({ user: req.user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { register, login, getMe, updateMe };
