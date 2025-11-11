import { Schema,model } from "mongoose";
import { UserProps} from "../types"
const UserSchama = new Schema<UserProps>({
    email:{
        type:"String",
        required:true,
        unique: true,
        lowercase:true,
        trimEnd: true
    },
    password:{
         type:"String",
        required:true,
    },
    name:{
         type:"String",
        required:true,
    },
    avatar:{
         type:"String",
    },
    created:{
        type: "Date",
        default :Date.now
    },
    bio:{
        type :"String",
        default : "Hey there! I am using  NexTalk"
    },
    isOnline: {
    type: Boolean,
    default: false,
    },
    lastSeen: {
    type: Date,
    default: null,
  },
})

export default model <UserProps> ("User", UserSchama);