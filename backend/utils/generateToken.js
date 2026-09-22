// Import JWT
import jwt from "jsonwebtoken";

// Generate JWT token
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || "my_super_secret_mcq_jwt_key_2026";
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      organizationId: user.organizationId
    },
    secret,
    {
      expiresIn: "7d"
    }
  );
};

// Export function
export default generateToken;