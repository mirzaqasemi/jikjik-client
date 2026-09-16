import { Spinner } from "@/components/ui/spinner.tsx";
import { CHATS_ROUTE } from "@/router.tsx";
import { subscribeChatChanged } from "@/services/backend-event.ts";
import { DraftStorage } from "@/services/draft-storage.ts";
import { PendingMessageStorage } from "@/services/pending-message-storage.ts";
import { normalizeError } from "@/utilities/normalized-error.ts";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
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
    if (rawUser == null) {
        throw new Error("User not authenticated");
    }
    const user = rawUser;

    if (params?.chatId == null) {
        throw new Error("Missing chatId");
    }
    const chatId = params.chatId;
    const pendingMessages = PendingMessageStorage.usePendingMsgs(chatId);

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
    }, [refetch, chatId, navigate]);

    // Once a pending message appears in serverMessages, it shouldn't be considered pending anymore.
    useEffect(() => {
        if (pendingMessages === undefined || serverMessages.length === 0) return;
        const newPendingMsgs = pendingMessages.filter((pendingMsg) =>
            !serverMessages.some((serverMsg) => serverMsg.uid === pendingMsg.uid)
        ) ?? [];
        if (pendingMessages.length !== newPendingMsgs.length) {
            PendingMessageStorage.setPendingMsgs(chatId, newPendingMsgs);
        }
    }, [serverMessages, pendingMessages, chatId]);

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
            if (!pendingMessages?.some((pendingMsg) => pendingMsg.uid == uid)) {
                const msgObj: MessageWithStatus = {
                    sender: user,
                    content,
                    date: new Date(),
                    uid,
                    transactionId: uid,
                    status: "pending"
                }
                if (pendingMessages === undefined) {
                    return;
                }
                PendingMessageStorage.setPendingMsgs(chatId, [...pendingMessages, msgObj]);
            }
        },
        onError: (err, params) => {
            if (pendingMessages === undefined) {
                return;
            }
            const newArr: MessageWithStatus[] = pendingMessages?.map((pendingMsg) => {
                if (pendingMsg.uid === params.uid) {
                    return { ...pendingMsg, status: "error" }
                }
                return pendingMsg;
            });
            PendingMessageStorage.setPendingMsgs(chatId, newArr);
            console.error("failed to send message", params, err);
        },
    });

    const mutateSendMsg = sendMessageMutation.mutate;
    // useCallback lets you to cache a function definition between re-renders.
    // Without useCallback a new sendMessage function is created on every render. so the Effect can run again unnecessarily
    const sendMessage = useCallback((inputStr: string) => {
        if (!inputStr.trim()) return;
        mutateSendMsg({
            username: user.userId,
            chat: chat,
            content: inputStr,
            uid: crypto.randomUUID()
        });
    }, [mutateSendMsg, chat, user.userId]);

    useEffect(() => {
        const draftMsg = DraftStorage.getDraftMsg(chatId);
        // If there is any drafted message and its action is 'send', then send it to backend throughout sendMessageMutation
        if (draftMsg?.action == "send") {
            sendMessage(draftMsg.content);
            DraftStorage.removeDraftMsg(chatId);
        }
    }, [chatId, sendMessage]);

    if (isError) {
        return (
            <div className="flex justify-center items-center h-full">
                <AlertDestructive title="Failed to load messages." description={normalizeError(error).message} />
            </div>
        );
    }

    function retryMessage(failedMsg: backend.Message) {
        if (pendingMessages === undefined) {
            return;
        }
        // 1. change icon from error → pending
        const newArr: MessageWithStatus[] = pendingMessages.map((pendingMsg) => {
            if (pendingMsg.uid === failedMsg.uid) {
                return { ...pendingMsg, status: "pending" }
            }
            return pendingMsg;
        });
        PendingMessageStorage.setPendingMsgs(chatId, newArr);

        // 2. resend same message to backend
        mutateSendMsg({
            username: user.userId,
            chat: chat,
            content: failedMsg.content,
            uid: failedMsg.transactionId!,
        });
    }

    return (
        <div className="flex flex-col chat-page">
            {/* <!-- Top: Header Section --> */}
            <Header chat={chat} />

            {/* <!-- Middle: Messages Section --> */}
            {isLoading ?
                <Spinner className="flex-1 m-auto size-9 opacity-30" />
                :
                <div className="flex flex-col messages-area">
                    <div className="flex justify-center items-center date-separator bg-black/25 font-medium">Today</div>
                    {serverMessages.map((message) =>
                        <Message user={user} chat={chat} message={message} key={message.eventId} status="success" retryMessage={retryMessage} />)
                    }
                    {pendingMessages?.filter((pendingMsg) =>
                        !serverMessages.some((serverMsg) => serverMsg.uid === pendingMsg.uid)
                    ).map((pendingMsg) =>
                        < Message user={user} chat={chat} message={pendingMsg} key={pendingMsg.uid} status={pendingMsg.status}
                            retryMessage={retryMessage} />)
                    }
                    <div ref={bottomRef}></div>
                </div>
            }

            {/* <!-- Bottom: Input Section --> */}
            <MessageInput sendMessage={sendMessage} disabled={false} />
        </div>
    );
}
