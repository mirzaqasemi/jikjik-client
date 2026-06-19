import { CheckCheck, CircleAlert, Clock4 } from 'lucide-react';
import * as backend from '../../../services/backend';
import './Message.css';

interface Params {
    user: backend.User,
    chat: backend.Chat,
    message: backend.Message,
    status: "success" | "pending" | "error"
}

export default function Message(params: Params) {
    let className = params.message.sender.username === params.user.username ? "sent" : "received";
    const showUserTitle = (params.chat.users.length > 2) && (params.message.sender.username != params.user.username);

    return (
        <div className={`flex flex-col message-wrapper ${className}`}>
            <div className="flex flex-col message-bubble">
                {showUserTitle && <div className="flex sender-title">{params.message.sender.displayName}</div>}
                <div className='pb-1'>{params.message.content}</div>
                <div className="flex gap-2 items-end message-meta">
                    <div className='text-[13px] font-normal leading-none'>5:06</div>
                    {
                        className == "sent" &&
                        <div className='sending-status flex'>{params.status == "pending" ? <Clock4 className='size-4 translate-y-[2px]' /> 
                            : (params.status == "error" ? <CircleAlert className='size-4 translate-y-[2px]' /> :
                                <CheckCheck className='size-4 translate-y-[2px]' />
                            )}
                        </div>
                    }
                    {/* {utils.formatDate(params.message.date)} */}
                </div>
            </div>
        </div>
    );
}
