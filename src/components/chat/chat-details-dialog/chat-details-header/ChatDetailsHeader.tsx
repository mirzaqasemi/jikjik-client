import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import {
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import * as backend from "@/services/backend";
type Props = {
    title: string | undefined;
    avatarUrl: string | undefined | null;
    description: string;
}

export default function ChatDetailsHeader(props: Props) {
    return (
        <DialogHeader className="flex justify-center items-center pb-2">
            <Avatar className="size-20">
                <AvatarImage
                    src={""}
                    alt="@shadcn"
                />
                <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <DialogTitle>{props.title}</DialogTitle>
            <DialogDescription>
                {props.description}
            </DialogDescription>
        </DialogHeader>

    );
}