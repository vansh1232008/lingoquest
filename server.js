// LingoQuest: Full-Stack Project with JavaScript (Node.js + React)

// Step 1: Backend Setup (Node.js + Express)

// 1. Initialize the Backend
// Open a terminal in your project directory and run:
// npm init -y
// npm install express mongoose cors body-parser bcrypt jsonwebtoken

// 2. Create the Server
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 5000;
const MONGO_URI = 'mongodb://127.0.0.1:27017/lingoquest'; // Update if using MongoDB Atlas
const SECRET_KEY = 'your_jwt_secret';

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB Connected'))
    .catch((err) => console.error('MongoDB Connection Error:', err));

// Models
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', UserSchema);

const QuizSchema = new mongoose.Schema({
    title: { type: String, required: true },
    questions: [{
        question: String,
        options: [String],
        answer: Number
    }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});
const Quiz = mongoose.model('Quiz', QuizSchema);

// Routes
// User Registration
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Registration failed', details: err.message });
    }
});

// User Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id }, SECRET_KEY, { expiresIn: '1h' });
        res.status(200).json({ message: 'Login successful', token });
    } catch (err) {
        res.status(500).json({ error: 'Login failed', details: err.message });
    }
});

// Create Quiz
app.post('/api/quizzes', async (req, res) => {
    try {
        const { title, questions, userId } = req.body;
        const newQuiz = new Quiz({ title, questions, createdBy: userId });
        await newQuiz.save();
        res.status(201).json({ message: 'Quiz created successfully', quiz: newQuiz });
    } catch (err) {
        res.status(500).json({ error: 'Quiz creation failed', details: err.message });
    }
});

// Get All Quizzes
app.get('/api/quizzes', async (req, res) => {
    try {
        const quizzes = await Quiz.find().populate('createdBy', 'username');
        res.status(200).json(quizzes);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch quizzes', details: err.message });
    }
});

// Start Server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

// Step 2: Frontend Setup (React)

// 1. Initialize React Project
// In a new terminal, run:
// npx create-react-app lingoquest_frontend
// cd lingoquest_frontend
// npm install axios react-router-dom

// 2. Create Components
// Register.js
import React, { useState } from 'react';
import axios from 'axios';

const Register = () => {
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:5000/api/register', formData);
            alert(res.data.message);
        } catch (err) {
            alert('Registration failed');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input name="username" placeholder="Username" onChange={handleChange} />
            <input name="email" placeholder="Email" onChange={handleChange} />
            <input name="password" type="password" placeholder="Password" onChange={handleChange} />
            <button type="submit">Register</button>
        </form>
    );
};

export default Register;
