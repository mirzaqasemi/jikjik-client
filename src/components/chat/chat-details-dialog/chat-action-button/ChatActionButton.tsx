import { Button } from "@/components/ui/button";
import {
    Item,
    ItemContent,
    ItemMedia,
    ItemTitle
} from "@/components/ui/item";
import { type LucideIcon } from "lucide-react";
type Props = {
    icon: LucideIcon;
    title: string;
    onClick: () => void;
    disabled?: boolean
}

export default function ChatActionButton({
    icon: Icon,
    title,
    onClick,
    disabled
}: Props) {

    return (
        <>
            <Button disabled={disabled} size="sm" variant="ghost" className="flex flex-1 p-0 w-full h-full" onClick={onClick}>
                <Item variant="muted" className="flex flex-col py-2 gap-1 px-5 border-0">
                    <ItemMedia variant="icon">
                        <Icon className="size-5 stroke-2" strokeLinecap="round" />
                    </ItemMedia>
                    <ItemContent>
                        <ItemTitle className="font-normal text-[11px]">{title}</ItemTitle>
                    </ItemContent>
                </Item>
            </Button>
        </>
    );
}