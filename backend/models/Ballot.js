const mongoose = require('mongoose');

const selectionSchema = new mongoose.Schema(
  {
    positionId: {
      type: String,
      required: true
    },
    candidateId: {
      type: String,
      required: true
    }
  },
  { _id: false }
);

const ballotSchema = new mongoose.Schema(
  {
    electionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Election',
      required: true
    },
    selections: {
      type: [selectionSchema],
      required: true
    }
  },
  { timestamps: true }
);

// voterId is intentionally not stored in the ballot document.
module.exports = mongoose.model('Ballot', ballotSchema);
