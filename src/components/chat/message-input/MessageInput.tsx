import { SendHorizontal } from "lucide-react";
import { useState } from "react";
import "./MessageInput.css"
import { Button } from "@/components/ui/button";

type Props = {
    sendMessage: (inputStr: string) => void;
    disabled: boolean;
    keepInputOnSend?: boolean
}

export default function MessageInput(props: Props) {
    const [inputStr, setInputStr] = useState("");

    function handleSendMessage(inputStr: string) {
        if (inputStr.trim() !== "") {
            props.sendMessage(inputStr);
        }
        // Clear the input even for whitespace-only text, unless keepInputOnSend is true.
        if (!props.keepInputOnSend) {
            setInputStr("");
        }
    }

    return (
        //  <!-- Bottom: Input Section -->
        < div className="flex justify-center chat-input-area" >
            <input value={inputStr} type="text" placeholder="Write a message..."
                onChange={(e) => setInputStr(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        handleSendMessage(inputStr);
                    }
                }}
                disabled={props.disabled}
            />
            <Button
                variant="ghost"
                disabled={props.disabled}
                onClick={() => handleSendMessage(inputStr)}
                className="flex justify-center rounded-full btn-send hover:bg-transparent"
            >
                <SendHorizontal className="size-6" fill="var(--primary)" strokeWidth={"1.5"} stroke="" />
            </Button>
        </div >
    );
}