import * as backend from "@/services/backend.ts";

type Params = {
    contact: backend.User,
    onSelect: () => void,
    selected: boolean 
}

export default function ContactListItem({ contact, onSelect, selected }: Params) {
    return (
        <>
            <button onClick={() => {
                onSelect();
            }
            } key={contact.userId}
                className="flex m-auto h-18 items-center w-full chat-item">
                <div className="relative h-10 w-10 shrink-0">
                    <img src="https://i.pravatar.cc/150?img=11" alt="David" className="h-full w-full rounded-full object-cover" />
                    {selected &&
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-chart-2  border-2 border-white" aria-label="Online" />}
                </div>
                <div className="flex-1 pb-2.5 pt-2.5 ml-3 chat-info">
                    <div className="flex flex-col items-start">
                        <div className="chat-name">{contact.displayName}</div>
                        <span className="muted-text font-light text-[13px]">last seen recently</span>
                    </div>
                </div>
            </button>
        </>
    );
}