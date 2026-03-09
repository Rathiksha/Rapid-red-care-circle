/**
 * Rapid Red Care Circle - Main Server Entry Point
 * Minimal testable version with Express API + Socket.io for real-time notifications
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Make io accessible to routes
app.set('io', io);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
  
  // Handle user identification
  socket.on('identify', (userId) => {
    socket.userId = userId;
    console.log(`👤 User ${userId} identified on socket ${socket.id}`);
  });
});

// Import routes
const authRoutes = require('./routes/auth');
const donorRoutes = require('./routes/donors');
const requestRoutes = require('./routes/requests');
const mapRoutes = require('./routes/map');
const historyRoutes = require('./routes/history');
const hospitalRoutes = require('./routes/hospitals');

// Import database models
const db = require('./models');

// Sync database (create tables if they don't exist)
// Using alter: false to avoid backup table issues
db.sequelize.sync({ force: false, alter: false })
  .then(() => {
    console.log('✅ Database synced successfully');
  })
  .catch(err => {
    console.error('❌ Database sync error:', err);
  });

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/donor', donorRoutes); // Alias for backward compatibility
app.use('/api/requests', requestRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/hospitals', hospitalRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Rapid Red Care Circle API is running' });
});

// Serve index.html for root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Rapid Red Care Circle API running on http://localhost:${PORT}`);
  console.log(`📍 Open http://localhost:${PORT} in your browser to test`);
  console.log(`🔌 Socket.io ready for real-time notifications`);
});

module.exports = { app, server, io };
