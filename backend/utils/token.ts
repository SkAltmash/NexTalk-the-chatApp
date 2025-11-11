import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
import { UserProps } from "../types";


export const generateToken = (user: UserProps) => {
  const payload = {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      bio:user.bio,
    },
  };

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in .env");
  }

  return jwt.sign(payload, secret, { expiresIn: "7d" });
};
