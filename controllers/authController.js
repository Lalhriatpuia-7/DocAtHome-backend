import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "./../models/user.js";
import nodemailer from "nodemailer";
import crypto from "crypto";
import logger from "../utils/logger.js";

// Generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Register
export const registerUser = async (req, res) => {
  const { name, email, password, role, specialization, availability } = req.body; // Added speciality and availability

  try {
    
    if (!name || !email || !password || !role) {
      logger.warn('Registration attempt with missing fields');
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    const userNameExists = await User.findOne({ name });
    if (userNameExists){
      logger.warn('Registration attempt with existing username');
      return res.status(409).json({ message: "Username already taken" });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      logger.warn('Registration attempt with invalid email format');
      return res.status(400).json({ message: "Invalid email format" });
    }
     const userExists = await User.findOne({ email });
    if (userExists){
      logger.warn('Registration attempt with existing email');
      return res.status(409).json({ 
        message: 
        "User email already exists" 
      });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      logger.warn('Registration attempt with weak password');
      return res.status(400).json({
        message:
          "Password must be at least 8 characters, include uppercase(ABC...), lowercase(abc...), number(123...), and special character(!@#$...)",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      specialization, 
      availability, 
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      specialization: user.specialization, // Return speciality
      availability: user.availability, // Return availability
      token: generateToken(user._id, user.role),
    });
    logger.info(`New user registered: ${user.email} with role ${user.role}`);
  } catch (err) {
      logger.error(`Error during user registration: ${err.message}`);
    res.status(500).json({ message: err.message });
  }
};

// Login
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if(!user){
      logger.warn(`Login attempt with non-existent email: ${email}`);
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if(user && user.isLocked){
      if(user.lockUntil && user.lockUntil > Date.now()){
        logger.warn(`Locked account login attempt: ${email}`);
        return res.status(403).json({ message: "Account is locked due to multiple failed login attempts. Please try again after 2 hours." });
      } else {
        user.isLocked = false;
        user.failedLoginAttempts = 0;
        user.lockUntil = null;
        await user.save();
        logger.info(`Account unlocked after lock period: ${email}`);
      }
    }
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id, user.role),
      });
      user.lastLogin = new Date();
      await user.save();
      logger.info(`User logged in: ${email}`);
    } else {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) {
        logger.warn(`Account locked due to multiple failed login attempts: ${email}`);
        user.isLocked = true;
        user.lockUntil = Date.now() + 2 * 60 * 60 * 1000; // Lock for 2 hours
      }
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (err) {
    logger.error(`Error during user login: ${err.message}`);
    res.status(500).json({ message: err.message });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body; 
  try {
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn(`Password reset attempt for non-existent email: ${email}`);
      return res.status(404).json({ message: "User not found" });
    } 

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();
    logger.info(`Password reset token generated for: ${email}`);
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.NODE_MAILER_USER_GMAIL,
        pass: process.env.NODEMAILER_PASS_GMAIL,
      },
    }); 
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${email}`;
    const mailOptions = {
      to: email,
      from: process.env.NODE_MAILER_USER_GMAIL,
      subject: 'Password Reset',
      text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
      Please click on the following link, or paste this into your browser to complete the process:\n\n
        ${resetUrl}\n\n
      If you did not request this, please ignore this email and your password will remain unchanged.\n`
    };
    await transporter.sendMail(mailOptions);
    logger.info(`Password reset email sent to: ${email}`);
    // Here, you would typically generate a password reset token and send it via email.
    res.json({ message: "Password reset link has been sent to your email (simulated)." });
  } catch (err) {
    logger.error(`Error during password reset process for ${email}: ${err.message}`);
    res.status(500).json({ message: err.message });
  } 
};

export const resetPassword = async (req, res) => {
  const { token, email, newPassword } = req.body; 
  try {
    const user = await User.findOne({ email, resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) {
      logger.warn(`Invalid or expired password reset token for email: ${email}`);
      return res.status(400).json({ message: "Invalid or expired token" });
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    logger.info(`Password successfully reset for: ${email}`);
    res.json({ message: "Password has been reset successfully" });
  } catch (err) {
    logger.error(`Error during password reset for ${email}: ${err.message}`);
    res.status(500).json({ message: err.message });
  }
}


