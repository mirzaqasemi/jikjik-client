import { Spinner } from "@/components/ui/spinner.tsx";
import type { PendingMessage } from "@/models/pending-message";
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

export default function Chat() {
    const params = useParams<{ chatId: string }>();
    const navigate = useNavigate();
    const chat = useLoaderData<backend.Chat>();
    const rawUser = session.getUser();
    const bottomRef = useRef<HTMLDivElement>(null);
    if (rawUser === null) {
        throw new Error("User not authenticated");
    }
    const user = rawUser;

    if (params.chatId === undefined) {
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
            if (e.type === "roomChanged" && e.roomChange.type === "deleted") {
                navigate(CHATS_ROUTE);
            } else if (e.type === "messagesChanged") {
                refetch();
            }
        });
        return cleanup;
    }, [refetch, chatId, navigate]);

    // Once a pending message appears in serverMessages, it shouldn't be considered pending anymore.
    useEffect(() => {
        if (serverMessages.length === 0) return;

        PendingMessageStorage.updatePendingMsgs(chatId, (currentPendingMsgs) => {
            const newPendingMsgs = currentPendingMsgs.filter((currentPendingMsg) =>
                !serverMessages.some(serverMessage =>
                    serverMessage.transactionId === currentPendingMsg.transactionId)
            );
            //if nothing changed
            if (newPendingMsgs.length === currentPendingMsgs.length) {
                return currentPendingMsgs;
            }
            return newPendingMsgs;
        }
        );
    }, [serverMessages, chatId]);

    // Scroll before paint so the chat opens at the correct position without a visible jump.
    useLayoutEffect(() => {
        bottomRef.current?.scrollIntoView({
            behavior: "auto"
        })
    }, [serverMessages.length, chatId]);

    const sendMessageMutation = useMutation({
        mutationFn: (params: { chat: backend.Chat, content: string, transactionId: string }) => {
            return backend.sendMessage(params);
            // return Promise.reject(new Error("TEST: send failed"));
        },
        //onMutate() runs immediately before mutationFn executes
        onMutate: ({ content, transactionId }) => {
            const msgObj: PendingMessage = {
                content,
                date: new Date(),
                transactionId: transactionId,
                failed: false
            }
            PendingMessageStorage.updatePendingMsgs(chatId, (currentPendingMsgs) => {
                if (currentPendingMsgs.some((currentPendingMsg) => currentPendingMsg.transactionId === transactionId)) {
                    return currentPendingMsgs;
                }
                return [...currentPendingMsgs, msgObj]
            });
        },
        onError: (err, params) => {
            PendingMessageStorage.updatePendingMsgs(chatId, (currentPendingMsgs) => {
                const message: PendingMessage | undefined = currentPendingMsgs.find((currentPendingMsg) =>
                    currentPendingMsg.transactionId === params.transactionId
                );
                // newValue === current optimization in the storage won't catch the case where 
                // the message doesn't exist or is already "error"
                if (!message || message.failed) {
                    return currentPendingMsgs;
                }
                return currentPendingMsgs.map((currentPendingMsg) =>
                    currentPendingMsg.transactionId === params.transactionId
                        ? { ...currentPendingMsg, failed: true }
                        : currentPendingMsg
                );
            });
            console.error("failed to send message", params, err);
        },
    });

    const mutateSendMsg = sendMessageMutation.mutate;
    // Memoize sendMessage to prevent dependent effects from rerunning on every render.
    const sendMessage = useCallback((inputStr: string) => {
        if (!inputStr.trim()) return;
        mutateSendMsg({
            chat: chat,
            content: inputStr,
            transactionId: crypto.randomUUID()
        });
    }, [mutateSendMsg, chat]);

    useEffect(() => {
        const draftMsg = DraftStorage.getDraftMsg(chatId);
        // If there is any drafted message and its action is 'send', then send it to backend throughout sendMessageMutation
        if (draftMsg?.action === "send") {
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

    function retryMessage(failedMsg: PendingMessage) {
        // 1. change icon from error → pending
        PendingMessageStorage.updatePendingMsgs(chatId, (currentPendingMsgs) => {
            const newArr: PendingMessage[] = currentPendingMsgs.map((currentPendingMsg) => {
                if (currentPendingMsg.transactionId === failedMsg.transactionId) {
                    return { ...currentPendingMsg, failed: false }
                }
                return currentPendingMsg;
            });
            return newArr;
        });

        // 2. resend same message to backend
        mutateSendMsg({
            chat: chat,
            content: failedMsg.content,
            transactionId: failedMsg.transactionId,
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
                        <Message chat={chat} message={{
                            sender: message.sender,
                            content: message.content,
                            date: message.date
                        }} key={message.eventId} status={"success"} />)
                    }
                    {pendingMessages.filter((pendingMsg) =>
                        !serverMessages.some((serverMsg) => serverMsg.transactionId === pendingMsg.transactionId)
                    ).map((pendingMsg) =>
                        < Message chat={chat} message={{
                            content: pendingMsg.content,
                            date: pendingMsg.date
                        }} key={pendingMsg.transactionId} status={pendingMsg.failed ? "error" : "pending"}
                            retryMessage={() => retryMessage(pendingMsg)} />)
                    }
                    <div ref={bottomRef}></div>
                </div>
            }

            {/* <!-- Bottom: Input Section --> */}
            <MessageInput sendMessage={sendMessage} disabled={false} />
        </div>
    );
}
