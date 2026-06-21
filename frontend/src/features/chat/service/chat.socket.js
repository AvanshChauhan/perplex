import {io} from "socket.io-client"

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "";

export const initialiseSocketConnection=()=>{
    const socket=io(SOCKET_URL,{
        withCredentials:true,
        autoConnect: true,
    })
    socket.on("connect",()=>{
        console.log("connected to socket.io server")
    })
    return socket
}
