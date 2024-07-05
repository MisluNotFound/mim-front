<template>
  <div>
    <SessionItem
      v-for="session in sessions"
      :key="session.SessionID"
      :avatar="session.Avatar"
      :name="session.name"
      :lastMessage="session.LastMessage ? session.LastMessage.Content : ''"
      :time="session.LastMessage ? session.LastMessage.Timer : ''"
      :unreadCount="getUnreadCountById(session.SessionID)"
      :sessionId="session.SessionID"
      :selectedSessionId="selectedSessionId"
      @selectSession="$emit('selectSession', session)"
      @removeSession="removeSession(session.SessionID)"
    />
  </div>
</template>

<script>
import { useStore } from "vuex";
import { computed, onMounted } from "vue";
import SessionItem from "./SessionItem.vue";

export default {
  name: "SessionList",
  components: {
    SessionItem,
  },
  props: {
    selectedSessionId: {
      type: String,
      required: true,
    },
  },
  setup() {
    const store = useStore();

    // 从本地获取 session 并存在全局变量中
    store.dispatch("session/fetchSessions");

    const sessions = computed(() => store.state.session.sessions);
    const getUnreadCountById = (id) =>
      store.getters["session/getUnreadCountById"](id);

    const removeSession = (sessionId) => {
      console.log("remove session ", sessionId);
      store.dispatch("session/removeSession", sessionId);
    };

    // 在组件挂载时，获取未读消息数
    onMounted(async () => {
      await store.dispatch("session/fetchUnreadCounts");
    });

    return {
      sessions,
      getUnreadCountById,
      removeSession,
    };
  },
};
</script>