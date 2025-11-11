import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../modals/User.modals";
import { generateToken } from "../utils/token";

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password, name, avatar } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ success: false, msg: "User already exists" });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      email,
      password: hashedPassword,
      name,
      avatar: avatar || "",
      bio : "",
    });

    await newUser.save();

    // Generate JWT token
   const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      msg: "User registered successfully",
      user: {
        id: newUser._id, 
        name: newUser.name,
        email: newUser.email,
        avatar: newUser.avatar,
      },
      token,
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};


export const loginUser = async (req: Request, res: Response): Promise<void> => {
   const {email , password} = req.body;
   try {

    const user = await User.findOne({email});
    if(!user)
    {
         res.status(400).json({ success: false, msg: "Invalide data" });
         return;
    }
   const isMatch = await bcrypt.compare(password, user.password); // ✅ add await
    if(!isMatch){
    res.status(400).json({ success: false, msg: "Invalid data" });
    return;
   }
    const token = generateToken(user);
    res.status(201).json({
      success: true,
      msg: "login successfully",
      token,
    });   } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
}
