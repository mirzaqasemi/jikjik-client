import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import * as backend from '@/services/backend';
import { getColor } from "@/utilities/utilities";
import { X } from "lucide-react";
import { useState } from "react";
import './ContactChip.css';

type Params = {
    contact: backend.User,
    onRemove: () => void,
}

export default function ContactChip(params: Params) {
    const [randomColor] = useState(() => getColor(params.contact.userId));
    const [isHovered, setIsHovered] = useState(false);

    function remove() {
        if (isHovered)
            params.onRemove();
    }

    return (
        <div className="flex gap-x-1 items-center rounded-full bg-black/5 avatar-wrapper" onMouseOver={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
            <Avatar className={`grayscale-0 ${randomColor} avatar`} onClick={remove} >
                <AvatarImage
                    // FIXME
                    src={isHovered ? undefined : "https://github.com/shadcn.png"}
                    alt={params.contact.userId}
                    className="avatar-image"
                />
                <AvatarFallback className="bg-transparent text-white">
                    <X className="remove-icon size-5" />
                    <span className="fallback-text">
                        {params.contact.displayName.charAt(0).toUpperCase()}
                    </span>
                </AvatarFallback>
            </Avatar>
            <div className="pr-3">
                {params.contact.displayName}
            </div>
        </div>
    );
}