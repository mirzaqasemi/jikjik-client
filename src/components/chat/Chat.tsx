import { Spinner } from "@/components/ui/spinner.tsx";
import { useIsUserBlocked } from "@/hooks/useIsUserBlocked.ts";
import { useUnblockUser } from "@/hooks/useUnblockUser.ts";
import type { PendingMessage } from "@/models/pending-message";
import { CHATS_ROUTE } from "@/router.tsx";
import { subscribeChatChanged } from "@/services/backend-event.ts";
import * as backend from "@/services/backend.ts";
import { DraftStorage } from "@/services/draft-storage.ts";
import { PendingMessageStorage } from "@/services/pending-message-storage.ts";
import * as session from '@/services/session.ts';
import { normalizeError } from "@/utilities/normalized-error.ts";
import { useMutation, useQuery } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { useLoaderData, useNavigate, useParams, useRevalidator } from 'react-router-dom';
import { AlertDestructive } from "../alert-destructive/AlertDestructive.tsx";
import { Button } from "../ui/button.tsx";
import './Chat.css';
import Header from "./header/Header.tsx";
import MessageInput from "./message-input/MessageInput.tsx";
import Message from "./message/Message.tsx";

export default function Chat() {
    const revalidator = useRevalidator();
    const params = useParams<{ chatId: string }>();
    const navigate = useNavigate();
    const chat = useLoaderData<backend.Chat>();
    const rawUserId = session.getUserId();
    const bottomRef = useRef<HTMLDivElement>(null);
    if (rawUserId === null) {
        throw new Error("User not authenticated");
    }
    const currentUserId = rawUserId;

    if (params.chatId === undefined) {
        throw new Error("Missing chatId");
    }
    const chatId = params.chatId;
    const pendingMessages = PendingMessageStorage.usePendingMsgs(chatId);
    const otherUserId = chat.isDm
        ? chat.users.find((user) => user.userId != currentUserId)?.userId
        : undefined;
    const {
        data: isBlocked,
        isPending
    } = useIsUserBlocked(otherUserId);
    const unblockUser = useUnblockUser();
    const {
        data: serverMessages = [], // Rename "data" to "serverMessages" 
        isLoading,
        isError,
        error,
        refetch
    } = useQuery<backend.Message[]>({
        queryKey: ["messagesId", chatId],
        queryFn: () => backend.getMessages(chatId),
        refetchOnMount: "always"
    });

    useEffect(() => {
        const cleanup = subscribeChatChanged(chatId, (e) => {
            if (e.type === "roomChanged" && e.roomChange.type === "deleted") {
                navigate(CHATS_ROUTE);
            } else if (e.type === "messagesChanged") {
                refetch();
            } else if (e.type === "roomChanged") {
                // manually re-run the active route loaders
                revalidator.revalidate();
            }
        });
        return cleanup;
    }, [refetch, chatId, navigate, revalidator]);

    // Once a pending message appears in serverMessages, it shouldn't be considered pending anymore.
    useEffect(() => {
        if (serverMessages.length === 0) return;

        PendingMessageStorage.updatePendingMsgs(chatId, (currentPendingMsgs) => {
            const newPendingMsgs = currentPendingMsgs.filter((currentPendingMsg) =>
                !serverMessages.some(serverMessage =>
                    serverMessage.transactionId === currentPendingMsg.transactionId)
            );
            // Avoid notifying subscribers when reconciliation changes nothing.
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
        },
        //onMutate() runs immediately before mutationFn executes
        onMutate: ({ content, transactionId }) => {
            const msgObj: PendingMessage = {
                content,
                date: new Date(),
                transactionId,
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
            return currentPendingMsgs.map((currentPendingMsg) => {
                if (currentPendingMsg.transactionId === failedMsg.transactionId) {
                    return { ...currentPendingMsg, failed: false }
                }
                return currentPendingMsg;
            });
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
                    {serverMessages.map((serverMsg) => {
                        const message = {
                            sender: serverMsg.sender,
                            content: serverMsg.content,
                            date: serverMsg.date,
                        };
                        return (
                            <Message
                                key={serverMsg.eventId}
                                currentUserId={currentUserId}
                                chat={chat}
                                message={message}
                                status="success"
                            />
                        );
                    })}

                    {pendingMessages.filter((pendingMsg) =>
                        !serverMessages.some((serverMsg) => serverMsg.transactionId === pendingMsg.transactionId)
                    ).map((pendingMsg) => {
                        const message = {
                            content: pendingMsg.content,
                            date: pendingMsg.date,
                        };
                        if (pendingMsg.failed) {
                            return (
                                <Message
                                    key={pendingMsg.transactionId}
                                    currentUserId={currentUserId}
                                    chat={chat}
                                    message={message}
                                    status="error"
                                    retryMessage={() => retryMessage(pendingMsg)}
                                />
                            );
                        }
                        return (
                            <Message
                                key={pendingMsg.transactionId}
                                currentUserId={currentUserId}
                                chat={chat}
                                message={message}
                                status="pending"
                            />
                        );
                    })}
                    <div ref={bottomRef}></div>
                </div>
            }

            {/* <!-- Bottom: Input Section --> */}
            {/* wait until determine if otherUser is blocked or not */}
            {chat.isDm && isPending ? (
                <LoaderCircle className="size-5 animate-spin" />
            ) : chat.isDm && isBlocked ? (
                <div className="flex justify-center bg-background border-t h-12!">
                    <Button
                        variant="ghost"
                        disabled={unblockUser.isPending}
                        onClick={() => unblockUser.mutate(otherUserId!)}
                        className="w-full h-full rounded-none text-destructive border-0! hover:text-destructive"
                    >
                        UNBLOCK
                    </Button>
                </div>

            ) : (
                <MessageInput sendMessage={sendMessage} disabled={false} />
            )}
        </div>
    );
}
