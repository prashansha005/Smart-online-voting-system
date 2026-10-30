import { useEffect, useState } from 'react';
import { apiRequest } from '../api';

function blankCandidate() {
  return { name: '', info: '' };
}

function blankPosition() {
  return {
    name: '',
    candidates: [blankCandidate(), blankCandidate()]
  };
}

function toDateTimeLocal(value) {
  if (!value) return '';

  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

function ElectionForm({ electionId, goBack }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [positions, setPositions] = useState([blankPosition()]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (electionId) {
      loadElection();
    }
  }, [electionId]);

  async function loadElection() {
    try {
      const data = await apiRequest(`/elections/${electionId}`);
      setTitle(data.title);
      setDescription(data.description || '');
      setStartTime(toDateTimeLocal(data.startTime));
      setEndTime(toDateTimeLocal(data.endTime));
      setPositions(
        data.positions.map((position) => ({
          name: position.name,
          candidates: position.candidates.map((candidate) => ({
            name: candidate.name,
            info: candidate.info || ''
          }))
        }))
      );
    } catch (error) {
      setMessage(error.message);
    }
  }

  function updatePositionName(index, value) {
    const copy = [...positions];
    copy[index].name = value;
    setPositions(copy);
  }

  function updateCandidate(positionIndex, candidateIndex, field, value) {
    const copy = [...positions];
    copy[positionIndex].candidates[candidateIndex][field] = value;
    setPositions(copy);
  }

  function addCandidate(positionIndex) {
    const copy = [...positions];
    copy[positionIndex].candidates.push(blankCandidate());
    setPositions(copy);
  }

  function removeCandidate(positionIndex, candidateIndex) {
    const copy = [...positions];

    if (copy[positionIndex].candidates.length <= 2) {
      setMessage('Each position needs at least two candidates');
      return;
    }

    copy[positionIndex].candidates.splice(candidateIndex, 1);
    setPositions(copy);
  }

  function addPosition() {
    setPositions([...positions, blankPosition()]);
  }

  function removePosition(positionIndex) {
    if (positions.length === 1) {
      setMessage('At least one position is required');
      return;
    }

    const copy = [...positions];
    copy.splice(positionIndex, 1);
    setPositions(copy);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');

    const body = {
      title,
      description,
      startTime,
      endTime,
      positions
    };

    try {
      if (electionId) {
        await apiRequest(`/elections/${electionId}`, {
          method: 'PUT',
          body: JSON.stringify(body)
        });
      } else {
        await apiRequest('/elections', {
          method: 'POST',
          body: JSON.stringify(body)
        });
      }

      goBack();
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>{electionId ? 'Edit Election' : 'Create Election'}</h1>
        <button className="secondary" onClick={goBack}>
          Back
        </button>
      </div>

      {message && <div className="message error">{message}</div>}

      <form className="card" onSubmit={handleSubmit}>
        <label>Election Title</label>
        <input value={title} onChange={(event) => setTitle(event.target.value)} required />

        <label>Description</label>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows="3"
        />

        <div className="two-columns">
          <div>
            <label>Start Date and Time</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              required
            />
          </div>
          <div>
            <label>End Date and Time</label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
              required
            />
          </div>
        </div>

        <hr />
        <div className="row-between">
          <h2>Positions and Candidates</h2>
          <button type="button" className="secondary" onClick={addPosition}>
            Add Position
          </button>
        </div>

        {positions.map((position, positionIndex) => (
          <div className="position-box" key={positionIndex}>
            <div className="row-between">
              <h3>Position {positionIndex + 1}</h3>
              {positions.length > 1 && (
                <button
                  type="button"
                  className="danger small-button"
                  onClick={() => removePosition(positionIndex)}
                >
                  Remove Position
                </button>
              )}
            </div>

            <label>Position Name</label>
            <input
              value={position.name}
              onChange={(event) => updatePositionName(positionIndex, event.target.value)}
              placeholder="Example: President"
              required
            />

            <h4>Candidates</h4>
            {position.candidates.map((candidate, candidateIndex) => (
              <div className="candidate-row" key={candidateIndex}>
                <input
                  value={candidate.name}
                  onChange={(event) =>
                    updateCandidate(positionIndex, candidateIndex, 'name', event.target.value)
                  }
                  placeholder="Candidate name"
                  required
                />
                <input
                  value={candidate.info}
                  onChange={(event) =>
                    updateCandidate(positionIndex, candidateIndex, 'info', event.target.value)
                  }
                  placeholder="Short info (optional)"
                />
                <button
                  type="button"
                  className="danger"
                  onClick={() => removeCandidate(positionIndex, candidateIndex)}
                >
                  Remove
                </button>
              </div>
            ))}

            <button
              type="button"
              className="secondary"
              onClick={() => addCandidate(positionIndex)}
            >
              Add Candidate
            </button>
          </div>
        ))}

        <button className="primary full" type="submit">
          {electionId ? 'Save Changes' : 'Create Election'}
        </button>
      </form>
    </div>
  );
}

export default ElectionForm;
