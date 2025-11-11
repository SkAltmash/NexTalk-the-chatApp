import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./cofig/bd";
dotenv.config();
import authRoutes from "./routes/auth.routes"
import { initializeSocket } from "./socket/socket";
const app = express();
app.use(cors());
app.use(express.json());

app.use("/auth",authRoutes)
const server = http.createServer(app);
const PORT = process.env.PORT || 8000;


initializeSocket(server);
connectDB().then(()=>{
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
}).catch((err)=>{
    console.log(err);
})
