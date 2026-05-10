import './App.css';
// import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useState } from "react";
import type { Chat } from './backend.ts';
import ChatComponent from "./components/chat/Chat.tsx";
import Chats from "./components/chats/Chats.tsx";
import Login from './components/login/Login.tsx';
import * as session from './session.ts';

function App() {
  const userInfo = session.useSession();
  const [chat, setChat] = useState<Chat>();

  let content: React.ReactNode;
  if (userInfo == null) {
    content = <Login />
  } else if (chat == null) {
    content = <Chats navigateTo={setChat} />
  } else {
    content = <ChatComponent selectedChat={chat} navigatTo={() => setChat(null)} />
  }

  return (
    <>
      <div className='app-container'>
        {content}
      </div>
    </>
  )
}

export default App
