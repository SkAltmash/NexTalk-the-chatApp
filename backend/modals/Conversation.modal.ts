import mongoose, { model, Schema } from "mongoose";
import { ConversationProps } from "../types";

const ConversationSchama = new Schema<ConversationProps>({
    type:{
        type:String,
        required :true,
        enum :["group","direct"],
    },
    name:String,
    participants:[{
        type: Schema.Types.ObjectId,
        ref:"User",
        required:true,
    }],
    lastMessage:{
        type: Schema.Types.ObjectId,
        ref:"Message"
    },
    createdBy:{
     type: Schema.Types.ObjectId,
     ref:"User"

    },
    avatar:{
        type:String,
        default:"",

    },
    createdAt:{
        type:Date,
        default:Date.now,
    },
     updatedAt:{
        type:Date,
        default:Date.now,
    }
})

ConversationSchama.pre("save",function(next){
    this.updatedAt = new Date();
    next();
})

export default model<ConversationProps>("Conversation",ConversationSchama);