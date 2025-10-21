import express from "express";
import { registerUser, loginUser,forgotPassword, logoutUser} from "../controllers/authController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";


const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/logout", protect, logoutUser);
// Example protected route
router.get("/admin", protect, adminOnly, (req, res) => {
  res.json({ message: "Welcome Admin" });
});

export default router;
