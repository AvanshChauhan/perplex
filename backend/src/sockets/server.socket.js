import { Server } from "socket.io";
let io
export function initialiseSocket(httpserver){
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    io= new Server(httpserver,{
        cors:{
            origin: clientUrl.split(",").map(u => u.trim()),
            credentials:true
        }
    })
    io.on("connection",(socket)=>{
        console.log("A user connected", +socket.id)
    })
}
export function getIO(){
    if(!io){
        throw new Error("socket io is not initialised")
    }
    return io
}