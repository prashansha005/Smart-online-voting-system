function Navbar({ user, onLogout, goDashboard }) {
  return (
    <nav className="navbar">
      <button className="brand-button" onClick={goDashboard}>
        Smart Online Voting System
      </button>

      {user && (
        <div className="nav-right">
          <span>
            {user.name} ({user.role})
          </span>
          <button className="light-button" onClick={onLogout}>
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
