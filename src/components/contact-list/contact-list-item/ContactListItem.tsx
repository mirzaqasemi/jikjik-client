import * as backend from "@/services/backend.ts";
import { Check } from "lucide-react";

type Params = {
    contact: backend.User,
    onSelect: () => void,
    selected: boolean,
    disabled: boolean
}

export default function ContactListItem(params: Params) {
    return (
        <>
            <button onClick={() => {
                params.onSelect();
            }
            } key={params.contact.userId} disabled={params.disabled}
                className="flex m-auto h-18 items-center w-full disabled:cursor-default!">
                <div className="relative h-10 w-10 shrink-0">
                    <img src="https://i.pravatar.cc/150?img=11" alt="David" className="h-full w-full rounded-full object-cover" />
                    {params.disabled &&
                    <Check className="absolute -bottom-1 p-[1.5px] stroke-3 -right-1 h-5.5 w-5.5 rounded-full bg-ring text-white border-[2.5px] border-white" aria-label="Online"/>
                    }
                    {params.selected &&
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-chart-2  border-2 border-white" aria-label="Online" />}
                </div>
                <div className="flex-1 pb-2.5 pt-2.5 ml-3 chat-info">
                    <div className="flex flex-col items-start">
                        <div className="chat-name">{params.contact.displayName}</div>
                        <span className="muted-text font-light text-[13px]">last seen recently</span>
                    </div>
                </div>
            </button>
        </>
    );
}