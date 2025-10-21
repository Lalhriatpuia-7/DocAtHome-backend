import jwt from "jsonwebtoken";
import User from "../models/user.js";

export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const Blacklist = (await import("../models/blacklist.js")).Blacklist;
    const blacklistedToken = await Blacklist.findOne({ token });
    if (blacklistedToken) {
      return res.status(401).json({ message: "Token is no longer valid. Please log in again." });
    }

    req.user = await User.findById(decoded.id).select("-password");
    req.token = token; // ✅ Attach token for logout route
    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};

// export const protect = async (req, res, next) => {
//   let token;
//   if (req.headers.authorization?.startsWith("Bearer")) {
//     try {
//       token = req.headers.authorization.split(" ")[1];
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       req.user = await User.findById(decoded.id).select("-password");
//       next();
//     } catch (err) {
//       return res.status(401).json({ message: "Not authorized, token failed" });
//     }
//   }
//   if (!token)
//     return res.status(401).json({ message: "Not authorized, no token" });

//   const isBlacklisted = (await import("../models/blacklist.js")).Blacklist;
//   const blacklistedToken = await isBlacklisted.findOne({ token });
//   if (blacklistedToken) {
//     return res.status(401).json({ message: "Token is no longer valid. Please log in again." });
//   }
//   next();

// };

export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Admins only." });
  }
};
