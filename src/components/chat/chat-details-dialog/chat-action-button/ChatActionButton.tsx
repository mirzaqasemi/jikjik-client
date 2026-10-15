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
}

export default function ChatActionButton({
    icon: Icon,
    title,
    onClick
}: Props) {

    return (
        <>
            <div className="bg-white border border-muted-foreground/30 rounded-md flex-1 min-w-0">
                <Button size="sm" variant="ghost" className="rounded-md p-0 w-full h-full" onClick={onClick}>
                    <Item variant="outline" className="flex flex-col gap-1 py-1.5 px-5 border-0">
                        <ItemMedia variant="icon">
                            <Icon className="size-6" />
                        </ItemMedia>
                        <ItemContent>
                            <ItemTitle className="font-normal text-[12px] text-black">{title}</ItemTitle>
                        </ItemContent>
                    </Item>
                </Button>
            </div>
        </>
    );
}