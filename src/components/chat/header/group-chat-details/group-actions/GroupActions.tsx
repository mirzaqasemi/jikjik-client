import { LogOut, Settings2 } from "lucide-react";
import ChatActionButton from "../../chat-action-button/ChatActionButton";


export default function GroupActions() {
    return (
        <div className="flex gap-4">
            <ChatActionButton title="Manage" onClickAction={() => "salam"} icon={Settings2} />
            <ChatActionButton title="Leave" onClickAction={() => "salam"} icon={LogOut} />
        </div>
    );
}