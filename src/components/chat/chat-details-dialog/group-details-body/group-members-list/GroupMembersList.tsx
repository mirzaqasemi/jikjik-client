import MediaAvatar from '@/components/media-avatar/MediaAvatar';
import { Separator } from '@/components/ui/separator';
import * as backend from '@/services/backend';

type Props = {
    users: backend.User[]
}

export default function GroupMembersList(props: Props) {
    return (
        <ul className='flex flex-col gap-2'>
            {props.users.map((user) => (
                <li className="flex flex-col last:[&>.separator]:hidden" key={user.userId}>
                    <div className="flex gap-4">
                        <MediaAvatar avatarUri={user.avatarUri} size='size-10' name={user.displayName}/>
                        <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{user.displayName}</p>
                            <p className="truncate text-sm text-muted-foreground">
                                {
                                    user.membership === "invite" ?
                                        "Invited . Waiting to join"
                                        : user.membership === "join"
                                            ? "last seen recently"
                                            : ""
                                }
                            </p>
                        </div>
                    </div>

                    <div className="separator ms-16 mt-2">
                        <Separator />
                    </div>
                </li>
            ))}
        </ul>
    );
}