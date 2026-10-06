import { CheckCheck, CircleAlert, Clock4, RotateCw } from 'lucide-react';
import * as backend from '../../../services/backend';
import * as utils from '../../../utilities/utilities';
import './Message.css';

type MessageData = {
    sender?: backend.User;
    content: string;
    date: Date;
};

type Params = {
    currentUser: backend.User;
    chat: backend.Chat;
    message: MessageData;
} & (
        | {
            status: "success" | "pending";
            // Retry is only valid for failed messages.
            retryMessage?: never;
        }
        | {
            status: "error";
            retryMessage: () => void;
        }
    );

export default function Message(params: Params) {

    const isCurrentUser = params.message.sender === undefined ||
        params.message.sender.userId === params.currentUser.userId;
    const messageSide = isCurrentUser ? "sent" : "received";
    const showUserTitle = (params.chat.users.length > 2) && (!isCurrentUser);

    return (
        <div className={`flex items-center ${messageSide}`}>
            {
                params.status === "error" &&
                <RotateCw className='size-5 mr-2 cursor-pointer' onClick={params.retryMessage} />
            }
            <div className="flex flex-col message-wrapper">
                <div className="flex flex-col message-bubble">
                    {
                        showUserTitle &&
                        <div className="flex sender-title">{params.message.sender?.displayName}</div>
                    }
                    <div className='pb-1'>{params.message.content}</div>
                    <div className="flex gap-2 items-end message-meta">
                        <div className='text-[13px] font-normal leading-none'>{utils.formatDate(params.message.date)}</div>
                        {
                            messageSide === "sent" &&
                            <div className='sending-status flex'>
                                {
                                    params.status === "pending" ? <Clock4 className='size-4 translate-y-0.5' />
                                        : (params.status === "error" ? <CircleAlert className='size-4 translate-y-0.5 rounded-full text-destructive' />
                                            : <CheckCheck className='size-4 translate-y-0.5' />)
                                }
                            </div>
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}
