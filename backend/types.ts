import { Document, Types } from "mongoose";

export interface UserProps extends Document {
  email: string;
  password: string;
  name?: string;
  avatar?: string;
  created?: Date;
  bio?:string;
  isOnline?:boolean,
  lastSeen:Date,
}

export interface ConversationProps extends Document {
  _id: Types.ObjectId;
  type: "direct" | "group";
  name?: string;
  participants: Types.ObjectId[];
  lastMessage?: Types.ObjectId;
  createdBy?: Types.ObjectId;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;

}
