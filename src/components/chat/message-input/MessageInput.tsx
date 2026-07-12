import { SendHorizontal } from "lucide-react";
import { useState } from "react";
import "./MessageInput.css"

export default function MessageInput({ sendMessage, disabled, keepInputOnSend }: { sendMessage: (inputStr: string) => void, disabled: boolean, keepInputOnSend: boolean }) {
    const [inputStr, setInputStr] = useState("");

    return (
        //  <!-- Bottom: Input Section -->
        < div className="flex justify-center chat-input-area" >
            <input value={inputStr} type="text" placeholder="Write a message..."
                onChange={(e) => setInputStr(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        sendMessage(inputStr);
                        if (!keepInputOnSend) {
                            setInputStr("");
                        }
                    }
                }}
                disabled={disabled}
            />
            <button className="flex justify-center rounded-full btn-send" onClick={() => sendMessage(inputStr)} disabled={disabled}>
                <SendHorizontal className="" fill="var(--primary)" strokeWidth={"1.5"} stroke="" />
            </button>
        </div >
    );
}