import { toast } from "sonner";

type Props = {
    displayName: string;
    username: string;
}

export default function DmChatDetails(props: Props) {
    async function copyUsername() {
        await navigator.clipboard.writeText(props.username);
        toast("Username copied to clipboard.");
    }
    return (
        <div className="flex flex-col -mx-6 no-scrollbar max-h-[60vh] overflow-y-auto bg-amber-50">
            <div className="flex flex-col px-6 py-4 gap-5">
                <div className="flex flex-col">
                    <span className="font-normal text-[15px]">{props.displayName}</span>
                    <span className="font-normal text-[14px] text-muted-foreground">Display Name</span>
                </div>
                <div className="flex flex-col">
                    <button
                        type="button"
                        onClick={copyUsername}
                        className="w-fit  font-normal text-[15px] bg-transparent text-sky-500 hover:underline cursor-pointer"
                    >
                        {props.username}
                    </button>
                    <span className="font-normal text-[14px] text-muted-foreground">Username</span>
                </div>
            </div>
            {/* <Separator className="w-full h-1.5!" /> */}
        </div>
    );
}