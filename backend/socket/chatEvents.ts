import { Server as SocketIOServer, Socket } from "socket.io";
import Conversation from "../modals/Conversation.modal";
import mongoose from "mongoose";
import Message from "../modals/Message.modal"
export function registerChatEvents(io: SocketIOServer, socket: Socket) {
  
  socket.on("getConversation" , async () =>{
    console.log("📨  featching  conversetion");

    try {
       const userId = socket.data.userId;
         if (!userId) {
        return socket.emit("getConversation", {
          success: false,
          msg: "User not authenticated",
        });
      }
     const userObjectId = new mongoose.Types.ObjectId(userId);

      const conversation = await Conversation.find({
        participants:userObjectId
      }).sort({createdAt : -1}).populate({
        path:"lastMessage",
        select:"senderId content attachement createdAt",

      }).populate("participants", "name avatar email").lean();

      socket.emit('getConversation',{
        success:true,
        data:conversation
      })
       
    } catch (error :any) {
       console.error("❌ Error featching conversation:", error);
      socket.emit("getConversation", {
        success: false,
        msg: "Error featching conversation",
      });
    }
  })


  socket.on("newConversation", async (data) => {
    console.log("📨 newConversation event received:", data);

    try {
      const { type, participants, name, avatar } = data;
      const userId = socket.data.userId;

      if (!userId) {
        return socket.emit("newConversation", {
          success: false,
          msg: "User not authenticated",
        });
      }

      // ✅ Handle direct chat
      if (type === "direct") {
        const existingConversation = await Conversation.findOne({
          type: "direct",
          participants: { $all: participants, $size: 2 },
        })
          .populate("participants", "name avatar email")
          .lean();

        if (existingConversation) {
          return socket.emit("newConversation", {
            success: true,
            data: { ...existingConversation, isNew: false },
          });
        }

        const conversation = await Conversation.create({
          type,
          participants,
          name: "",
          avatar: "",
          createdBy: userId,
        });

        const connectedSockets = Array.from(io.sockets.sockets.values()).filter(
          (s) => participants.includes(s.data.userId)
        );
        connectedSockets.forEach((s) => s.join(conversation._id.toString()));

        const populated = await Conversation.findById(conversation._id)
          .populate("participants", "name avatar email")
          .lean();

        return io.to(conversation._id.toString()).emit("newConversation", {
          success: true,
          data: { ...populated, isNew: true },
        });
      }

      // ✅ Handle group chat
      if (type === "group") {
        console.log("🟢 Creating group chat...");

        const conversation = await Conversation.create({
          type: "group",
          participants,
          name: name || "New Group",
          avatar: avatar || "",
          createdBy: userId,
        });

        // Join group room for all participants
        const connectedSockets = Array.from(io.sockets.sockets.values()).filter(
          (s) => participants.includes(s.data.userId)
        );
        connectedSockets.forEach((s) => s.join(conversation._id.toString()));

        const populated = await Conversation.findById(conversation._id)
          .populate("participants", "name avatar email")
          .lean();

        if (!populated) {
          throw new Error("Failed to populate group conversation");
        }

        // Notify all participants
        io.to(conversation._id.toString()).emit("newConversation", {
          success: true,
          data: { ...populated, isNew: true },
        });
      }
    } catch (error) {
      console.error("❌ Error creating conversation:", error);
      socket.emit("newConversation", {
        success: false,
        msg: "Error creating conversation",
      });
    }
  });

 socket.on("newMessage", async (data) => {
  console.log("💬 newMessage event received:", data);

  try {
    // 1️⃣ Create new message in DB
    const message = await Message.create({
      conversationId: data.conversationId,
      senderId: data.sender.id,
      content: data.content,
      attachement: data.attachement,
    });

    // 2️⃣ Update lastMessage in conversation
    await Conversation.findByIdAndUpdate(data.conversationId, {
      lastMessage: message._id,
    });

    // 3️⃣ Emit new message to all participants in that conversation room
    io.to(data.conversationId).emit("newMessage", {
      success: true,
      data: {
        id: message._id,
        content: data.content,
        sender: {
          id: data.sender.id,
          name: data.sender.name,
          avatar: data.sender.avatar,
        },
        attachement: data.attachement,
        createdAt: new Date().toISOString(),
        conversationId: data.conversationId,
      },
    });
  } catch (error) {
    console.error("❌ Error sending message:", error);
    socket.emit("newMessage", {
      success: false,
      msg: "Error sending message",
    });
  }
});



socket.on("getMessages", async (data: { conversationId: string }) => {
  console.log("💬 Fetching messages for conversation:", data.conversationId);

  try {
    const messages = await Message.find({ conversationId: data.conversationId })
  .sort({ createdAt: -1 })
  .populate("senderId", "name avatar")
  .lean();

const messagesWithSender = messages.map((msg: any) => ({
  id: msg._id,
  content: msg.content,
  attachement: msg.attachement,
  createdAt: msg.createdAt,
  sender: {
    id: msg.senderId?._id || msg.senderId, // Fallback if not populated
    name: (msg.senderId as any)?.name || "Unknown",
    avatar: (msg.senderId as any)?.avatar || null,
  },
}));
    socket.emit("getMessages", {
      success: true,
      data: messagesWithSender,
    });
  } catch (error) {
    console.error("❌ Error fetching messages:", error);
    socket.emit("getMessages", {
      success: false,
      msg: "Error fetching messages",
    });
  }
});


}
