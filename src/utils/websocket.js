import store from "@/store";
import { Message } from "./models";
import {
  addGroupChatMessage,
  addSingleChatMessage,
} from "@/utils/database"

class WebSocketService {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 3
    this.reconnectInterval = 3000
    this.connectUrl = ""
    this.shouldReconnect = true
  }

  connect(url) {
    this.connectUrl = url
    this.socket = new WebSocket(url);

    this.socket.addEventListener('open', () => {
      console.log('WebSocket connection established');
      store.commit("setConnected", true)
      store.commit('clearErrorMessage');
    });

    this.socket.addEventListener('close', (event) => {
      console.log('WebSocket connection closed', event);
      store.commit('setConnected', false);
      if (event.wasClean) {
        console.log(`Connection closed cleanly, code=${event.code}, reason=${event.reason}`);
      } else {
        console.log('Connection closed uncleanly');
      }

      store.commit('setErrorMessage', `连接已断开`);

      if (this.shouldReconnect && event.code !== WebSocket.CloseNoStatusReceived) {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          console.log(`Attempting to reconnect (attempt ${this.reconnectAttempts + 1} of ${this.maxReconnectAttempts})`);
          setTimeout(() => {
            this.connect(this.connectUrl);
          }, this.reconnectInterval);
          this.reconnectAttempts++;
        } else {
          console.log('重连失败');
        }
      }
    });

    this.socket.addEventListener('error', (event) => {
      console.error('WebSocket error', event);
    });

    this.socket.addEventListener('message', async (event) => {
      try {
        const messageText = await event.data.text();
        const message = JSON.parse(messageText);
        // 处理其他类型的消息
        const timer = formatTimestamp(message.Timer);
        const body = decodeBase64(message.Body);
        const newMessage = new Message(message.Seq, message.SenderID, message.TargetID, timer, body, message.Type, message.URL, null);
        console.log('Parsed message object:', newMessage);
        if (message.Extra) {
          // 群聊消息
          newMessage.sender = message.Extra.realSender;
        } else {
          newMessage.sender = message.SenderID;
        }
        // 将消息写入对应的session
        store.commit("session/addMessage", { sessionId: message.SenderID, message: newMessage });
        // 修改未读
        store.commit("session/addUnreadCount", message.SenderID);
        // 更新会话
        const lastMessage = updateLastMessage(newMessage);
        store.dispatch("session/updateLastRead", { lastMessage: lastMessage, sessionId: message.SenderID, userId: message.user_id });
        // 存db
        if (message.Extra) {
          addGroupChatMessage(newMessage);
        } else {
          addSingleChatMessage(newMessage);
        }
        // this.sendAckMessage(message)
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });
  }

  sendPong() {
    console.log('Sending pong');
    this.socket.send(JSON.stringify({ type: 'pong' }));
  }

  disconnect() {
    if (this.socket) {
      this.socket.close(WebSocket.CloseNoStatusReceived);
      this.socket = null;
      this.shouldReconnect = false
      store.commit("setConnected", false);
      console.log('WebSocket connection closed manually');
    }
  }

  sendMessage(message) {
    const lastMessage = {
      Timer: formatTimestamp(new Date())
    }
    if (message.Media === "text") {
      lastMessage.Content = decodeBase64(message.Body);
    } else if (message.Media === "image") {
      lastMessage.Content = "[图片]";
    } else {
      lastMessage.Content = "[文件]" + decodeBase64(message.Body);
    }

    console.log(message);

    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
      // 这里可以假设消息成功发送
      console.log('Message sent successfully');
      // 更新会话的最后读取时间
      store.dispatch("session/updateLastRead", { lastMessage: lastMessage, sessionId: message.TargetID, userId: message.SenderID });
    } else {
      console.error('WebSocket is not open. Message not sent.');
      // 处理消息未能发送的情况
      store.commit('setErrorMessage', '连接断开');
    }
  }

  sendAckMessage(message) {
    if (this.socket.readyState === WebSocket.OPEN) {
      console.log(message)
      message.Type = 4
      this.socket.send(JSON.stringify(message))
    }
  }
}

const webSocketService = new WebSocketService();
export default webSocketService;

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function decodeBase64(base64String) {
  const decodedString = atob(base64String);
  const bytes = new Uint8Array(decodedString.length);
  for (let i = 0; i < decodedString.length; i++) {
    bytes[i] = decodedString.charCodeAt(i);
  }
  const decoder = new TextDecoder("utf-8");
  return decoder.decode(bytes);
}

function updateLastMessage(message) {
  return {
    Content: message.body,
    Timer: formatTimestamp(new Date())
  }
}