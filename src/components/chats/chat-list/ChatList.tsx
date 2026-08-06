import ConfirmationDialog from "@/components/confirmation-dialog/ConfirmationDialog";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuGroup,
    ContextMenuItem,
    ContextMenuTrigger
} from "@/components/ui/context-menu";
import * as backend from "@/services/backend.ts";
import { normalizeError } from "@/utilities/normalized-error";
import * as utils from "@/utilities/utilities";
import { useMutation } from "@tanstack/react-query";
import {
    TrashIcon
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import './ChatList.css';

type Params = {
    chats: backend.Chat[],
    onSelect: (chat: backend.Chat) => void
}

export default function ChatList(params: Params) {
    const navigate = useNavigate();
    const [chatToDelete, setChatToDelete] = useState<backend.Chat | null>(null);

    const deleteChatMutation = useMutation({
        mutationFn: (params: { chatId: string }) => backend.deleteRoom(params.chatId),
        onSuccess: () => {
            setChatToDelete(null);
        },
        onError: (err) => {
            toast.error(normalizeError(err).message);
            console.error(err);
        },
    });

    function deleteChat() {
        if (chatToDelete != null) {
            deleteChatMutation.mutate({ chatId: chatToDelete.id })
        }
    }


    return (

        <div className="overflow-auto mt-8 px-4 chat-list">
            {
                params.chats.map(chat => (
                    <ContextMenu key={chat.id}>
                        {/* ContextMenuTrigger: detects right-click or long-press */}
                        <ContextMenuTrigger asChild>
                            <button onClick={() => params.onSelect(chat)} key={chat.id} className="flex m-auto h-18 items-center w-full chat-item select-none">
                                <div className="relative h-10 w-10 shrink-0">
                                    <img src="https://i.pravatar.cc/150?img=11" alt="David" className="h-full w-full rounded-full object-cover" />
                                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-chart-2  border-2 border-white" aria-label="Online" />
                                </div>
                                <div className="flex-1 pb-2.5 pt-2.5 ml-3 truncate chat-info">
                                    <div className="flex label-row">
                                        <div className="chat-name">{chat.title}</div>
                                        <span className="text-muted-foreground chat-meta unread-time">{utils.formatDate(chat.lastMsg?.date)}</span>
                                    </div>
                                    <div className="flex label-row">
                                        <div className="chat-preview unread-text">{chat.lastMsg != null ? chat.lastMsg.content
                                            : chat.isDm ?
                                                `Do you want to chat with`
                                                : `Do you want to join`}
                                            <span className="font-medium">{` `}{chat.title}</span>
                                        </div>
                                        <div className="w-4 h-4 flex justify-center rounded-full shrink-0 unread-badge">2</div>
                                    </div>
                                </div>
                            </button>
                        </ContextMenuTrigger>

                        {/* ContextMenuContent: opens and displays the popup menu */}
                        <ContextMenuContent onContextMenu={(event) => event.preventDefault()}>
                            <ContextMenuGroup>
                                <ContextMenuItem
                                    onSelect={() => setChatToDelete(chat)}
                                    variant="destructive">
                                    <TrashIcon />
                                    Delete
                                </ContextMenuItem>
                            </ContextMenuGroup>
                        </ContextMenuContent>
                    </ContextMenu>
                ))
            }
            {/* Shared confirmation dialog */}

            <ConfirmationDialog title={"Delete chat?"} description={`This will permanently delete this chat conversation. Are you sure you want to delete chat with ${chatToDelete?.title}?`}
                open={chatToDelete != null} loading={deleteChatMutation.isPending} onConfirm={deleteChat} onClose={() => setChatToDelete(null)} />

        </div>
    );
}
