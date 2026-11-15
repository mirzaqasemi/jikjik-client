import UserProfileInfo from "@/components/user-profile-body/UserProfileInfo";
import * as backend from "@/services/backend";
import DmActions from "./dm-actions/DmActions";


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
        </>
    );
}