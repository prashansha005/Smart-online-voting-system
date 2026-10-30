const express = require('express');
const crypto = require('crypto');
const Election = require('../models/Election');
const Participation = require('../models/Participation');
const Ballot = require('../models/Ballot');
const User = require('../models/User');
const { auth, adminOnly, voterOnly } = require('../middleware/auth');

const router = express.Router();

function generateAccessCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

function validateElection(body) {
  const { title, startTime, endTime, positions } = body;

  if (!title || !startTime || !endTime) {
    return 'Title, start time and end time are required';
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 'Please enter valid date and time';
  }

  if (end <= start) {
    return 'End time must be after start time';
  }

  if (!Array.isArray(positions) || positions.length === 0) {
    return 'Please add at least one position';
  }

  for (const position of positions) {
    if (!position.name || !position.name.trim()) {
      return 'Every position must have a name';
    }

    if (!Array.isArray(position.candidates) || position.candidates.length < 2) {
      return 'Every position must have at least two candidates';
    }

    for (const candidate of position.candidates) {
      if (!candidate.name || !candidate.name.trim()) {
        return 'Every candidate must have a name';
      }
    }
  }

  return null;
}

function electionStatus(election) {
  const now = new Date();
  const start = new Date(election.startTime);
  const end = new Date(election.endTime);

  if (now < start) return 'upcoming';
  if (now > end) return 'closed';
  return 'active';
}

// Create election
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const errorMessage = validateElection(req.body);
    if (errorMessage) {
      return res.status(400).json({ message: errorMessage });
    }

    const admin = await User.findById(req.user.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const election = await Election.create({
      title: req.body.title,
      description: req.body.description || '',
      organizationName: admin.organizationName || admin.name,
      accessCode: generateAccessCode(),
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      positions: req.body.positions,
      createdBy: req.user.id
    });

    res.status(201).json({
      message: 'Election created successfully',
      election
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Could not create election' });
  }
});

// Admin: get own elections
router.get('/admin', auth, adminOnly, async (req, res) => {
  try {
    const elections = await Election.find({ createdBy: req.user.id }).sort({ createdAt: -1 });

    const data = elections.map((election) => ({
      ...election.toObject(),
      status: electionStatus(election)
    }));

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Could not load elections' });
  }
});

// Voter: list active elections
router.get('/active', auth, voterOnly, async (req, res) => {
  try {
    const now = new Date();

    const elections = await Election.find({
      startTime: { $lte: now },
      endTime: { $gte: now }
    })
      .select('title description organizationName startTime endTime')
      .sort({ endTime: 1 });

    const participations = await Participation.find({
      voterId: req.user.id,
      electionId: { $in: elections.map((item) => item._id) }
    }).select('electionId');

    const votedElectionIds = participations.map((item) => item.electionId.toString());

    const data = elections.map((election) => ({
      ...election.toObject(),
      hasVoted: votedElectionIds.includes(election._id.toString())
    }));

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Could not load active elections' });
  }
});

// Voter: enter election using access code
router.post('/:id/access', auth, voterOnly, async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);

    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    if (electionStatus(election) !== 'active') {
      return res.status(400).json({ message: 'This election is not active now' });
    }

    if (!req.body.accessCode || req.body.accessCode.toUpperCase() !== election.accessCode) {
      return res.status(400).json({ message: 'Incorrect access code' });
    }

    const alreadyVoted = await Participation.findOne({
      electionId: election._id,
      voterId: req.user.id
    });

    if (alreadyVoted) {
      return res.status(400).json({ message: 'You have already voted in this election' });
    }

    res.json({
      _id: election._id,
      title: election.title,
      description: election.description,
      organizationName: election.organizationName,
      startTime: election.startTime,
      endTime: election.endTime,
      positions: election.positions
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not open election' });
  }
});

// Admin: get one election for editing
router.get('/:id', auth, adminOnly, async (req, res) => {
  try {
    const election = await Election.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    res.json({
      ...election.toObject(),
      status: electionStatus(election)
    });
  } catch (error) {
    res.status(500).json({ message: 'Could not load election' });
  }
});

// Admin: edit election before it starts
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const errorMessage = validateElection(req.body);
    if (errorMessage) {
      return res.status(400).json({ message: errorMessage });
    }

    const election = await Election.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    if (new Date() >= new Date(election.startTime)) {
      return res.status(400).json({ message: 'Started elections cannot be edited' });
    }

    election.title = req.body.title;
    election.description = req.body.description || '';
    election.startTime = req.body.startTime;
    election.endTime = req.body.endTime;
    election.positions = req.body.positions;

    await election.save();

    res.json({ message: 'Election updated successfully', election });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Could not update election' });
  }
});

// Admin: delete election before it starts
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const election = await Election.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    if (new Date() >= new Date(election.startTime)) {
      return res.status(400).json({ message: 'Started elections cannot be deleted' });
    }

    await Participation.deleteMany({ electionId: election._id });
    await Ballot.deleteMany({ electionId: election._id });
    await election.deleteOne();

    res.json({ message: 'Election deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Could not delete election' });
  }
});

// Admin: view election results
router.get('/:id/results/view', auth, adminOnly, async (req, res) => {
  try {
    const election = await Election.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    const ballots = await Ballot.find({ electionId: election._id });
    const turnout = await Participation.countDocuments({ electionId: election._id });

    const positions = election.positions.map((position) => {
      const candidates = position.candidates.map((candidate) => {
        let votes = 0;

        for (const ballot of ballots) {
          const selected = ballot.selections.find(
            (item) =>
              item.positionId === position._id.toString() &&
              item.candidateId === candidate._id.toString()
          );

          if (selected) {
            votes += 1;
          }
        }

        return {
          candidateId: candidate._id,
          name: candidate.name,
          info: candidate.info,
          votes
        };
      });

      return {
        positionId: position._id,
        name: position.name,
        candidates
      };
    });

    res.json({
      election: {
        id: election._id,
        title: election.title,
        organizationName: election.organizationName,
        startTime: election.startTime,
        endTime: election.endTime,
        status: electionStatus(election)
      },
      turnout,
      positions
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Could not load results' });
  }
});

module.exports = router;
