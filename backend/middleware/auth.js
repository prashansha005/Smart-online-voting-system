const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Please login first' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const userData = jwt.verify(token, process.env.JWT_SECRET);
    req.user = userData;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired login' });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access only' });
  }
  next();
}

function voterOnly(req, res, next) {
  if (req.user.role !== 'voter') {
    return res.status(403).json({ message: 'Voter access only' });
  }
  next();
}

module.exports = { auth, adminOnly, voterOnly };
