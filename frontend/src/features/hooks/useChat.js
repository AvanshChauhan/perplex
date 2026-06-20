import { initialiseSocketConnection } from "../chat/service/chat.socket";
import { useMemo } from "react";

export const useChat=()=>{
    return useMemo(() => ({ initialiseSocketConnection }), []);
}
