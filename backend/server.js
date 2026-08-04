require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const whiteboardRoutes = require('./routes/whiteboardRoutes');
const initSocket = require('./sockets/whiteboardSocket');

connectDB();

const app = express();
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '15mb' })); // canvas JSON payloads can get large

//to check if the server is running
app.get('/api/health', (req, res) => 
  res.json({ status: 'ok' }
  ));

//register routes
app.use('/api/auth', authRoutes);
app.use('/api/whiteboards', whiteboardRoutes);

// Basic error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error' });
});

//wraps express app inside http server
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: CLIENT_URL, credentials: true },
  maxHttpBufferSize: 1e7,
});

initSocket(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
