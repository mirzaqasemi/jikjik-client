import { useNavigate } from "react-router-dom";
import * as backend from "@/services/backend.ts";
import * as utils from "@/utilities/utilities";


type Params = {
    chats: backend.Chat[],
    onSelect: () => void
}

export default function ChatList(params: Params) {
    const navigate = useNavigate();
    return (
        <div className="overflow-auto mt-8 px-4 chat-list">
            {
                params.chats.map(chat => (
                    <button onClick={() => {
                        if (chat.membership === "invite") {
                            navigate(`/chats/${chat.id}/invite`);
                        }
                        else if (chat.membership === "join") {
                            navigate(`/chats/${chat.id}`)
                        };
                        params.onSelect();
                    }
                    } key={chat.id} className="flex m-auto h-18 items-center w-full chat-item">
                        <div className="relative h-10 w-10 shrink-0">
                            <img src="https://i.pravatar.cc/150?img=11" alt="David" className="h-full w-full rounded-full object-cover" />
                            {/* {username.img != null && <img src={username.img} alt="David" class="avatar"/>} */}
                            {/* {chat.img != null && <img src={chat.img} alt="David" class="avatar" />} */}
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-chart-2  border-2 border-white" aria-label="Online" />
                        </div>
                        <div className="flex-1 pb-2.5 pt-2.5 ml-3 border-b truncate chat-info">
                            <div className="flex label-row">
                                <div className="chat-name">{utils.getTitle(chat)}</div>
                                <span className="text-muted-foreground chat-meta unread-time">{utils.formatDate(chat.lastMsg?.date)}</span>
                            </div>
                            <div className="flex label-row">
                                <div className="chat-preview unread-text">{chat.lastMsg?.content}</div>
                                <div className="w-4 h-4 flex justify-center rounded-full shrink-0 unread-badge">2</div>
                            </div>
                        </div>
                    </button>
                ))
            }
        </div>
    );
}