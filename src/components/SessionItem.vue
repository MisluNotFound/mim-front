<template>
  <div
    class="session-item"
    @click="selectSession"
    :class="{ selected: isSelected }"
  >
    <img class="avatar" :src="avatar" />
    <div class="session-info">
      <div class="session-header">
        <span class="name">{{ name }}</span>
        <span class="time">{{ time }}</span>
        <span class="close-icon" @click.stop="deleteSession">X</span>
      </div>
      <div class="session-body">
        <span class="last-message">{{ truncatedMessage }}</span>
        <span v-if="unreadCount > 0" class="unread-count">{{
          unreadCount
        }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { watchEffect } from "vue";

export default {
  name: "SessionItem",
  props: {
    session: {
      type: Object,
      required: true,
    },
    avatar: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    lastMessage: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    unreadCount: {
      type: Number,
      default: 0,
    },
    sessionId: {
      type: String,
      required: true,
    },
    selectedSessionId: {
      type: String,
      required: true,
    },
  },
  computed: {
    truncatedMessage() {
      return this.lastMessage.length > 10
        ? this.lastMessage.slice(0, 10) + "..."
        : this.lastMessage;
    },
    isSelected() {
      return this.sessionId == this.selectedSessionId;
    },
  },
  methods: {
    deleteSession() {
      this.$emit("removeSession");
    },
    selectSession() {
      this.$emit("selectSession");
      console.log(this.sessionId, this.selectedSessionId)
    },
  },
  mounted() {
    console.log("Unread count in SessionItem:", this.unreadCount);
    watchEffect(() => {
      console.log("Unread count updated in SessionItem:", this.unreadCount);
    });
  },
};
</script>

<style scoped>
.session-item {
  display: flex;
  padding: 10px;
  border-bottom: 1px solid #ddd;
  align-items: center;
  cursor: pointer; 
}

.session-item:hover {
  background-color: #f0f0f0; 
}

.session-item.selected {
  background-color: #e6e6e6; 
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 10px;
}

.session-info {
  flex: 1;
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.name {
  font-weight: bold;
}

.time {
  font-size: 12px;
  color: #999;
}

.session-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.last-message {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #666;
}

.unread-count {
  background-color: red;
  color: white;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 12px;
}

.close-icon {
  font-size: 1.2em;
  color: #888;
  cursor: pointer;
  margin-left: 10px;
}

.close-icon:hover {
  color: #ff4d4f;
}
</style>
