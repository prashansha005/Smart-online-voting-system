import { useEffect, useState } from 'react';
import { apiRequest } from '../api';

function AdminDashboard({ user, createElection, editElection, viewResults }) {
  const [elections, setElections] = useState([]);
  const [message, setMessage] = useState('');

  async function loadElections() {
    try {
      const data = await apiRequest('/elections/admin');
      setElections(data);
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    loadElections();
  }, []);

  async function deleteElection(id) {
    const confirmed = window.confirm('Delete this election?');
    if (!confirmed) return;

    try {
      const data = await apiRequest(`/elections/${id}`, { method: 'DELETE' });
      setMessage(data.message);
      loadElections();
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p className="muted">Organization: {user.organizationName || '-'}</p>
        </div>
        <button className="primary" onClick={createElection}>
          Create Election
        </button>
      </div>

      {message && <div className="message">{message}</div>}

      {elections.length === 0 ? (
        <div className="card">
          <p>No elections created yet.</p>
        </div>
      ) : (
        <div className="card-grid">
          {elections.map((election) => (
            <div className="card" key={election._id}>
              <div className="row-between">
                <h3>{election.title}</h3>
                <span className={`status ${election.status}`}>{election.status}</span>
              </div>

              <p>{election.description || 'No description'}</p>
              <p>
                <strong>Access Code:</strong>{' '}
                <span className="code">{election.accessCode}</span>
              </p>
              <p>
                <strong>Starts:</strong> {new Date(election.startTime).toLocaleString()}
              </p>
              <p>
                <strong>Ends:</strong> {new Date(election.endTime).toLocaleString()}
              </p>
              <p>
                <strong>Positions:</strong> {election.positions.length}
              </p>

              <div className="button-row">
                {election.status === 'upcoming' && (
                  <button className="secondary" onClick={() => editElection(election._id)}>
                    Edit
                  </button>
                )}
                <button className="primary" onClick={() => viewResults(election._id)}>
                  Results
                </button>
                {election.status === 'upcoming' && (
                  <button className="danger" onClick={() => deleteElection(election._id)}>
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
