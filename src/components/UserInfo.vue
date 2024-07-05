<template>
  <div class="user-info">
    <div class="avatar-container">
      <img :src="user.avatar" alt="" class="avatar" />
    </div>
    <div class="user-details">
      <div class="detail-item">
        <span class="label" v-if="user.isAdd">备注:</span>
        <span class="content" v-if="user.isAdd">
          {{ localRemark }}
          <i class="edit-icon" @click="showEditModal = true">✏️</i>
        </span>
      </div>
      <div class="detail-item">
        <span class="label">用户名:</span>
        <span class="content">{{ user.username }}</span>
      </div>
      <div class="detail-item">
        <span class="label">账号:</span>
        <span class="content">{{ user.id }}</span>
      </div>
    </div>
    <div class="btns">
      <button
        v-if="user.isAdd"
        class="send-message-btn"
        @click="toSession(user.id)"
      >
        发送消息
      </button>
      <button
        v-if="!user.isAdd"
        class="send-message-btn"
        @click="addFriend(user.id)"
      >
        添加好友
      </button>
      <button
        v-if="user.isAdd"
        :class="!confirm ? 'remove-friend-btn' : 'remove-friend-btn-confirm'"
        @click="removeFriend(user.id)"
      >
        删除好友
      </button>
      <button
        v-if="user.isAdd"
        :class="
          !confirmMessage
            ? 'remove-messages-btn'
            : 'remove-messages-btn-confirm'
        "
        @click="removeMessages(user.id)"
      >
        删除聊天记录
      </button>
    </div>
    <div class="error-message">{{ errorMessage }}</div>

    <!-- 修改备注弹窗 -->
    <div v-if="showEditModal" class="modal">
      <div class="modal-content">
        <h3>修改备注</h3>
        <textarea v-model="newRemark" placeholder="请输入新的备注"></textarea>
        <button @click="saveRemark">保存</button>
        <button @click="showEditModal = false">取消</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch } from "vue";
import $ from "jquery";
import { useStore } from "vuex";
import router from "@/router";
import { UserInfo } from "@/utils/models";
import { deleteChatMessage } from "@/utils/database";
export default {
  props: {
    user: {
      type: UserInfo,
      required: true,
    },
  },
  emits: ["clearUserInfo"],
  setup(props, { emit }) {
    const showEditModal = ref(false);
    var newRemark = ref(props.user.remark);
    const localRemark = ref(props.user.remark);
    const store = useStore();
    const confirm = ref(false);

    const saveRemark = () => {
      const r = newRemark.value;
      $.ajax({
        url: "http://localhost:3000/friend/update/remark",
        headers: {
          Authorization: "Bearer " + store.state.user.token,
        },
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify({
          name: newRemark.value,
          friend_id: props.user.id,
        }),
        success(resp) {
          if (resp.code === 1000) {
            alert("修改成功");
            localRemark.value = r;
          } else {
            alert(resp.msg);
          }
        },
        error(resp) {
          console.error(resp);
        },
      });
      newRemark.value = "";
      showEditModal.value = false;
    };

    const toSession = (sessionID) => {
      const session = {
        LastMessage: null,
        SessionID: sessionID,
        isGroup: false,
        name: localRemark.value ? localRemark.value : props.user.username,
        Avatar: props.user.avatar,
      };
      store.commit("session/addSession", {
        session: session,
        userId: store.state.user.id,
      });
      router.push({ name: "session_list" });
    };

    const errorMessage = ref("");
    watch(
      () => props.user,
      () => {
        errorMessage.value = "";
        confirm.value = "";
        localRemark.value = props.user.remark;
        newRemark.value = props.user.remark;
        confirmMessage.value = false;
      }
    );
    const addFriend = (userId) => {
      store.dispatch("addFriend", {
        userId,
        error(msg) {
          errorMessage.value = msg;
        },
      });
    };

    const removeFriend = (userId) => {
      if (!confirm.value) {
        confirm.value = true;
      } else {
        store.dispatch("removeFriend", {
          userId,
          error(msg) {
            errorMessage.value = msg;
          },
          // 清理操作
          success() {
            emit("clearUserInfo");
          },
        });
        confirm.value = false;
      }
    };

    const confirmMessage = ref(false);
    const removeMessages = async (sessionId) => {
      if (!confirmMessage.value) {
        confirmMessage.value = true;
      } else {
        confirmMessage.value = false;
        try {
          await deleteChatMessage(
            "SingleChatMessages",
            store.state.user.id,
            sessionId
          );
          alert("删除成功");
          store.commit("session/removeMessages", sessionId);
        } catch (error) {
          console.log(error);
          alert("删除失败");
        }
      }
    };

    return {
      showEditModal,
      newRemark,
      saveRemark,
      localRemark,
      toSession,
      addFriend,
      errorMessage,
      removeFriend,
      confirm,
      removeMessages,
      confirmMessage,
    };
  },
};
</script>

<style scoped>
.user-info {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.avatar-container {
  margin-bottom: 20px;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 10px;
}

.user-details {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
}

.detail-item {
  margin-bottom: 10px;
}

.label {
  font-weight: bold;
}

.content {
  margin-left: 10px;
  color: #333;
  display: flex;
  align-items: center;
}

.edit-icon {
  margin-left: 10px;
  cursor: pointer;
}

.send-message-btn {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.remove-friend-btn {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #e18e29;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.remove-friend-btn-confirm {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #e13829;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.remove-messages-btn {
  margin-top: 20px;
  background-color: lightgray;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.remove-messages-btn-confirm {
  margin-top: 20px;
  background-color: rgb(247, 137, 19);
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.btns {
  display: flex;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 5px;
  width: 300px;
  text-align: center;
}

textarea {
  width: 100%;
  height: 100px;
  margin-bottom: 20px;
}

button {
  margin: 0 10px;
}

div.error-message {
  color: red;
}
</style>
