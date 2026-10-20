import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from "@/components/ui/input-group";
import { SearchIcon } from "lucide-react";

type Props = {
    value: string;
    onChange: (inputValue: string) => void;
    placeholder?: string;
}

export default function SearchBar(props: Props) {
    return (
        <InputGroup className="">
            <InputGroupInput
                id="inline-start-input"
                autoComplete="off"
                placeholder={props.placeholder}
                value={props.value}
                onChange={(e) => props.onChange(e.target.value)} 
                className="pl-9"
                />
            <InputGroupAddon align="inline-start" className="">
                <SearchIcon className="text-muted-foreground" />
            </InputGroupAddon>
        </InputGroup>
    );
}