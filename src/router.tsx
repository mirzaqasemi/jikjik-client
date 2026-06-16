import { createBrowserRouter } from 'react-router-dom';
import ChatPlaceHolder from './components/chat-place-holder/ChatPlaceHolder';
import Chat from './components/chat/Chat';
import Chats from './pages/chats/Chats';
import RootLayout from './components/root-layout/RootLayout';
import * as loaders from './loaders/loaders';
import ErrorPage from './pages/error/ErrorPage';
import Login from './pages/login/Login';

export const LOGIN_ROUTE = "/";
export const CHATS_ROUTE = "/chats";
export const CHAT_ROUTE = "/chats/:chatId";
const RELATIVE_CHAT_ROUTE = ":chatId";

export const router = createBrowserRouter([
  {
    path: LOGIN_ROUTE,
    element: <RootLayout />,
    errorElement: <ErrorPage />,
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
        children: [
          {
            index: true,
            element: <ChatPlaceHolder />
          },
          {
            path: RELATIVE_CHAT_ROUTE,
            loader: loaders.chatLoader,
            element: <Chat />,
          },
        ],
      },
    ],
  },
]);