import MediaAvatar from "@/components/media-avatar/MediaAvatar";
import * as backend from "@/services/backend.ts";
import { Check } from "lucide-react";

type Props = {
    contact: backend.User,
    onSelect: () => void,
    selected: boolean,
    disabled: boolean
}

export default function ContactListItem(props: Props) {
    return (
        <>
            <button onClick={() => {
                props.onSelect();
            }
            } key={props.contact.userId} disabled={props.disabled}
                className="flex m-auto h-18 items-center w-full disabled:cursor-default!">
                <div className="relative h-10 w-10 shrink-0">
                    <MediaAvatar avatarUri={props.contact.avatarUri} size="size-10" name={props.contact.displayName} />
                    {props.disabled &&
                        <Check className="absolute -bottom-1 p-[1.5px] stroke-3 -right-1 size-5 rounded-full bg-ring text-white border-[2.5px] border-white" aria-label="Online" />
                    }
                    {props.selected &&
                        <Check className="absolute -bottom-1 p-[1.5px] stroke-3 -right-1 size-5 text-chart-2" aria-label="Online" />
                    }
                </div>
                <div className="flex-1 pb-2.5 pt-2.5 ml-3 chat-info">
                    <div className="flex flex-col items-start">
                        <div className="chat-name">{props.contact.displayName}</div>
                        <span className="muted-text font-light text-[13px]">last seen recently</span>
                    </div>
                </div>
            </button>
        </>
    );
}