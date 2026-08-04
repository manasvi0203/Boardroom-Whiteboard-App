const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Whiteboard = require('../models/Whiteboard');
const { canAccess } = require('../controllers/whiteboardController');

// boardId -> Map<socketId, { userId, name, color }>
const presence = new Map();

const COLORS = ['#F97316', '#22C55E', '#3B82F6', '#EC4899', '#A855F7', '#EAB308', '#14B8A6'];
const colorForUser = (userId) => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
};

const broadcastPresence = (io, boardId) => {
  const map = presence.get(boardId);
  const list = map ? Array.from(map.values()) : [];
  io.to(`board:${boardId}`).emit('collaborators:update', list);
};

function initSocket(io) {
  // Authenticate every socket connection using the JWT issued at login
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id);
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } 
    catch (err) {
      next(new Error('Invalid token'));
    }
  });


  io.on('connection', (socket) => {
    //triggered when a user opens a board
    socket.on('board:join', async ({ boardId }) => {
      try {
        const board = await Whiteboard.findById(boardId);

        if (!board || !canAccess(board, socket.user._id)) {
          socket.emit('error:message', 'Access denied for this board');
          return;
        }

        socket.currentBoardId = boardId;
        socket.join(`board:${boardId}`);

        if (!presence.has(boardId)) presence.set(boardId, new Map());

        presence.get(boardId).set(socket.id, {
          socketId: socket.id,
          userId: socket.user._id.toString(),
          name: socket.user.name,
          color: colorForUser(socket.user._id.toString()),
        });
        broadcastPresence(io, boardId);
      } 
      catch (err) {
        socket.emit('error:message', 'Failed to join board');
      }
    });

    // Full-canvas sync: broadcast the latest fabric.js JSON to everyone else in the room
    socket.on('canvas:update', ({ boardId, data, version }) => {
      if (!boardId) return;
      socket.to(`board:${boardId}`).emit('canvas:update', {
        data,
        version,
        fromUserId: socket.user._id.toString(),
      });
    });

    // Live cursor position broadcast
    socket.on('cursor:move', ({ boardId, x, y }) => {
      if (!boardId) return;
      socket.to(`board:${boardId}`).emit('cursor:update', {
        userId: socket.user._id.toString(),
        name: socket.user.name,
        color: colorForUser(socket.user._id.toString()),
        x,
        y,
      });
    });

    socket.on('board:leave', ({ boardId }) => {
      leaveBoard(io, socket, boardId);
    });

    socket.on('disconnect', () => {
      if (socket.currentBoardId) leaveBoard(io, socket, socket.currentBoardId);
    });
  });
}

function leaveBoard(io, socket, boardId) {
  socket.leave(`board:${boardId}`);
  const map = presence.get(boardId);
  if (map) {
    map.delete(socket.id);
    if (map.size === 0) presence.delete(boardId);
  }
  broadcastPresence(io, boardId);
  if (socket.currentBoardId === boardId) socket.currentBoardId = null;
}

module.exports = initSocket;
