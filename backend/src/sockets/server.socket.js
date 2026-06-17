import { Server } from "socket.io";
let io
export function initialiseSocket(httpserver){
    io= new Server(httpserver,{
        cors:{
            origin:"http://localhost:5173",
            credentials:true
        }
    })
    io.on("connection",(socket)=>{
        console.log("A user connected",+socket.id)
    })
}
export function getIO(){
    if(!io){
        throw new Error("socket io is not initialised")
    }
    return io
}