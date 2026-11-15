import emptyGif from "@/assets/icons8-ghost.gif";
import { AlertDestructive } from "@/components/alert-destructive/AlertDestructive";
import { Spinner } from "@/components/ui/spinner";
import { subscribeDraftDmResolved } from "@/services/backend-event.ts";
import * as backend from "@/services/backend.ts";
import * as DraftStorage from "@/services/draft-storage";
import * as session from "@/services/session";
import { normalizeError } from "@/utilities/normalized-error";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import '../Chat.css';
import Header from "../header/Header";
import MessageInput from "../message-input/MessageInput";

export default function Draft() {
    const [disabled, setDisabled] = useState(false);
    const navigate = useNavigate();
    const userId = session.getUserId();
    const contact = DraftStorage.getDraftDm();

    const {
        data: user,
        isPending,
        isError,
        error
    } = useQuery({
        queryKey: ["userId", userId],
        queryFn: backend.currentUser,
        enabled: userId !== null && contact !== null,
    });

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

    if (userId === null) {
        throw new Error("User not found");
    }

    if (contact === null) {
        throw new Error("Contact not found");
    }

    const profileUnavailable = isError || user == null;
    const currentUser = user ?? backend.userFromUserId(userId);
    const chat: backend.Chat = {
        id: "",
        isDm: true,
        isPublic: false,
        title: contact.displayName,
        users: [contact, currentUser],
        lastMsg: null,
        avatarUrl: contact.avatarUri,
        canonicalAlias: "",
        creator: "",
        encrypted: false,
        encryptionAlgorithm: "",
        roomVersion: "",
        topic: ""
    };

    function sendMessage(inputStr: string) {
        if (disabled || profileUnavailable || contact === null) {
            return;
        }
        setDisabled(true);
        createDmMutation.mutate({
            contactUsername: contact.userId,
            inputStr: inputStr
        });
    }

    return (
        <div className="flex flex-col w-full h-full">
            <Header chat={chat} />
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4">
                {isPending || createDmMutation.isPending ? (
                    <Spinner className="size-9 opacity-30" />
                ) : profileUnavailable ? (
                    <AlertDestructive
                        title="Could not load your profile."
                        description={isError ? normalizeError(error).message : "User not found."}
                    />
                ) : (
                    <div className="flex flex-col justify-center items-center gap-1 w-62.5 lg:w-75 py-7 px-3 rounded-4xl text-xl bg-black/40 text-white">
                        <div className="text-[14px] font-medium tracking-wider">No messages here yet...</div>
                        <span className="text-[14px] font-light tracking-wider">Send a message</span>
                        <img src={emptyGif} alt="No messages" />
                    </div>
                )}
            </div>

            <MessageInput
                sendMessage={sendMessage}
                disabled={disabled || profileUnavailable}
                keepInputOnSend={true}
            />
        </div>
    );
}
