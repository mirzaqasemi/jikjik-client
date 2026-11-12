import emptyGif from "@/assets/icons8-ghost.gif";
import { Spinner } from "@/components/ui/spinner";
import { subscribeDraftDmResolved } from "@/services/backend-event.ts";
import * as backend from "@/services/backend.ts";
import * as DraftStorage from "@/services/draft-storage";
import * as session from "@/services/session";
import { normalizeError } from "@/utilities/normalized-error";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import '../Chat.css';
import Header from "../header/Header";
import MessageInput from "../message-input/MessageInput";

export default function Draft() {
    const [disabled, setDisabled] = useState(false)
    const navigate = useNavigate();
    const rawUser = session.getUserId();
    const rawContact = DraftStorage.getDraftDm();
    if (rawUser === null) {
        throw new Error("User not found");
    }
    const user = rawUser;
    if (rawContact === null) {
        throw new Error("Contact not found");
    }
    const contact = rawContact;
    const chat: backend.Chat = {
        id: "",
        isDm: true,
        isPublic: false,
        title: contact?.displayName,
        users: [contact, user],
        lastMsg: null,
        avatarUrl: contact?.avatarUri,
        canonicalAlias: "",
        creator: "",
        encrypted: false,
        encryptionAlgorithm: "",
        roomVersion: "",
        topic: ""
    };

    //If the user on the other side sends a message, the app navigates to the specific `roomId` and a chat component is created.
    useEffect(() => {
        const cleanup = subscribeDraftDmResolved((e) => {
            navigate(`/chats/${e.roomId}`);
        });
        return cleanup;
    }, [navigate]);

    // When the user sends a msg, this hook runs first
    const createDmMutation = useMutation({
        mutationFn: async (params: { contactUsername: string, inputStr: string }) => {
            return await backend.createDm(params.contactUsername);
        },
        onSuccess: (data, params) => {
            DraftStorage.draftMsg(data.id, params.inputStr, "send");
            navigate(`/chats/${data.id}`);
        },
        onError: (error) => {
            setDisabled(false);
            toast.error(normalizeError(error).message);
        },
    });

    async function sendMessage(inputStr: string) {
        setDisabled(true);
        createDmMutation.mutate({
            contactUsername: contact.userId,
            inputStr: inputStr
        });
    }

    return (
        <div className="flex flex-col w-full h-full">
            <Header chat={chat} />
            <div className="flex flex-col h-full items-center justify-center rounded-xl">
                {createDmMutation.isIdle &&
                    <div className="flex flex-col justify-center items-center gap-1 w-62.5 lg:w-75 py-7 px-3 rounded-4xl text-xl bg-black/40 text-white">
                        <div className="text-[14px] font-medium tracking-wider">No messages here yet...</div>
                        <span className="text-[14px] font-light tracking-wider">Send a message</span>
                        <img src={emptyGif} alt="No messages" />
                    </div>
                }
                {createDmMutation.isPending &&
                    <Spinner className="flex-1 m-auto size-9 opacity-30" />
                }
            </div>
            <MessageInput sendMessage={sendMessage} disabled={disabled} keepInputOnSend={true} />
        </div>
    );
}
