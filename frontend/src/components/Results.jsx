import { useEffect, useState } from 'react';
import { apiRequest } from '../api';

function Results({ electionId, goBack }) {
  const [data, setData] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadResults();
  }, [electionId]);

  async function loadResults() {
    try {
      const result = await apiRequest(`/elections/${electionId}/results/view`);
      setData(result);
    } catch (error) {
      setMessage(error.message);
    }
  }

  if (!data) {
    return (
      <div>
        <button className="secondary" onClick={goBack}>
          Back
        </button>
        {message ? <div className="message error">{message}</div> : <p>Loading results...</p>}
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Election Results</h1>
          <p className="muted">{data.election.title}</p>
        </div>
        <button className="secondary" onClick={goBack}>
          Back
        </button>
      </div>

      <div className="summary-box">
        <strong>Total votes cast:</strong> {data.turnout}
        <br />
        <strong>Status:</strong> {data.election.status}
      </div>

      {data.positions.map((position) => (
        <div className="card" key={position.positionId}>
          <h2>{position.name}</h2>
          <table>
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Info</th>
                <th>Votes</th>
              </tr>
            </thead>
            <tbody>
              {position.candidates.map((candidate) => (
                <tr key={candidate.candidateId}>
                  <td>{candidate.name}</td>
                  <td>{candidate.info || '-'}</td>
                  <td>{candidate.votes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

export default Results;
