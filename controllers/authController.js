import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "./../models/user.js";
import nodemailer from "nodemailer";
import crypto from "crypto";

// Generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Register
export const registerUser = async (req, res) => {
  const { name, email, password, role, specialization, availability } = req.body; // Added speciality and availability

  try {
    
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    const userNameExists = await User.findOne({ name });
    if (userNameExists){
      return res.status(409).json({ message: "Username already taken" });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
     const userExists = await User.findOne({ email });
    if (userExists){
      return res.status(409).json({ 
        message: 
        "User email already exists" 
      });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
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
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Login
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body; 
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    } 

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

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

    // Here, you would typically generate a password reset token and send it via email.
    res.json({ message: "Password reset link has been sent to your email (simulated)." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  } 
};
