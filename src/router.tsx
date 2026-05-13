import { createBrowserRouter } from 'react-router-dom';
import RootLayout from './components/root-layout/RootLayout';
import * as loaders from './loaders/loaders';
import Login from './pages/login/Login';
import ErrorPage from './pages/error/ErrorPage';
import Chats from './pages/chats/Chats';
import Chat from './pages/chat/Chat';

export const LOGIN_ROUTE = "/";
export const CHATS_ROUTE = "/chats";
export const CHAT_ROUTE = "/chats/:chatId";

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
      },
      {
        path: CHAT_ROUTE,
        loader: loaders.chatLoader,
        element: <Chat />,
      },
    ],
  },
]);