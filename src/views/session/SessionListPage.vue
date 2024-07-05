<template>
  <div class="session-container">
    <Sidebar />
    <div class="sidebar">
      <SessionList
        class="mr-auto"
        :selectedSessionId="selectedSessionId"
        @selectSession="selectSession"
      />
    </div>
    <ChatPanel
      @clearSelectedItem="clearSelectedItem"
      v-if="selectedSessionId !== 0 && dataLoaded"
      :session="selectedSession"
    />
  </div>
</template>

<script>
import { Message } from "@/utils/models";
import Sidebar from "@/components/SideBar.vue";
import $ from "jquery";
import SessionList from "@/components/SessionList.vue";
import ChatPanel from "@/components/ChatPanel.vue";
import { ref, reactive } from "vue";
import { useStore } from "vuex";
import {
  getSingleChatMessages,
  getGroupChatMessages,
  addSingleChatMessage,
  addGroupChatMessage,
} from "@/utils/database";
import { isMessageDuplicate } from "@/utils/messages";

export default {
  components: {
    Sidebar,
    SessionList,
    ChatPanel,
  },

  setup() {
    const store = useStore();

    const selectedSessionId = ref(0);
    const selectedSession = reactive({});
    const dataLoaded = ref(false);

    const clearSelectedItem = () => {
      selectedSessionId.value = 0;
      selectedSession.value = {};
    };

    const selectSession = async (session) => {
      dataLoaded.value = false;
      console.log(session);
      const hasOfflineMessages = store.getters["session/hasOfflineMessages"](
        session.SessionID
      );

      if (session.isGroup) {
        await loadGroupChatMessages(store.state.user.id, session.SessionID);
      } else {
        await loadSingleChatMessages(store.state.user.id, session.SessionID);
      }

      if (hasOfflineMessages) {
        await fetchOfflineMessages(session.SessionID, session.isGroup);
      } else {
        dataLoaded.value = true;
      }

      await store.dispatch("session/updateUnreadCount", {
        sessionId: session.SessionID,
        count: 0,
      });
      await store.dispatch("session/markSessionAsRead", session.SessionID);

      selectedSessionId.value = session.SessionID;
      selectedSession.value = session;
    };
    const fetchOfflineMessages = async (sessionId, isGroup) => {
      $.ajax({
        url: "http://localhost:3000/message/pulloffline",
        method: "post",
        headers: {
          Authorization: `Bearer ` + store.state.user.token,
        },
        contentType: "application/json",
        data: JSON.stringify({
          session_id: sessionId,
          is_group: isGroup,
        }),
        success: async (resp) => {
          console.log(resp);
          if (resp.code == 1000 && resp.data) {
            await processNewMessages(resp.data, isGroup);
          } else {
            console.log(resp.msg);
          }
        },
        error: (resp) => {
          console.error("fetchOfflineMessages error:", resp);
        },
      });
    };

    async function processNewMessages(newMessages, isGroup) {
      console.log("process message", newMessages);
      newMessages.forEach((messageData) => {
        const messageContent = decodeBase64(messageData.Content);
        const messageTimer = formatTimestamp(messageData.Timer);

        console.log("processed message content", messageContent);
        const message = new Message(
          messageData.Seq,
          null,
          store.state.user.id,
          messageTimer,
          messageContent,
          messageData.Type,
          messageData.URL,
          messageData.SenderID
        );

        if (isGroup) {
          message.session_id = messageData.TargetID;
        } else {
          message.session_id = messageData.SenderID;
        }

        if (!isMessageDuplicate(message.id, message.session_id)) {
          store.commit("session/addMessage", {
            sessionId: message.session_id,
            message: message,
          });
          if (isGroup) {
            addGroupChatMessage(message);
          } else {
            addSingleChatMessage(message);
          }
        }
      });

      dataLoaded.value = true;
    }

    const loadSingleChatMessages = async (userId, sessionId) => {
      console.log(userId, sessionId);
      try {
        const messages = await getSingleChatMessages(userId, sessionId);
        console.log("loaded single chat messages:", messages);
        store.commit("session/addMessages", {
          sessionId: sessionId,
          messages: messages,
        });
      } catch (error) {
        console.error("获取单聊消息失败:", error);
      }
    };

    const loadGroupChatMessages = async (userId, sessionId) => {
      console.log(userId, sessionId);
      try {
        const messages = await getGroupChatMessages(userId, sessionId);
        console.log("loaded group chat messages:", messages);
        store.commit("session/addMessages", {
          sessionId: sessionId,
          messages: messages,
        });
      } catch (error) {
        console.error("获取群聊消息失败:", error);
      }
    };

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

    return {
      selectedSession,
      selectedSessionId,
      selectSession,
      dataLoaded,
      clearSelectedItem,
    };
  },
};
</script>

<style scoped>
.session-container {
  display: flex;
  justify-content: flex-start;
  width: 100%;
}

.sidebar {
  border-right: 1px solid #ddd;
}
</style>
