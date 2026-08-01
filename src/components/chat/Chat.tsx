import { Spinner } from "@/components/ui/spinner.tsx";
import { CHATS_ROUTE } from "@/router.tsx";
import { subscribeChatChanged } from "@/services/backend-event.ts";
import { DraftStorage } from "@/services/draft-storage.ts";
import { normalizeError } from "@/utilities/normalized-error.ts";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLoaderData, useNavigate, useParams } from 'react-router-dom';
import * as backend from "../../services/backend.ts";
import * as session from '../../services/session.ts';
import { AlertDestructive } from "../alert-destructive/AlertDestructive.tsx";
import './Chat.css';
import Header from "./header/Header.tsx";
import MessageInput from "./message-input/MessageInput.tsx";
import Message from "./message/Message.tsx";


export type MessageWithStatus = backend.Message & { status: "pending" | "error" };

export default function Chat() {
    const params = useParams<{ chatId: string }>();
    const navigate = useNavigate();
    const chat = useLoaderData<backend.Chat>();
    const rawUser = session.getUser();
    const bottomRef = useRef<HTMLDivElement>(null);
    const [pendingMsgs, setPendingMsgs] = useState<MessageWithStatus[]>([]);
    if (rawUser == null) {
        throw new Error("User not authenticated");
    }
    const user = rawUser;

    if (params?.chatId == null) {
        throw new Error("Missing chatId");
    }
    const chatId = params.chatId;
    
    // Fetching data from backend
    const {
        data: serverMessages = [], // Rename "data" to "messages" 
        isLoading,
        isError,
        error,
        refetch
    } = useQuery<backend.Message[]>({
        queryKey: ["messagesId", chatId],
        queryFn: () => backend.getMessages(chatId),
        enabled: !!user && !!chatId,
        refetchOnMount: "always"
    });

    useEffect(() => {
        const cleanup = subscribeChatChanged(chatId, (e) => {
            if (e.type == "roomChanged" && e.roomChange.type == "deleted") {
                navigate(CHATS_ROUTE);
            } else if (e.type == "messagesChanged") {
                refetch();
            }
        });
        return cleanup;
    }, [refetch, chatId]);

    useEffect(() => {
        const draftMsg = DraftStorage.getDraftMsg(chatId);
        // If there is any drafted message and its action is 'send', then send it to backend throughout sendMessageMutation
        if (draftMsg?.action == "send") {
            sendMessage(draftMsg.content);
            DraftStorage.removeDraftMsg(chatId);
        }
    }, []);

    useEffect(() => {
        if (serverMessages.length == 0) return;
        setPendingMsgs((oldPending) =>
            oldPending.filter(
                (pending) =>
                    !serverMessages.some(
                        (serverMsg) => serverMsg.uid === pending.uid
                    ),
            ),
        );
    }, [serverMessages]);

    //At first: Chat component Render -> DOM updated -> useLayoutEffect runs -> scroll -> PAINT 🎨 (The browser actually draws pixels on the screen so the user can see something.)
    useLayoutEffect(() => {
        bottomRef.current?.scrollIntoView({
            behavior: "auto"
        })
    }, [serverMessages.length, chatId]);

    const sendMessageMutation = useMutation({
        mutationFn: (params: { username: string, chat: backend.Chat, content: string, uid: string }) => {
            return backend.sendMessage(params);
        },
        //onMutate() runs immediately before mutationFn executes
        onMutate: ({ content, uid }) => {
            if (!pendingMsgs.some((pendingMsg) => pendingMsg.uid == uid)) {
                const msgObj: MessageWithStatus = {
                    sender: user,
                    content,
                    date: new Date(),
                    uid,
                    transactionId: uid,
                    status: "pending"
                }
                setPendingMsgs((oldPendingMsgs) => [...oldPendingMsgs, msgObj]);
            }
        },
        onError: (err, params) => {
            setPendingMsgs((oldPendingMsgs) => {
                return oldPendingMsgs.map((pendingMsg) => {
                    if (pendingMsg.uid === params.uid) {
                        return {
                            ...pendingMsg,
                            status: "error"
                        } as MessageWithStatus;
                    }
                    return pendingMsg;
                })
            });
            console.error("failed to send message", params, err);
        },
    });


    if (isError) {
        return (
            <div className="flex justify-center items-center h-full">
                <AlertDestructive title="Failed to load messages." description={normalizeError(error).message} />
            </div>
        );
    }

    function sendMessage(inputStr: string) {
        if (!inputStr.trim()) return;
        sendMessageMutation.mutate({
            username: user.username,
            chat: chat,
            content: inputStr,
            uid: crypto.randomUUID()
        });
    }

    function retryMessage(failedMsg: backend.Message) {
        // 1. change icon from error → pending
        setPendingMsgs((oldPendingMsgs) =>
            oldPendingMsgs.map((msg) => {
                if (msg.uid == failedMsg.uid) {
                    return { ...msg, status: "pending" }
                }
                return msg;
            })
        );

        // 2. resend same message to backend
        sendMessageMutation.mutate({
            username: user.userId,
            chat: chat,
            content: failedMsg.content,
            uid: failedMsg.transactionId!,
        })
    }

    return (
        <div className="flex flex-col chat-page">
            {/* <!-- Top: Header Section --> */}
            <Header chat={chat} />

            {/* <!-- Middle: Messages Section --> */}
            {
                isLoading ?
                    <Spinner className="flex-1 m-auto size-9 opacity-30" />
                    :
                    <div className="flex flex-col messages-area">
                        <div className="date-separator">TODAY</div>
                        {
                            serverMessages.map((message) =>
                                <Message user={user} chat={chat} message={message} key={message.eventId} status="success" retryMessage={retryMessage} />
                            )
                        }
                        {
                            pendingMsgs.filter((pendingMsg) =>
                                !serverMessages.some((serverMsg) => serverMsg.uid === pendingMsg.uid)
                            ).map((pendingMsg) =>
                                < Message user={user} chat={chat} message={pendingMsg} key={pendingMsg.uid} status={pendingMsg.status}
                                    retryMessage={retryMessage} />
                            )
                        }
                        <div ref={bottomRef}></div>
                    </div>
            }

            {/* <!-- Bottom: Input Section --> */}
            <MessageInput sendMessage={sendMessage} disabled={false} />
        </div>
    );
}
