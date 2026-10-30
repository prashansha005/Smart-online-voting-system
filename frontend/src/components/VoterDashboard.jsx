import { useEffect, useState } from 'react';
import { apiRequest } from '../api';

function VoterDashboard({ user }) {
  const [elections, setElections] = useState([]);
  const [codes, setCodes] = useState({});
  const [openedElection, setOpenedElection] = useState(null);
  const [selections, setSelections] = useState({});
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  async function loadElections() {
    try {
      const data = await apiRequest('/elections/active');
      setElections(data);
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    loadElections();
  }, []);

  function updateCode(electionId, value) {
    setCodes({ ...codes, [electionId]: value.toUpperCase() });
  }

  async function openBallot(electionId) {
    setMessage('');
    setSuccess(false);

    try {
      const data = await apiRequest(`/elections/${electionId}/access`, {
        method: 'POST',
        body: JSON.stringify({ accessCode: codes[electionId] || '' })
      });

      setOpenedElection(data);
      setSelections({});
    } catch (error) {
      setMessage(error.message);
    }
  }

  function chooseCandidate(positionId, candidateId) {
    setSelections({ ...selections, [positionId]: candidateId });
  }

  async function submitVote() {
    if (!openedElection) return;

    if (Object.keys(selections).length !== openedElection.positions.length) {
      setSuccess(false);
      setMessage('Please select one candidate for every position');
      return;
    }

    const confirmed = window.confirm('Submit your final vote? You cannot vote again.');
    if (!confirmed) return;

    const voteData = openedElection.positions.map((position) => ({
      positionId: position._id,
      candidateId: selections[position._id]
    }));

    try {
      const data = await apiRequest(`/votes/${openedElection._id}`, {
        method: 'POST',
        body: JSON.stringify({
          accessCode: codes[openedElection._id] || '',
          selections: voteData
        })
      });

      setSuccess(true);
      setMessage(data.message);
      setOpenedElection(null);
      setSelections({});
      loadElections();
    } catch (error) {
      setSuccess(false);
      setMessage(error.message);
    }
  }

  if (openedElection) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1>{openedElection.title}</h1>
            <p className="muted">{openedElection.organizationName}</p>
          </div>
          <button className="secondary" onClick={() => setOpenedElection(null)}>
            Back
          </button>
        </div>

        {message && <div className={success ? 'message success' : 'message error'}>{message}</div>}

        <div className="card">
          <p>{openedElection.description}</p>
          <p className="muted">Select one candidate for every position.</p>

          {openedElection.positions.map((position) => (
            <div className="ballot-position" key={position._id}>
              <h3>{position.name}</h3>

              {position.candidates.map((candidate) => (
                <label className="radio-card" key={candidate._id}>
                  <input
                    type="radio"
                    name={position._id}
                    checked={selections[position._id] === candidate._id}
                    onChange={() => chooseCandidate(position._id, candidate._id)}
                  />
                  <span>
                    <strong>{candidate.name}</strong>
                    {candidate.info && <small>{candidate.info}</small>}
                  </span>
                </label>
              ))}
            </div>
          ))}

          <button className="primary full" onClick={submitVote}>
            Review and Submit Vote
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Voter Dashboard</h1>
          <p className="muted">Welcome, {user.name}</p>
        </div>
      </div>

      {message && <div className={success ? 'message success' : 'message error'}>{message}</div>}

      <h2>Active Elections</h2>

      {elections.length === 0 ? (
        <div className="card">
          <p>No active elections are available right now.</p>
        </div>
      ) : (
        <div className="card-grid">
          {elections.map((election) => (
            <div className="card" key={election._id}>
              <h3>{election.title}</h3>
              <p className="muted">{election.organizationName}</p>
              <p>{election.description || 'No description'}</p>
              <p>
                <strong>Ends:</strong> {new Date(election.endTime).toLocaleString()}
              </p>

              {election.hasVoted ? (
                <div className="already-voted">Vote already submitted</div>
              ) : (
                <>
                  <label>Access Code</label>
                  <input
                    value={codes[election._id] || ''}
                    onChange={(event) => updateCode(election._id, event.target.value)}
                    placeholder="Enter code from admin"
                    maxLength="6"
                  />
                  <button className="primary full" onClick={() => openBallot(election._id)}>
                    Open Ballot
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default VoterDashboard;
