import * as backend from '@/services/backend';
import ContactChip from "./contact-chip/ContactChip";

type Params = {
    contacts: backend.User[],
    onRemove: (contact: backend.User) => void
}

export default function ContactChips(params: Params) {
    return (
        <div className="gap-x-4 flex">
            {params.contacts.map((contact) => (
                <ContactChip contact={contact} key={contact.userId} onRemove={() => params.onRemove(contact)} />
            ))
            }
        </div>
    );
}