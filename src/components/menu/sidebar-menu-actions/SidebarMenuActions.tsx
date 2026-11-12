import { Button } from "@/components/ui/button";
import { LogOut, UserRoundPen, UserRoundX, UsersRound } from "lucide-react";

type SidebarMenuProps = {
  onOpenProfile: () => void
  onNewGroup: () => void
  onOpenBlockedUsers: () => void
  onLogout: () => void
}

export default function SidebarMenuActions(props: SidebarMenuProps) {
    return (
        <ul className="flex flex-col px-3 gap-2">
            <li className="py-2 border-y">
                <Button variant="ghost" className="w-full justify-start rounded-none" onClick={props.onOpenProfile}>
                    <UserRoundPen className="sidebar-icon" />
                    My Profile
                </Button>
            </li>
            <li>
                <Button variant="ghost" className="w-full justify-start rounded-none" onClick={props.onNewGroup}>
                    <UsersRound className="sidebar-icon" />
                    New Group
                </Button>
            </li>
            {/* <li>
                <Button variant="ghost" className="w-full justify-start rounded-none">
                    <UserRoundPlus />
                    New Contact
                </Button>
            </li> */}
            <li>
                <Button variant="ghost" className="w-full justify-start rounded-none" onClick={props.onOpenBlockedUsers}>
                    <UserRoundX />
                    Blocked Users
                </Button>
            </li>
            <li>
                <Button variant="ghost" className="w-full justify-start rounded-none" onClick={props.onLogout}>
                    <LogOut />
                    Logout
                </Button>
            </li>
        </ul>
    );
}