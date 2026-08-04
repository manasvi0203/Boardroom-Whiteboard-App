const mongoose = require('mongoose');

const whiteboardSchema = new mongoose.Schema(
  {
    title: { 
      type: String, 
      required: true, 
      trim: true, 
      default: 'Untitled Board' 
  },
    owner: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', required: true 
    },

   collaborators: 
   [{  type: mongoose.Schema.Types.ObjectId,
       ref: 'User'
    }],

    // Serialized fabric.js canvas JSON (stringified) - the persisted drawing state
    data: { 
      type: String, 
      default: '' 
    },
    lastEditedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
  },
  { timestamps: true }
);

whiteboardSchema.index({ owner: 1 });
whiteboardSchema.index({ collaborators: 1 });

module.exports = mongoose.model('Whiteboard', whiteboardSchema);
