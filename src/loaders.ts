import { redirect } from "react-router-dom";
import * as session from "./session";
import * as backend from "./backend";
import { CHATS_ROUTE, LOGIN_ROUTE } from "./router";


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

export async function chatLoader({ params }) {
  if (protectedLoader() == null) {
    const chatId = params.chatId;
    return backend.getMesseges(chatId);
  }
}