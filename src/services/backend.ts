// -----------------------------------------
// Types
// -----------------------------------------
export interface User {
  username: string;
  displayName: string;
  lastSeen?: string;
}

export interface Message {
  sender: User;
  content: string;
  date: Date;
}

export interface Chat {
  id: string;
  title?: string;
  users: User[];
  lastMsg: {
    sender: string;
    content: string;
    date: Date;
  };
}

interface ChatMessages {
  chatId: string;
  messages: Message[];
}

// -----------------------------------------
// Data
// -----------------------------------------
const users: User[] = [
  {
    username: "alex92",
    displayName: "Alex Carter",
    lastSeen: new Date("2026-03-11T10:15:00").getHours().toString()
  },
  {
    username: "maria_dev",
    displayName: "Maria Lopez",
    lastSeen: new Date("2026-03-11T10:18:00").getHours().toString()
  },
  {
    username: "sam_k",
    displayName: "Sam Kim",
    lastSeen: new Date("2026-03-11T09:50:00").getHours().toString()
  },
  {
    username: "nina_art",
    displayName: "Nina Patel",
    lastSeen: new Date("2026-03-11T09:55:00").getHours().toString()
  },
  {
    username: "leo99",
    displayName: "Leo Turner",
    lastSeen: new Date("2026-03-11T10:02:00").getHours().toString()
  },
  {
    username: "david_r",
    displayName: "David Ross",
    lastSeen: new Date("2026-03-11T08:40:00").getHours().toString()
  },
  {
    username: "emily_w",
    displayName: "Emily Wong",
    lastSeen: new Date("2026-03-11T08:45:00").getHours().toString()
  },
  {
    username: "omar_a",
    displayName: "Omar Ali",
    lastSeen: new Date("2026-03-11T11:00:00").getHours().toString()
  },
  {
    username: "sophia_m",
    displayName: "Sophia Martin",
    lastSeen: new Date("2026-03-11T11:03:00").getHours().toString()
  },
  {
    username: "liang_z",
    displayName: "Liang Zhou",
    lastSeen: new Date("2026-03-11T11:05:00").getHours().toString()
  }
];

let chats: Chat[] = [
  {
    id: "chat_1",
    users: [users[0], users[1]],
    lastMsg: {
      sender: users[0].username,
      content: "Did you push the latest changes?",
      date: new Date("2026-03-11T10:20:00")
    }
  },
  {
    id: "chat_2",
    title: "team",
    users: [users[2], users[3], users[4]],
    lastMsg: {
      sender: users[3].username,
      content: "I'll upload the design files soon.",
      date: new Date("2026-03-11T10:05:00")
    }
  },
  {
    id: "chat_3",
    users: [users[5], users[6]],
    lastMsg: {
      sender: users[6].username,
      content: "That meeting went better than expected.",
      date: new Date("2026-03-11T08:47:00")
    }
  },
  {
    id: "chat_4",
    users: [users[0], users[8], users[4]],
    lastMsg: {
      sender: users[8].username,
      content: "Reminder: team call at 3 PM.",
      date: new Date("2026-03-11T11:06:00")
    }
  }
];

const chatMessages: ChatMessages[] = [
  {
    chatId: "chat_1",
    messages: [
      {
        sender: users[1],
        content: "Hey, are you working on the repo now?",
        date: new Date("2026-03-11T10:15:00")
      },
      {
        sender: users[0],
        content: "Yes, fixing a small bug.",
        date: new Date("2026-03-11T10:17:00")
      },
      {
        sender: users[0],
        content: "Did you push the latest changes?",
        date: new Date("2026-03-11T10:20:00")
      },
      {
        sender: users[1],
        content: "Yes, I pushed it already",
        date: new Date("2026-03-11T10:25:00")
      },
      {
        sender: users[0],
        content: "Nice, I'll pull the changes and test them.",
        date: new Date("2026-03-11T10:27:00")
      },
      {
        sender: users[1],
        content: "Let me know if anything breaks 😅",
        date: new Date("2026-03-11T10:28:00")
      },
      {
        sender: users[0],
        content: "Just ran it locally, everything looks good so far.",
        date: new Date("2026-03-11T10:31:00")
      },
      {
        sender: users[1],
        content: "Great. I still need to refactor the auth logic though.",
        date: new Date("2026-03-11T10:33:00")
      },
      {
        sender: users[0],
        content: "Yeah that file is getting huge.",
        date: new Date("2026-03-11T10:34:00")
      },
      {
        sender: users[1],
        content: "I'll split it into services later today.",
        date: new Date("2026-03-11T10:36:00")
      },
      {
        sender: users[0],
        content: "Perfect. That should make testing easier too.",
        date: new Date("2026-03-11T10:37:00")
      }
    ]
  },
  {
    chatId: "chat_2",
    messages: [
      {
        sender: users[2],
        content: "Morning everyone.",
        date: new Date("2026-03-11T09:55:00")
      },
      {
        sender: users[4],
        content: "Did we finalize the UI layout?",
        date: new Date("2026-03-11T09:59:00")
      },
      {
        sender: users[3],
        content: "I'll upload the design files soon.",
        date: new Date("2026-03-11T10:05:00")
      }
    ]
  },
  {
    chatId: "chat_3",
    messages: [
      {
        sender: users[5],
        content: "That presentation was stressful.",
        date: new Date("2026-03-11T08:40:00")
      },
      {
        sender: users[6],
        content: "Yeah but it turned out great.",
        date: new Date("2026-03-11T08:44:00")
      },
      {
        sender: users[6],
        content: "That meeting went better than expected.",
        date: new Date("2026-03-11T08:47:00")
      }
    ]
  },
  {
    chatId: "chat_4",
    messages: [
      {
        sender: users[4],
        content: "Are we still doing the call today?",
        date: new Date("2026-03-11T11:00:00")
      },
      {
        sender: users[0],
        content: "Yes, same time as usual.",
        date: new Date("2026-03-11T11:03:00")
      },
      {
        sender: users[8],
        content: "Reminder: team call at 3 PM.",
        date: new Date("2026-03-11T11:06:00")
      }
    ]
  }
];

// -----------------------------------------
// Utilities
// -----------------------------------------
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// -----------------------------------------
// API Functions
// -----------------------------------------
export async function login(username: string, _: string): Promise<User | null> {
  await delay(500);
  return users.find(user => user.username === username) || null;
}

export async function getChats(username: string, displayName?: string): Promise<Chat[]> {
  await delay(500);
  const result = chats.filter(chat => {
    const hasUser = chat.users.find(user => user.username === username) != null;
    if (!hasUser) {
      return false;
    }
    if (!displayName || displayName === "") {
      return true;
    }
    return chat.users.find(user =>
      user.displayName.toLowerCase().includes(displayName.toLowerCase())
    ) != null;
  });
  return result;
}

export async function getChat(chatId: string) {
  await delay(100);
  return chats.find(chat => chat.id === chatId) || null;

}

export async function getMesseges(chatId: string): Promise<Message[]> {
  await delay(500);
  return chatMessages.find(chats => chats.chatId === chatId)?.messages || [];
}

export async function sendMessage({
  username,
  chatId,
  content
}: {
  username: string;
  chatId: string;
  content: string;
}): Promise<Message[]> {
  await delay(500);
  const msgs = await getMesseges(chatId);
  if (!msgs) {
    throw new Error("Chat not found");
  }

  const sender = users.find(u => u.username === username);
  if (!sender) throw new Error("User not found");

  const newMessage: Message = {
    sender,
    content,
    date: new Date()
  };

  msgs.push(newMessage);
  return msgs;
}