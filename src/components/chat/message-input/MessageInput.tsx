import { SendHorizontal } from "lucide-react";
import { useState } from "react";
import "./MessageInput.css"

type Props = {
    sendMessage: (inputStr: string) => void;
    disabled: boolean;
    keepInputOnSend?: boolean
}

export default function MessageInput(props: Props) {
    const [inputStr, setInputStr] = useState("");

    return (
        //  <!-- Bottom: Input Section -->
        < div className="flex justify-center chat-input-area" >
            <input value={inputStr} type="text" placeholder="Write a message..."
                onChange={(e) => setInputStr(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        props.sendMessage(inputStr);
                        if (!props.keepInputOnSend) {
                            setInputStr("");
                        }
                    }
                }}
                disabled={props.disabled}
            />
            <button className="flex justify-center rounded-full btn-send" onClick={() => props.sendMessage(inputStr)} disabled={props.disabled}>
                <SendHorizontal className="" fill="var(--primary)" strokeWidth={"1.5"} stroke=""/>
            </button>
        </div >
    );
}