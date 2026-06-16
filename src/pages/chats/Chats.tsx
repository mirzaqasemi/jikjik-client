import ChatsComponent from "@/components/chats/Chats";
import { Outlet, useParams } from "react-router-dom";
import './Chats.css'

export default function Chats() {
    const params = useParams();
    const chatId = params.chatId;
    return (
        <div className="flex w-full h-full">
            {/* <div className="hidden chat-background lg:flex lg:h-full lg:w-[75%] items-center">
                <div className="chat-background-content w-full ">
                    <Outlet />
                </div>
            </div> */}

            <div className={`w-full h-full 
                ${chatId ? "hidden lg:block" : "block"}
                lg:w-[25%] lg:border-r`}>
                <ChatsComponent />
            </div>
            <div className={`chat-background w-full items-center justify-center
                ${chatId ? "flex" : "hidden lg:flex"} 
                lg:w-[75%]`}>
                <div className="chat-background-content w-full">
                    <Outlet />
                </div>
            </div>


        </div>
    );
}