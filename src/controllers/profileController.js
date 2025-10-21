import Profile from "../models/profile.js";
import User from "../models/user.js";
import multer from "multer";
import path from "path";


 export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// Get user profile
export const getMyProfile = async (req, res) => {
  // console.log("User ID from token:", req.user._id); // Debugging line
  try { 
    console.log("Fetching profile for user ID:", req.user._id); // Debugging line
    const userProfile = await Profile.findOne({ user: req.user._id }).populate("user", "name email role specialization");
    // const displayPicture = `${req.protocol}://${req.get("host")}${userProfile.displayPicture}`;
    const returnUser = {
      name: userProfile.user.name,
      email: userProfile.user.email,
      role: userProfile.user.role,
      specialization: userProfile.user.specialization,
      age: userProfile.age,
      displayPicture: userProfile.displayPicture,
      address: userProfile.address,
      phone: userProfile.phone,
      bio: userProfile.bio,
      verified: userProfile.verified,
    }
    console.log("Fetched Profile:", userProfile); // Debugging line
    if (!userProfile) {
      console.log("No profile found for user ID:", req.user._id); // Debugging line
      return res.status(404).json({ message: "Profile not found" });
    }
    if(userProfile === null){
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json(returnUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  } 
};

export const createProfile = async (req, res) => {
  console.log("Create Profile function called");
  console.log("Request Body:", req.body);
  try {
    const { age, address, phone, bio } = req.body;
    console.log("Request File in createProfile:", req.file); // Debugging line
    let existingProfile = await Profile.findOne({ user: req.user._id });
    if (existingProfile) {
      return res.status(400).json({ message: "Profile already exists" });
    }

    const displayPictureUrl = req.file ? `/uploads/${req.file.filename}` : null;
    console.log("Request File:", req.file); // Debugging line
    console.log("Display Picture URL:", displayPictureUrl); // Debugging line
    const newProfile = new Profile({
      user: req.user._id,
      age,
      displayPicture: displayPictureUrl,
      address,
      phone,
      bio,
    });

    await newProfile.save();
    res.status(201).json(newProfile);
  } catch (err) {
    console.error("Error creating profile:", err);
    res.status(500).json({ message: err.message });
  }
};

export const updateProfile = async (req, res) => {
  console.log("Update Profile function called");
  console.log(req.file);
  console.log(req.body);
  try {
    const displayPictureUrl = req.file ? `/uploads/${req.file.filename}` : null;
   
    const { age,  address, phone, bio } = req.body;  
    console.log( age, displayPictureUrl, address, phone, bio);
    let userProfile = await Profile.findOne({ user: req.user._id });
    if (!userProfile) {
      return res.status(404).json({ message: "Profile not found" });
    } else {
      // Update existing profile
      userProfile.age = age || userProfile.age;
        userProfile.displayPicture = displayPictureUrl || userProfile.displayPicture;  
        userProfile.address = address || userProfile.address;  
        userProfile.phone = phone || userProfile.phone; 
        userProfile.bio = bio || userProfile.bio;  
      await userProfile.save();
    }
    const returnProfile = {
      age: userProfile.age,
      displayPicture: userProfile.displayPicture,
      address: userProfile.address,
      phone: userProfile.phone,
      bio: userProfile.bio,
    }

    res.json(returnProfile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  } 
};
// Verify user profile (admin only)
export const verifyUserProfile = async (req, res) => {
    const {userid} = req.body;
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ message: "Access denied" });
    const userProfile = await Profile.find({user : userid});
    if (!userProfile)
      return res.status(404).json({ message: "Profile not found" });
    userProfile.verified = true;
    await userProfile.save();
    res.json(userProfile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
