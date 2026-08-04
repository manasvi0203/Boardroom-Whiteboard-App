const Whiteboard = require('../models/Whiteboard');
const User = require('../models/User');

const canAccess = (board, userId) =>
  board.owner._id.toString() === userId.toString() ||
  board.collaborators.some((c) => c._id.toString() === userId.toString());

// GET /api/whiteboards - list boards owned by or shared with the user
const listWhiteboards = async (req, res) => {
  try {
    const boards = await Whiteboard.find({
      $or: [{ owner: req.user._id }, { collaborators: req.user._id }],
    })
      .populate('owner', 'name email')
      .populate('collaborators', 'name email')
      .sort({ updatedAt: -1 }); //newest board first
    res.json({ boards });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/whiteboards
const createWhiteboard = async (req, res) => {
  try {
    const board = await Whiteboard.create({
      title: req.body.title || 'Untitled Board',
      owner: req.user._id,
      data: '',
    });
    res.status(201).json({ board });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/whiteboards/:id
const getWhiteboard = async (req, res) => {
  try {
    const board = await Whiteboard.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('collaborators', 'name email');
    if (!board) return res.status(404).json({ message: 'Whiteboard not found' });
    if (!canAccess(board, req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json({ board });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/whiteboards/:id - rename and/or autosave canvas data
const updateWhiteboard = async (req, res) => {
  try {
    const board = await Whiteboard.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Whiteboard not found' });
    if (!canAccess(board, req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (req.body.title !== undefined) board.title = req.body.title;
    if (req.body.data !== undefined) board.data = req.body.data;
    board.lastEditedBy = req.user._id;
    await board.save();
    res.json({ board });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/whiteboards/:id - only owner may delete
const deleteWhiteboard = async (req, res) => {
  try {
    const board = await Whiteboard.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Whiteboard not found' });
    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the owner can delete this board' });
    }
    await board.deleteOne();
    res.json({ message: 'Whiteboard deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/whiteboards/:id/share - add a collaborator by email
const shareWhiteboard = async (req, res) => {
  try {
    const board = await Whiteboard.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Whiteboard not found' });
    
    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the owner can share this board' });
    }
    const collaborator = await User.findOne({ email: req.body.email?.toLowerCase() });
    if (!collaborator) return res.status(404).json({ message: 'No user with that email' });
    if (collaborator._id.toString() === board.owner.toString()) {
      return res.status(400).json({ message: 'Owner already has access' });
    }
    if (!board.collaborators.some((c) => c.toString() === collaborator._id.toString())) {
      board.collaborators.push(collaborator._id);
      await board.save();
    }
    const populated = await board.populate('collaborators', 'name email');
    res.json({ board: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/whiteboards/:id/share/:userId - remove a collaborator
const removeCollaborator = async (req, res) => {
  try {
    const board = await Whiteboard.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Whiteboard not found' });
    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the owner can modify sharing' });
    }
    board.collaborators = board.collaborators.filter(
      (c) => c.toString() !== req.params.userId
    );
    await board.save();
    res.json({ board });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  listWhiteboards,
  createWhiteboard,
  getWhiteboard,
  updateWhiteboard,
  deleteWhiteboard,
  shareWhiteboard,
  removeCollaborator,
  canAccess,
};
