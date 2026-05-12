import { createBrowserRouter } from 'react-router-dom';
import RootLayout from './components/root-layout/RootLayout';
import ErrorPage from './pages/error/ErrorPage';
import Login from './pages/login/Login';
import Chats from './pages/chats/Chats';
import Chat from './pages/chat/Chat';
import { loginLoader, protectedLoader } from './loaders';


export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        loader: loginLoader, // Protects login page from logged-in users
        element: <Login />,
      },
      {
        path: "chats",
        loader: protectedLoader,
        element: <Chats />,
      },
      {
        path: "chats/:chatId",
        loader: protectedLoader,
        element: <Chat />,
      },
    ],
  },
]);