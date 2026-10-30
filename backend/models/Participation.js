const mongoose = require('mongoose');

const participationSchema = new mongoose.Schema(
  {
    electionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Election',
      required: true
    },
    voterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

// This unique index prevents one voter from voting twice in the same election.
participationSchema.index({ electionId: 1, voterId: 1 }, { unique: true });

module.exports = mongoose.model('Participation', participationSchema);
