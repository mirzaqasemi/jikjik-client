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
    return backend.getChat(chatId);
  }
  return protectedLoaderResult;
}
