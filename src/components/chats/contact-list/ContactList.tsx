import * as backend from "@/services/backend.ts";
import * as session from "@/services/session";
import { useNavigate } from "react-router-dom";

type Params = {
    contacts: backend.User[],
    onSelect: () => void
}

export default function ContactList(params: Params) {
    const navigate = useNavigate();
    return (
        <div className="pt-3">
            <div className="flex h-7 px-5 text-[13.5px] muted-text font-light muted-background text-start items-center">Contacts</div>
            <div className="px-4">
                {
                    params.contacts.map((contact) => (
                        <button onClick={() => {
                            session.draftDm(contact);
                            navigate(`/chats/draft`);
                            params.onSelect();
                        }
                        } key={contact.userId}
                            className="flex m-auto h-18 items-center w-full chat-item">
                            <div className="relative h-10 w-10 shrink-0">
                                <img src="https://i.pravatar.cc/150?img=11" alt="David" className="h-full w-full rounded-full object-cover" />
                                {/* {username.img != null && <img src={username.img} alt="David" class="avatar"/>} */}
                                {/* {chat.img != null && <img src={chat.img} alt="David" class="avatar" />} */}
                                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-chart-2  border-2 border-white" aria-label="Online" />
                            </div>
                            <div className="flex-1 pb-2.5 pt-2.5 ml-3 chat-info">
                                <div className="flex flex-col items-start">
                                    <div className="chat-name">{contact.displayName}</div>
                                    <span className="muted-text font-light text-[13px]">last seen recently</span>
                                </div>
                            </div>
                        </button>
                    ))
                }
            </div>
        </div>
    );
}