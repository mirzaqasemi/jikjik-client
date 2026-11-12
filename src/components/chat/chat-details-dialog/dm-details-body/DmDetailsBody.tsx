import { toast } from "sonner";
import DmActions from "./dm-actions/DmActions";
import * as backend from "@/services/backend";
import UserProfileInfo from "@/components/user-profile-body/UserProfileInfo";


type Props = {
    otherUser: backend.User;
    onCloseRequest: () => void;
}

export default function DmDetailsBody(props: Props) {

    return (
        <>
            {/* Actions */}
            <DmActions otherUserId={props.otherUser.userId} displayName={props.otherUser.displayName} onCloseRequest={props.onCloseRequest} />
            <UserProfileInfo user={props.otherUser} />

            {/* User Information */}
            {/* <div className="flex flex-col flex-1 -mx-6 no-scrollbar overflow-y-auto rounded-[10px]">
                <div className="flex flex-col px-6 py-4 gap-5">
                    <div className="flex flex-col">
                        <span className="font-normal text-[15px]">{props.otherUser.displayName}</span>
                        <span className="font-normal text-[14px] text-muted-foreground">Display Name</span>
                    </div>
                    <div className="flex flex-col">
                        <button
                            type="button"
                            onClick={copyUsername}
                            className="w-fit  font-normal text-[15px] bg-transparent text-sky-500 hover:underline cursor-pointer"
                        >
                            {props.otherUser.userId}
                        </button>
                        <span className="font-normal text-[14px] text-muted-foreground">Username</span>
                    </div>
                </div>
            </div> */}
        </>
    );
}