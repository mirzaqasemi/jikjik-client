import type { User } from "@/services/backend";
import { Copy, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "../ui/item";
import { Separator } from "../ui/separator";

type Props = {
    user: User | null | undefined;
}

export default function UserProfileInfo(props: Props) {
    async function copyUsername() {
        if (props.user) {
            await navigator.clipboard.writeText(props.user.userId);
            toast("Username copied to clipboard.");
        }
    }
    return (
        <>
            {/* User Information */}

            <div className="flex flex-col flex-1 -mx-6 no-scrollbar overflow-y-auto rounded-[10px]">
                <div className="flex flex-col px-6 py-4 gap-3">
                    <Item className="items-center p-0!">
                        <ItemMedia variant="icon" className="self-center! size-10 rounded-lg bg-muted border-0">
                            <UserRound className="size-4 text-foreground" />
                        </ItemMedia>
                        <ItemContent>
                            <ItemTitle className="text-[15px]">{props.user?.displayName}</ItemTitle>
                            <ItemDescription className="text-[13px] font-light text-muted-foreground">Display Name</ItemDescription>
                        </ItemContent>
                    </Item>
                    <Separator />

                    <Item className="items-center p-0!">
                        <ItemMedia variant="icon" className="self-center! size-10 rounded-lg bg-muted border-0">
                            <span className="flex size-4 items-center justify-center text-sm leading-none text-foreground">
                                @
                            </span>
                        </ItemMedia>
                        <ItemContent>
                            <ItemTitle className="text-[15px]">
                                <button
                                    type="button"
                                    onClick={copyUsername}
                                    title="Copy username"
                                    className="inline-flex max-w-full items-center gap-1.5 text-sky-500 rounded-sm text-start font-normal hover:underline "
                                >
                                    <span className="min-w-0 break-all">
                                        {props.user?.userId}
                                    </span>
                                    <Copy className="size-3.5 shrink-0" />
                                </button>
                            </ItemTitle>
                            <ItemDescription className="text-[13px] font-light text-muted-foreground">Username</ItemDescription>
                        </ItemContent>
                    </Item>
                </div>
            </div>
        </>
    );
}