import { NormalizedError } from "@/utilities/normalized-error";
import { redirect, type LoaderFunctionArgs } from "react-router-dom";
import { CHATS_ROUTE, LOGIN_ROUTE } from "../router";
import * as backend from "../services/backend";
import * as session from "../services/session";


// Loader for protected routes
export function protectedLoader() {
  if (session.getUserId() === null) {
    // If the user is not logged in, redirect them to the login page
    return redirect(LOGIN_ROUTE);
  }
}

// Loader for the login page
export function loginLoader() {
  if (session.getUserId() !== null) {
    // If the user is already logged in, redirect them to the chats page
    return redirect(CHATS_ROUTE);
  }
}

export async function chatLoader({ params }: LoaderFunctionArgs) {
  const protectedLoaderResult = protectedLoader();
  if (protectedLoaderResult === undefined) {
    const chatId = params.chatId;
    if (!chatId) {
      throw new Error("Missing chatId");
    }
    const chat = await backend.getChat(chatId);
    if (chat.membership === "invite") {
      return redirect(`/chats/${chatId}/invite`);
    }
    else if (chat.membership === "leave" || chat.membership === undefined) {
      const normalizeError = new NormalizedError("forbidden");
      normalizeError.message = "You are not a member!";
      throw normalizeError;
    }
    return chat;
  }
  return protectedLoaderResult;
}

export async function inviteChatLoader({ params }: LoaderFunctionArgs) {
  const protectedLoaderResult = protectedLoader();
  const chatId = params.chatId;
  if (protectedLoaderResult === undefined) {
    if (!chatId) {
      throw new Error("Missing chatId");
    }
    const chat = await backend.getChat(chatId);
    if (chat.membership === "join") {
      return redirect(`/chats/${chatId}`);
    }
    return chat;
  }
  return protectedLoaderResult;
}