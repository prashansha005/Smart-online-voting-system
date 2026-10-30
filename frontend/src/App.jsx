import { useState } from 'react';
import { clearLogin, getSavedUser } from './api';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import AdminDashboard from './components/AdminDashboard';
import ElectionForm from './components/ElectionForm';
import VoterDashboard from './components/VoterDashboard';
import Results from './components/Results';

function App() {
  const savedUser = getSavedUser();
  const [user, setUser] = useState(savedUser);
  const [page, setPage] = useState(savedUser ? 'dashboard' : 'login');
  const [selectedElectionId, setSelectedElectionId] = useState(null);

  function handleLogin(loggedInUser) {
    setUser(loggedInUser);
    setPage('dashboard');
  }

  function handleLogout() {
    clearLogin();
    setUser(null);
    setPage('login');
    setSelectedElectionId(null);
  }

  function goDashboard() {
    if (user) {
      setPage('dashboard');
      setSelectedElectionId(null);
    }
  }

  function editElection(id) {
    setSelectedElectionId(id);
    setPage('election-form');
  }

  function viewResults(id) {
    setSelectedElectionId(id);
    setPage('results');
  }

  function showPage() {
    if (!user) {
      if (page === 'register') {
        return <Register goLogin={() => setPage('login')} />;
      }

      return <Login onLogin={handleLogin} goRegister={() => setPage('register')} />;
    }

    if (user.role === 'admin') {
      if (page === 'election-form') {
        return <ElectionForm electionId={selectedElectionId} goBack={goDashboard} />;
      }

      if (page === 'results' && selectedElectionId) {
        return <Results electionId={selectedElectionId} goBack={goDashboard} />;
      }

      return (
        <AdminDashboard
          user={user}
          createElection={() => {
            setSelectedElectionId(null);
            setPage('election-form');
          }}
          editElection={editElection}
          viewResults={viewResults}
        />
      );
    }

    return <VoterDashboard user={user} />;
  }

  return (
    <>
      <Navbar user={user} onLogout={handleLogout} goDashboard={goDashboard} />
      <main className="page-container">{showPage()}</main>
    </>
  );
}

export default App;
