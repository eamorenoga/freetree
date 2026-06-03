const jwt = require("jsonwebtoken");

function signUserToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET || "development-secret",
    { expiresIn: "7d" }
  );
}

module.exports = { signUserToken };
