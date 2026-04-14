const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Token aus Header abrufen
  const token = req.header('x-auth-token');

  // Überprüfen, ob Token existiert
  if (!token) {
    return res.status(401).json({ msg: 'Kein Token, Autorisierung verweigert' });
  }

  // Token verifizieren
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token ist nicht gültig' });
  }
};
