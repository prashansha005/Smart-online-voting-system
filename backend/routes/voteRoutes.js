const express = require('express');
const Election = require('../models/Election');
const Participation = require('../models/Participation');
const Ballot = require('../models/Ballot');
const { auth, voterOnly } = require('../middleware/auth');

const router = express.Router();

function electionIsActive(election) {
  const now = new Date();
  return now >= new Date(election.startTime) && now <= new Date(election.endTime);
}

router.post('/:electionId', auth, voterOnly, async (req, res) => {
  let participation = null;

  try {
    const { accessCode, selections } = req.body;
    const election = await Election.findById(req.params.electionId);

    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    if (!electionIsActive(election)) {
      return res.status(400).json({ message: 'This election is not active now' });
    }

    if (!accessCode || accessCode.toUpperCase() !== election.accessCode) {
      return res.status(400).json({ message: 'Incorrect access code' });
    }

    if (!Array.isArray(selections) || selections.length !== election.positions.length) {
      return res.status(400).json({ message: 'Please select one candidate for every position' });
    }

    const cleanSelections = [];

    for (const position of election.positions) {
      const selected = selections.find(
        (item) => item.positionId === position._id.toString()
      );

      if (!selected) {
        return res.status(400).json({ message: 'Please select one candidate for every position' });
      }

      const candidate = position.candidates.find(
        (item) => item._id.toString() === selected.candidateId
      );

      if (!candidate) {
        return res.status(400).json({ message: 'Invalid candidate selection' });
      }

      cleanSelections.push({
        positionId: position._id.toString(),
        candidateId: candidate._id.toString()
      });
    }

    // The unique index on Participation blocks duplicate voting.
    participation = await Participation.create({
      electionId: election._id,
      voterId: req.user.id
    });

    // Ballot stores choices but does not store the voter identity.
    await Ballot.create({
      electionId: election._id,
      selections: cleanSelections
    });

    res.status(201).json({ message: 'Vote submitted successfully' });
  } catch (error) {
    // If ballot saving fails, remove the participation record created by this request.
    if (participation) {
      await Participation.findByIdAndDelete(participation._id);
    }

    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already voted in this election' });
    }

    console.log(error);
    res.status(500).json({ message: 'Vote submission failed' });
  }
});

module.exports = router;
