import profile from "../models/profile";
import user from "../models/user";

// Get user profile
export const getMyProfile = async (req, res) => {
  try { 
    const userProfile = await profile.findOne({ user: req.user._id }).populate("user", "name email role speciality");
    if (!userProfile) return res.status(404).json({ message: "Profile not found" });
    res.json(userProfile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  } 
};

// Create or update user profile
export const upsertMyProfile = async (req, res) => {
  try {
    const { age, displayPicture, address, phone, bio } = req.body;  
    let userProfile = await profile.findOne({ user: req.user._id });
    if (userProfile) {
      // Update existing profile
      userProfile.age = age || userProfile.age;
        userProfile.displayPicture = displayPicture || userProfile.displayPicture;  
        userProfile.address = address || userProfile.address;  
        userProfile.phone = phone || userProfile.phone;  
        userProfile.bio = bio || userProfile.bio;  
      await userProfile.save();
    } else {
      // Create new profile
      userProfile = new profile({
        user: req.user._id,
        age,
        displayPicture,
        address,
        phone,
        bio,
      });
      await userProfile.save();
    }
    res.json(userProfile);
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
    const userProfile = await profile.find({user : userid});
    if (!userProfile)
      return res.status(404).json({ message: "Profile not found" });
    userProfile.verified = true;
    await userProfile.save();
    res.json(userProfile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
