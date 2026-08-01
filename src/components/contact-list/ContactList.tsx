import * as backend from "@/services/backend.ts";
import ContactListItem from "./contact-list-item/ContactListItem.tsx";

type Params = {
    contacts: backend.User[],
    selectedMembers?: Map<string, backend.User>,
    // When user selects a contact, onSelect is called
    onSelect: (contact: backend.User) => void
}

export default function ContactList(params: Params) {
    // console.log("the set is: ",params.selectedMembers);

    return (
        <div>
            {
                params.contacts.map((contact) => (
                    <ContactListItem key={contact.userId} contact={contact} onSelect={() => params.onSelect(contact)} selected={params.selectedMembers?.has(contact.userId) || false} />
                ))
            }
        </div>
    );
}