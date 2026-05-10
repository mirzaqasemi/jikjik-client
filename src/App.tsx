import './App.css'
// import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Login from './components/login/Login.tsx';
import Chats from "./components/chats/Chats.tsx";
import ChatComponent from "./components/chat/Chat.tsx";
import { useEffect, useState } from "react";
import type { Chat, User } from './backend.ts';
import * as session from './session.ts';


function App() {
  const [userInfo, setUserInfo] = useState<User>(session.getUser());
  const [chat, setChat] = useState<Chat>();
  // const currentUser = session.getUser();

  // useEffect(() => {
  //   setUserInfo(currentUser);
  // }, [currentUser?.username]);

  // function loginHandler() {
  //   setUserInfo(session.getUser());
  // }

  useEffect(() => {
    session.addListener((user) => {
      setUserInfo(user);
    });
  }, []);



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
