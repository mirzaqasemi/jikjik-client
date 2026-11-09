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
                        <div className="relative h-12 w-12 shrink-0">
                            <img
                                src="https://i.pravatar.cc/150?img=11"
                                alt=""
                                className="h-full w-full rounded-full object-cover" />
                        </div>

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