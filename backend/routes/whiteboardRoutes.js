const express = require('express');
const {
  listWhiteboards,
  createWhiteboard,
  getWhiteboard,
  updateWhiteboard,
  deleteWhiteboard,
  shareWhiteboard,
  removeCollaborator,
} = require('../controllers/whiteboardController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/').get(listWhiteboards).post(createWhiteboard);
router.route('/:id').get(getWhiteboard).put(updateWhiteboard).delete(deleteWhiteboard);
router.post('/:id/share', shareWhiteboard);
router.delete('/:id/share/:userId', removeCollaborator);

module.exports = router;
