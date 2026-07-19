import { CheckCheck, CircleAlert, Clock4, RotateCw } from 'lucide-react';
import * as backend from '../../../services/backend';
import './Message.css';

interface Params {
    user: backend.User,
    chat: backend.Chat,
    message: backend.Message,
    status: "success" | "pending" | "error",
    retryMessage: (message: backend.Message) => void
}

export default function Message(params: Params) {
    let messageSide = params.message.sender.username === params.user.username ? "sent" : "received";
    const showUserTitle = (params.chat.users.length > 2) && (params.message.sender.username != params.user.username);

    return (
        <div className={`flex items-center ${messageSide}`}>
            {
                params.status == "error" &&
                <RotateCw className='size-5 mr-2 cursor-pointer' onClick={() => params.retryMessage(params.message)} />
            }
            <div className="flex flex-col message-wrapper">
                <div className="flex flex-col message-bubble">
                    {
                        showUserTitle &&
                        <div className="flex sender-title">{params.message.sender.displayName}</div>
                    }
                    <div className='pb-1'>{params.message.content}</div>
                    <div className="flex gap-2 items-end message-meta">
                        <div className='text-[13px] font-normal leading-none'>5:06</div>
                        {
                            messageSide == "sent" &&
                            <div className='sending-status flex'>
                                {
                                    params.status == "pending" ? <Clock4 className='size-4 translate-y-0.5' />
                                        : (params.status == "error" ? <CircleAlert className='size-4 translate-y-0.5 rounded-full text-destructive' />
                                            : <CheckCheck className='size-4 translate-y-0.5' />)
                                }
                            </div>
                        }
                        {/* {utils.formatDate(params.message.date)} */}
                    </div>
                </div>
            </div>
        </div>
    );
}
