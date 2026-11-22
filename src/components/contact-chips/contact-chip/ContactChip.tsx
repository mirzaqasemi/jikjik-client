import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMediaUrl } from "@/hooks/useMediaUrl";
import * as backend from '@/services/backend';
import { getColor } from "@/utilities/utilities";
import { X } from "lucide-react";
import { useState } from "react";
import './ContactChip.css';

type Props = {
    contact: backend.User,
    onRemove: () => void,
}

export default function ContactChip(props: Props) {
    const [randomColor] = useState(() => getColor(props.contact.userId));
    const [isHovered, setIsHovered] = useState(false);
    const url = useMediaUrl(props.contact.avatarUri);

    function remove() {
        if (isHovered)
            props.onRemove();
    }
    return (
        <div className="flex gap-x-1 items-center rounded-full bg-black/5 avatar-wrapper" onMouseOver={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
            <Avatar className={`grayscale-0 ${randomColor} avatar`} onClick={remove} >
                <AvatarImage
                    src={isHovered ? undefined : url}
                    alt={props.contact.userId}
                    className="avatar-image"
                />
                <AvatarFallback className="bg-transparent text-white">
                    <X className="remove-icon size-5" />
                    <span className="fallback-text">
                        {props.contact.displayName.charAt(0).toUpperCase()}
                    </span>
                </AvatarFallback>
            </Avatar>
            <div className="pr-3">
                {props.contact.displayName}
            </div>
        </div>
    );
}