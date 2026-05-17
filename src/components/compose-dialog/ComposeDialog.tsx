import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Plus, UserRoundPlus, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import * as backend from '../../services/backend';
import './ComposeDialog.css';

export default function ComposeDialog() {
    const [contacts, setContacts] = useState<backend.User[]>();
    useEffect(() => {
        async function fetchContacts() {
            try {
                setContacts([...await backend.getContacts()]);
            } catch (error) {
            }
        }
        fetchContacts();
    }, []);
    return (
        <>
            <Dialog>
                <DialogTrigger asChild>
                    <Button className="h-9 w-9 p-2 absolute bottom-5 right-5 dialog-btn" variant="outline">
                        <Plus />
                    </Button>
                </DialogTrigger>
                <DialogContent className="[&>button]:rounded-full [&>button]:bg-white [&>button]:shadow-[0_2px_10px_rgba(0,0,0,0.08)] [&>button]:shadow-black/10">
                    <DialogHeader className="gap-3">
                        <DialogTitle className="text-center">New Message</DialogTitle>
                        <ul className="flex flex-col gap-3">
                            <li className="flex items-center gap-4 pb-1 border-b">
                                <UsersRound className="h-6 w-6" />
                                <span>New Group</span>
                            </li>
                            <li className="flex items-center gap-4 pb-1 border-b">
                                <UserRoundPlus className="h-6 w-6" />
                                <span>New Contact</span>
                            </li>
                        </ul>
                    </DialogHeader>
                    <div className="scroll-auto max-h-[50vh] overflow-y-auto">
                        {contacts?.map(contact => (
                            <div className="flex gap-2 h-12 items-center mb-auto ms-auto">
                                <div className="w-9 h-9 rounded-full bg-gray-400"></div>
                                <div className="flex flex-col flex-1 border-b">
                                    <span>{contact.displayName}</span>
                                    <span className="font-light text-xs text-(--text-muted)">{contact.lastSeen}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}


