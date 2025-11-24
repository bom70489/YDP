import jwt from 'jsonwebtoken';
import userModel from '../model/userModel.js';

const authUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.id); 
    if (!user) return res.status(401).json({ success: false, message: "User not found" });

    req.user = user; 
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export default authUser;
