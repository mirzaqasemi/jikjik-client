import emptyGif from "@/assets/icons8-ghost.gif";
import { Spinner } from "@/components/ui/spinner";
import { subscribeBackendEvent } from "@/services/backend-event.ts";
import * as backend from "@/services/backend.ts";
import * as session from "@/services/session";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { MessageWithStatus } from "../Chat";
import Header from "../header/Header";
import MessageInput from "../message-input/MessageInput";
import Message from "../message/Message";

export default function Draft() {
    const navigate = useNavigate();
    const [pendingMsgs, setPendingMsgs] = useState<MessageWithStatus[]>([]);
    const rawUser = session.getUser();
    const rawContact = session.getDraftDm();
    if (rawUser == null) {
        throw new Error("User not found");
    }
    const user = rawUser;
    if (rawContact == null) {
        throw new Error("Contact not found");
    }
    const contact = rawContact;
    const selectedChat: backend.Chat = {
        id: "",
        title: contact?.displayName,
        users: [contact, user],
        lastMsg: null,
        avatarUrl: contact?.avatarUrl,
        canonicalAlias: "",
        creator: "",
        encrypted: false,
        encryptionAlgorithm: "",
        roomVersion: "",
        topic: ""
    };

    useEffect(() => {
        return subscribeBackendEvent("draftDmResolved", (e) => {
            navigate(`/chats/${e.roomId}`);
        });
    }, []);

    // When the user sends msg, this hook runs first
    const createDmMutation = useMutation({
        mutationFn: async (params: { contactUsername: string, inputStr: string }) => {
            return await backend.createDm(params.contactUsername);
        },
        onSuccess: (data, params) => {
            sendMessageMutation.mutate({
                chat: data,
                content: params.inputStr,
                uid: user.userId,
                transactionId: user.userId
            })
        },
    });

    // When the user sends msg, this hook is run when the createDmMutation hook is done! 
    const sendMessageMutation = useMutation({
        mutationFn: (params: { chat: backend.Chat, content: string, uid: string, transactionId: string }) => {
            return backend.sendMessage(params);
        },
        onMutate: (params) => {
            const msgObj: MessageWithStatus = {
                sender: user,
                content: params.content,
                date: new Date(),
                uid: params.uid,
                transactionId: params.transactionId,
                status: "pending"
            }
            setPendingMsgs((oldPendingMsgs) => [...oldPendingMsgs, msgObj]);
        },
        onSuccess: (data, params) => {
            navigate(`/chats/${params.chat.id}`);
        }
    });

    async function sendMessage(inputStr: string) {
        createDmMutation.mutate({
            contactUsername: contact.userId,
            inputStr: inputStr
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
    }

    const bottomRef = useRef<HTMLDivElement>(null);
    //At first: Chat component Render -> DOM updated -> useLayoutEffect runs -> scroll -> PAINT 🎨 (The browser actually draws pixels on the screen so the user can see something.)
    useLayoutEffect(() => {
        bottomRef.current?.scrollIntoView({
            behavior: "auto"
        })
    }, []);


    return (
        <div className="flex flex-col w-full h-full">
            <Header selectedChat={selectedChat} />
            <div className="flex flex-col h-full items-center justify-center rounded-xl">
                {
                    createDmMutation.isIdle &&
                    <div className="flex flex-col justify-center items-center gap-1 w-[250px] lg:w-[300px] py-7 px-3 rounded-4xl text-xl bg-black/40 text-white">
                        <div className="text-[14px] font-medium tracking-wider">No messages here yet...</div>
                        <span className="text-[14px] font-light tracking-wider">Send a message</span>
                        <img src={emptyGif} alt="No messages" />
                    </div>
                }
                {
                    createDmMutation.isPending &&
                    <Spinner className="flex-1 m-auto size-9 opacity-30" />
                }
                {
                    sendMessageMutation.isPending &&
                    <>
                        {
                            pendingMsgs.map((pendingMsg) =>
                                < Message user={user} chat={selectedChat} message={pendingMsg} key={user.userId} status={"pending"}
                                    retryMessage={retryMessage} />)
                        }
                    </>
                }
                <div ref={bottomRef}></div>
            </div>
            <MessageInput sendMessage={sendMessage} />

        </div>
    );
}