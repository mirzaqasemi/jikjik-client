import ChatsComponent from "@/components/chats/Chats";
import { Outlet, useLocation, useParams } from "react-router-dom";
import './Chats.css'

export default function Chats() {
    const params = useParams();
    const chatId = params.chatId;
    const location = useLocation();
    const draftMode = location.pathname.split("/").pop();

    return (
        <div className="flex w-full h-full">

            {/* Left Section */}
            <div className={`w-full h-full 
                ${chatId || ((draftMode === "draft")) ? "hidden lg:block" : "block"}
                lg:w-[25%] lg:border-r`}>
                <ChatsComponent />
            </div>

            {/* Right Section */}
            <div className={`${(chatId || (draftMode === "draft")) ? "flex" : "hidden lg:flex"} 
                            chat-background w-full h-full items-center justify-center lg:w-[75%]`}>
                <div className="chat-background-content flex w-full h-full items-center justify-center">
                    {/* “Render my matched child route here(inside <Outlet/>).” */}
                    <Outlet />
                </div>
            </div>
        </div>
    );
}