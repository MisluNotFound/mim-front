<template>
  <div class="chat-panel">
    <h3>{{ refSession.value.name }}</h3>
    <div class="messages-wrapper">
      <div class="chat-container" ref="messagesContainer">
        <div class="chat-container-top">
          <LoadingSpinner v-if="isPulling" />
          <div class="pull-message" @click="pullMessages">获取历史记录</div>
        </div>

        <div
          v-for="message in messages"
          :key="message.id"
          :class="[
            'message-wrapper',
            isMyMessage(message) ? 'my-message' : 'friend-message',
          ]"
        >
          <img
            :src="
              isMyMessage(message)
                ? $store.state.user.photo
                : avatarSrc(message.sender)
            "
            class="avatar"
          />
          <div class="message-bubble">
            <template v-if="!message.type || message.type === 'text'">
              <p class="message-content">{{ message.body }}</p>
            </template>
            <template v-else-if="message.type === 'image'">
              <img :src="message.url" class="message-image" />
            </template>
            <template v-else>
              <div class="file-message" @click="downLoadFile(message)">
                <img :src="getFileIcon(message.type)" class="file-icon" />
                <span class="file-name">{{ message.body }}</span>
              </div>
              <div v-if="!message.url" class="expired">
                ❗文件已过期，无法下载
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <div class="file-btn" @click="handleFileSelect">📂</div>
    <div class="message-input">
      <textarea
        v-model="newMessage"
        placeholder="请输入"
        class="input-field"
      ></textarea>
      <button @click="clickSendMessage" class="send-button">Send</button>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed, nextTick } from "vue";
import { useStore } from "vuex";
import { Message, MessageReq } from "@/utils/models";
import webSocketService from "@/utils/websocket";
import {
  addSingleChatMessage,
  addGroupChatMessage,
  updateChatMessage,
} from "@/utils/database";
import { generateSnowflakeId } from "@/utils/snowflake";
import OSSClient from "@/utils/oss";
import { v4 as uuidv4 } from "uuid";
import LoadingSpinner from "./LoadingSpinner.vue";
import $ from "jquery";
import { decodeBase64 } from "@/utils/messages";
import { isMessageDuplicate } from "@/utils/messages";

export default {
  components: {
    LoadingSpinner,
  },
  name: "ChatPanel",
  props: {
    session: {
      type: Object,
      required: true,
    },
  },
  setup(props, {emit}) {
    const store = useStore();
    const currentUserId = store.state.user.id;
    const refSession = reactive(props.session);
    const check = async ()=> {
      if (refSession.value.isGroup) {
        const isAdded = await store.dispatch("isGroupAdded", refSession.value.SessionID)
        if (!isAdded) {
          alert("已退出群聊")
          clear()
        }
      } else {
        const isAdded = await store.dispatch("isFriendAdded", refSession.value.SessionID)
        if (!isAdded) {
          alert("未添加好友")
          clear()
        }
      }
    }

    const clear = () => {
      emit("clearSelectedItem")
    }

    check()

    let messages = computed(
      () => store.state.session.messages[refSession.value.SessionID]
    );
    const handleFileSelect = () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*, .pdf, .doc, .docx, .txt";
      input.multiple = false;
      input.onchange = (e) => {
        sendFile(e.target.files[0]);
      };
      input.click();
    };

    const avatarSrc = (userId) => {
      if (refSession.value.isGroup) {
        const member = store.getters.getMember({
          userId: userId,
          groupId: refSession.value.SessionID,
        });
        console.log(member);
        return member ? member.Member.Avatar : "";
      } else {
        return refSession.value.Avatar;
      }
    };

    console.log(refSession.value);
    const sendFile = async (file) => {
      const ossClient = new OSSClient();
      const fileExtension = file.name.split(".").pop().toLowerCase();
      const uuid = uuidv4();
      const fileName = `${
        refSession.value.isGroup
          ? "group_chat"
          : `single_chat/${
              refSession.value.SessionID > store.state.user.id
                ? `${store.state.user.id}_${refSession.value.SessionID}`
                : `${refSession.value.SessionID}_${store.state.user.id}`
            }`
      }/${uuid}.${fileExtension}`;

      const fileType = getFileType(fileExtension);
      if (!fileType) {
        alert("文件类型无效");
        return;
      }
      let url = await ossClient.uploadFile(
        file,
        fileName,
        fileType === "image"
      );
      6;
      const body = btoa(
        encodeURIComponent(file.name).replace(/%([0-9A-F]{2})/g, (match, p1) =>
          String.fromCharCode("0x" + p1)
        )
      );

      const seq = generateSnowflakeId();
      const type = refSession.value.isGroup ? 3 : 2;
      const message = new MessageReq(
        seq,
        store.state.user.id,
        refSession.value.SessionID.toString(),
        null,
        type,
        body,
        fileType,
        url
      );
      console.log(type);
      webSocketService.sendMessage(message);

      const storeMessage = new Message(
        seq,
        refSession.value.SessionID,
        store.state.user.id,
        new Date(),
        file.name,
        fileType,
        url,
        store.state.user.id
      );

      store.commit("session/addMessage", {
        sessionId: message.TargetID,
        message: storeMessage,
      });

      if (type === 2) {
        addSingleChatMessage(storeMessage);
      } else if (type == 3) {
        addGroupChatMessage(storeMessage);
      }
    };

    function getFileType(fileExtension) {
      const extension = fileExtension.toLowerCase();

      if (/^(jpg|jpeg|png|gif|bmp|webp)$/i.test(extension)) {
        return "image";
      } else if (/^(doc|docx)$/i.test(extension)) {
        return "word";
      } else if (/^(xls|xlsx)$/i.test(extension)) {
        return "excel";
      } else if (/^(pdf)$/i.test(extension)) {
        return "pdf";
      } else if (/^(ppt|pptx)$/i.test(extension)) {
        return "ppt";
      } else {
        return null;
      }
    }

    function getFileIcon(fileType) {
      return require(`@/assets/${fileType}.png`);
    }

    const newMessage = ref("");
    const isMyMessage = (message) => {
      return message.sender == currentUserId;
    };

    const clickSendMessage = () => {
      if (newMessage.value.trim() === "") {
        return;
      }
      const type = refSession.value.isGroup ? 3 : 2;
      const seq = generateSnowflakeId();
      const body = btoa(
        encodeURIComponent(newMessage.value).replace(
          /%([0-9A-F]{2})/g,
          (match, p1) => String.fromCharCode("0x" + p1)
        )
      );
      const message = new MessageReq(
        seq,
        store.state.user.id,
        String(refSession.value.SessionID),
        null,
        type,
        body,
        "text"
      );
      webSocketService.sendMessage(message);
      const storeMessage = new Message(
        seq,
        refSession.value.SessionID,
        store.state.user.id,
        null,
        newMessage.value,
        null,
        null,
        store.state.user.id
      );
      store.commit("session/addMessage", {
        sessionId: refSession.value.SessionID,
        message: storeMessage,
      });
      if (type === 2) {
        addSingleChatMessage(storeMessage);
      } else if (type == 3) {
        addGroupChatMessage(storeMessage);
      }
      newMessage.value = "";
      nextTick(() =>
        setTimeout(() => {
          scrollToBottom();
        }, 100)
      );
    };

    const downLoadFile = async (message) => {
      if (!message.url) {
        alert("文件已过期");
      }

      const ossClient = new OSSClient();
      let url = "";
      try {
        url = await ossClient.getFileUrl(message.url);
      } catch (error) {
        alert("文件已过期");
        const storeName = refSession.value.isGroup
          ? "GroupChatMessages"
          : "SingleChatMessages";
        message.url = "";
        updateChatMessage(storeName, message.id, message);
        return;
      }
      const fileName = message.body;
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("文件下载失败");
        }
        const blob = await response.blob();
        const objectURL = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = objectURL;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(objectURL);
      } catch (error) {
        alert("下载失败");
      }
    };

    const isPulling = ref(false);

    const pullMessages = () => {
      isPulling.value = true;
      $.ajax({
        url: "http://localhost:3000/message/pull",
        type: "GET",
        headers: {
          Authorization: "Bearer " + store.state.user.token,
        },
        data: {
          last_seq: messages.value.length ? messages.value[0].id : 0,
          target_id: refSession.value.SessionID,
          size: 10,
          is_group: refSession.value.isGroup,
        },
        success(resp) {
          if (resp.code === 1000 && resp.data) {
            const messages = resp.data.map(function (message) {
              return {
                body: decodeBase64(message.Content),
                id: message.Seq,
                sender: message.Extra
                  ? message.Extra.realSender
                  : message.SenderID,
                session_id: refSession.value.SessionID,
                timer: message.Timer,
                type: message.Type,
                url: message.URL,
                user_id: store.state.user.id,
              };
            });

            messages.forEach((message) => {
              if (!isMessageDuplicate(message.id, refSession.value.SessionID)) {
                if (refSession.value.isGroup) {
                  addGroupChatMessage(message);
                } else {
                  addSingleChatMessage(message);
                }
              }
            });
            store.commit("session/addMessagesToTop", {
              sessionId: refSession.value.SessionID,
              messages: messages,
            });
          }
          isPulling.value = false;
        },
        error(resp) {
          isPulling.value = false;
          console.log(resp);
        },
      });
    };

    const messagesContainer = ref(null);

    const scrollToBottom = () => {
      messagesContainer.value.scrollTo({
        top: messagesContainer.value.scrollHeight,
        behavior: "smooth",
      });
    };

    onMounted(() => {
      scrollToBottom();
    });

    return {
      currentUserId,
      isMyMessage,
      newMessage,
      clickSendMessage,
      refSession,
      messagesContainer,
      messages,
      handleFileSelect,
      sendFile,
      getFileIcon,
      downLoadFile,
      pullMessages,
      isPulling,
      avatarSrc,
    };
  },
};
</script>


<style scoped>
.chat-container-top {
  display: flex;
  justify-content: center;
}

.chat-panel {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

h3 {
  margin: 0;
  padding-bottom: 10px;
  border-bottom: 1px solid #ddd;
}

.messages-wrapper {
  flex: 1;
}

.chat-container {
  max-height: 500px;
  overflow-y: auto;
}

.message-container {
  display: flex;
  flex-direction: column;
}

.message-wrapper {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.my-message {
  flex-direction: row-reverse;
}

.friend-message {
  flex-direction: row;
  justify-content: flex-start;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin: 0 10px;
}

.message-bubble {
  max-width: 60%;
  padding: 10px;
  border-radius: 10px;
  background-color: #f1f1f1;
  position: relative;
}

.my-message .message-bubble {
  background-color: #dcf8c6;
}

.message-content {
  margin: 0;
  word-wrap: break-word;
}

.message-input {
  padding: 10px;
  display: flex;
  align-items: center;
}

.file-btn {
  padding-left: 5px;
  cursor: pointer;
  font-size: 30px;
}

.input-field {
  flex: 1;
  padding: 10px;
  font-size: 16px;
}

.send-button {
  margin-left: 20px;
  padding: 10px 20px;
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.message-image {
  max-width: 100%;
  height: auto;
  border-radius: 10px;
  object-fit: cover;
}

.file-message {
  cursor: pointer;
  display: flex;
  align-items: center;
}

.send-button:hover {
  background-color: #0056b3;
}

.file-icon {
  width: 40px;
  height: 40px;
  cursor: pointer;
  margin-right: 10px;
}

.file-name {
  cursor: pointer;
}

.expired {
  padding-top: 5px;
  font-size: 10px;
  color: red;
}

.pull-message {
  cursor: pointer;
  padding-top: 10px;
  margin-left: 5px;
  font-size: 13px;
  color: rgb(0, 123, 255);
}
</style>
