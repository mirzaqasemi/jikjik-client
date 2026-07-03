import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from "@/components/ui/input-group";
import { SearchIcon } from "lucide-react";

type Params = {
    value: string;
    onChange: (inputValue: string) => void
}

export default function SearchBar(params: Params) {
    return (
        <InputGroup className="search-bar">
            <InputGroupInput
                id="inline-start-input"
                autoComplete="off"
                placeholder="Search chats, people, groups..."
                value={params.value}
                onChange={(e) => params.onChange(e.target.value)} />
            <InputGroupAddon align="inline-start">
                <SearchIcon className="text-muted-foreground" />
            </InputGroupAddon>
        </InputGroup>
    );
}