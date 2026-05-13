import { createBrowserRouter } from 'react-router-dom';
import RootLayout from './components/root-layout/RootLayout';
import { chatLoader, loginLoader, protectedLoader } from './loaders';
import Chat from './pages/chat/Chat';
import Chats from './pages/chats/Chats';
import ErrorPage from './pages/error/ErrorPage';
import Login from './pages/login/Login';

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
        loader: loginLoader, // Protects login page from logged-in users
        element: <Login />,
      },
      {
        path: CHATS_ROUTE,
        loader: protectedLoader,
        element: <Chats />,
      },
      {
        path: CHAT_ROUTE,
        loader: chatLoader,
        element: <Chat />,
      },
    ],
  },
]);