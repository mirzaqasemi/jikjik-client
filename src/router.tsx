import { createBrowserRouter } from 'react-router-dom';
import ChatPlaceHolder from './components/chat/chat-place-holder/ChatPlaceHolder';
import Chat from './components/chat/Chat';
import Chats from './pages/chats/Chats';
import RootLayout from './components/root-layout/RootLayout';
import * as loaders from './loaders/loaders';
import ErrorPage from './pages/error/ErrorPage';
import Login from './pages/login/Login';
import Draft from './components/chat/draft/Draft';
import ChatInvitation from './components/chat/chat-invitation/ChatInvitation';
import { ChatPage } from './pages/chat-page/ChatPage';

export const LOGIN_ROUTE = "/";
export const CHATS_ROUTE = "/chats";
export const CHAT_ROUTE = "/chats/:chatId"; //This is an absolute/full route path
export const INVITE_CHAT = "/chats/:chatId/invite";
const RELATIVE_DRAFT_CHAT = "draft";
const RELATIVE_INVITE_CHAT = ":chatId/invite";
const RELATIVE_CHAT_ROUTE = ":chatId"; //This is a relative child route path


export const router = createBrowserRouter([
  {
    path: LOGIN_ROUTE,
    element: <RootLayout />,
    errorElement: <ErrorPage name={"home"} url={LOGIN_ROUTE}/>,
    children: [
      {
        index: true,
        loader: loaders.loginLoader, // Protects login page from logged-in users
        element: <Login />,
      },
      {
        path: CHATS_ROUTE,
        loader: loaders.protectedLoader,
        element: <Chats />,
        children: [ //These children would render inside <Outlet />
          {
            index: true,
            element: <ChatPlaceHolder />
          },
          {
            path: RELATIVE_DRAFT_CHAT, // 1. We define just "draft" because it's a child of Chats. So it will be: /chats/draft
            loader: loaders.protectedLoader,
            element: <Draft />,
            errorElement: <ErrorPage name={"chats"} url={CHATS_ROUTE}/>,
          },
          {
            path: RELATIVE_INVITE_CHAT, // 2. This is a single route path with two URL segments:
            loader: loaders.inviteChatLoader,
            element: <ChatInvitation />,
            errorElement: <ErrorPage name={"chats"} url={CHATS_ROUTE}/>,
          },
          {
            path: RELATIVE_CHAT_ROUTE,
            loader: loaders.chatLoader,
            element: <ChatPage />,
            errorElement: <ErrorPage name={"chats"} url={CHATS_ROUTE}/>,
          },
        ],
      },
    ],
  },
]);