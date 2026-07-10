import { redirect, type LoaderFunctionArgs } from "react-router-dom";
import * as session from "../services/session";
import * as backend from "../services/backend";
import { CHATS_ROUTE, LOGIN_ROUTE } from "../router";


// Loader for protected routes
export function protectedLoader() {
  if (session.getUser() == null) {
    // If the user is not logged in, redirect them to the login page
    return redirect(LOGIN_ROUTE);
  }
}

// Loader for the login page
export function loginLoader() {
  if (session.getUser() != null) {
    // If the user is already logged in, redirect them to the chats page
    return redirect(CHATS_ROUTE);
  }
}

export async function chatLoader({ params }: LoaderFunctionArgs) {
  const protectedLoaderResult = protectedLoader();
  if (protectedLoaderResult == null) {
    const chatId = params.chatId;
    if (!chatId) {
      throw new Error("Missing chatId");
    }
    const chat = await backend.getChat(chatId);
    console.log(chat.membership);
    
    if (chat.membership == "invite") {
      return redirect(`/chats/${chatId}/invite`);
    }
    return chat;
  }
  return protectedLoaderResult;
}

export async function inviteChatLoader({ params }: LoaderFunctionArgs) {
  const protectedLoaderResult = protectedLoader();
  const chatId = params.chatId;
  if (protectedLoaderResult == null) {
    if (!chatId) {
      throw new Error("Missing chatId");
    }
    const chat = await backend.getChat(chatId);
    if (chat.membership == 'join') {
      return redirect(`/chats/${chatId}`);
    }
    return chat;
  }
  return protectedLoaderResult;
}