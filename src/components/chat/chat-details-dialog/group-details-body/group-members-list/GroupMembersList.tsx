import { Separator } from '@/components/ui/separator';
import * as backend from '@/services/backend';

type Props = {
    users: backend.User[]
}

export default function GroupMembersList(props: Props) {
    return (
        <div className='flex flex-col gap-2'>
            {props.users.map((user, index) => (
                <>
                    <div className="flex" key={index}>
                        <div className="relative h-12 w-12 shrink-0">
                            <img src="https://i.pravatar.cc/150?img=11" alt="David" className="h-full w-full rounded-full object-cover" />
                        </div>
                        <div className="flex flex-col gap-0.4 ml-4 truncate">
                            <div className="font-medium">{user.displayName}</div>
                            <span className="text-muted-foreground">
                                {
                                    user.membership === "invite" ?
                                        "Invited . Waiting to join"
                                        : user.membership === "join"
                                            ? "last seen recently"
                                            : ""
                                }
                            </span>
                        </div>
                    </div>
                    <div className="ms-16 last:hidden">
                        <Separator />
                    </div>
                </>
            ))}
        </div>
    );
}