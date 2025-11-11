import { Server as SocketIOServer, Socket } from "socket.io";
import User from "../modals/User.modals"
import {generateToken} from "../utils/token"

export function registerUserEvents( io : SocketIOServer , socket : Socket){
   socket.on('updateProfile', async (data :{name?:string, avatar?:string, bio?:string})=>{
    console.log("up" , data);


    const userId = socket.data.userId;
    if(!userId){
        return socket.emit('updateProfile',{
            success:false, msg:"user not login"
        })
    }
    try {
        const updateUser =  await User.findByIdAndUpdate(userId,{name : data.name , avatar : data.avatar , bio:data.bio},{new: true});
        if(!updateUser){
             return socket.emit('updateProfile',{
            success:false, msg:"user not found"
        })
        }
       const newToken = generateToken(updateUser);
        return socket.emit('updateProfile',{
            success:true, 
            data:{token :newToken},
            msg:"profile upadated succefully"
        })

    } catch (error) {
        console.log("error in upadting pofile " , error)
         return socket.emit('updateProfile',{
            success:false, msg:"error in upadting pofile"
        })
    }
   })



  socket.on("getContact", async () => {
    try {
      const userId = socket.data.userId;
      if (!userId) {
        return socket.emit("getContact", {
          success: false,
          msg: "user not logged in",
        });
      }

      const users = await User.find({ _id: { $ne: userId } }, { password: 0 }).lean();

      const contacts = users.map((user: any) => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar || "",
      }));

      return socket.emit("getContact", {
        success: true,
        data: contacts,
      });
    } catch (error) {
      console.log("error getting contacts:", error);
      return socket.emit("getContact", {
        success: false,
        msg: "error getting contacts",
      });
    }
  });
}