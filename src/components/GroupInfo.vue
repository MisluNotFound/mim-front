<template>
  <div class="center-container">
    <div class="group-info">
      <div class="avatar-container">
        <label for="avatarInput"
          ><img :src="avatar" alt="" class="avatar" @click="clickAvatar"
        /></label>
        <input
          v-if="showFileInput"
          type="file"
          id="avatarInput"
          style="display: none"
          @change="handleFileChange"
        />
      </div>
      <div class="error-message">{{ errorMessage }}</div>
      <div class="options">
        <span @click="showHomePage">首页</span>
        <span class="underline"></span>
        <span @click="showMembers(group.id)">群成员</span>
      </div>
      <div v-if="showHomePageFlag">
        <div class="group-details">
          <div class="detail-item">
            <span class="label">群名称:</span>
            <span class="content">{{ group.groupname }}</span>
          </div>
          <div class="detail-item">
            <span class="label">ID:</span>
            <span class="content">{{ group.id }}</span>
          </div>
          <div class="detail-item">
            <span class="label">描述:</span>
            <span class="content">{{ group.description }}</span>
          </div>
        </div>
      </div>

      <div v-if="showMembersFlag">
        <div class="members">
          <ul>
            <li
              v-for="member in members"
              :key="member.Member.ID"
              class="member-item"
              @click="showUserInfo(member)"
            >
              <img :src="member.Member.Avatar" alt="" class="avatar" />
              <span>{{ member.Member.Username }}</span>
              <span v-if="member.Role === 'owner'" class="role"> 群主 </span>
              <span v-else class="role"> 成员 </span>
              <span
                v-if="isOwner && member.Role === 'member'"
                class="remove-member-btn"
                @click="removeMember(member.Member.ID)"
                >X</span
              >
            </li>
          </ul>
        </div>
      </div>
      <div class="btns">
        <button
          v-if="!isGroupAdded"
          class="join-group-btn"
          @click="joinGroup(group.id)"
        >
          加入群聊
        </button>
        <button v-else class="send-message-btn" @click="toSession(group.id)">
          发送消息
        </button>
        <button
          v-if="isGroupAdded"
          :class="!confirmLeave ? 'leave-group-btn' : 'leave-group-btn-confirm'"
          @click="leaveGroup(group.id)"
        >
          退出群聊
        </button>
        <button
          v-if="isGroupAdded"
          :class="
            !confirmMessage
              ? 'remove-messages-btn'
              : 'remove-messages-btn-confirm'
          "
          @click="removeMessages(group.id)"
        >
          删除聊天记录
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import router from "@/router";
import store from "@/store";
import { GroupInfo, UserInfo } from "@/utils/models";
import { mapGetters } from "vuex";
import OSSClient from "@/utils/oss";
import { v4 as uuidv4 } from "uuid";
import $ from "jquery";
import { deleteChatMessage } from "@/utils/database";

export default {
  props: {
    group: {
      type: GroupInfo,
      required: true,
    },
  },
  data() {
    return {
      confirmLeave: false,
      showHomePageFlag: true,
      showMembersFlag: false,
      isGroupAdded: false,
      isOwner: false,
      showFileInput: false,
      errorMessage: "",
      confirmMessage: false,
      avatar: this.group.avatar,
    };
  },
  computed: {
    ...mapGetters({
      getMembers: "getMembers",
      getRole: "getRole",
    }),
    members() {
      return this.getMembers(this.group.id);
    },
  },
  methods: {
    showHomePage() {
      this.showHomePageFlag = true;
      this.showMembersFlag = false;
    },
    async showMembers(groupId) {
      this.showHomePageFlag = false;
      this.showMembersFlag = true;
      await store.dispatch("getRole", {
        groupId: this.group.id,
        success: (role) => {
          this.isOwner = role === "owner";
        },
      });
      store.dispatch("getMembers", {
        groupId,
        error(msg) {
          alert(msg);
        },
      });
    },
    toSession(sessionID) {
      const session = {
        Avatar: this.group.avatar,
        LastMessage: null,
        SessionID: sessionID,
        isGroup: true,
        name: this.group.groupname,
      };
      store.commit("session/addSession", {
        session: session,
        userId: store.state.user.id,
      });
      router.push({ name: "session_list" });
    },
    async showUserInfo(member) {
      const isAdd = await store.dispatch("isFriendAdded", member.Member.ID);
      const userInfo = new UserInfo();
      if (isAdd) {
        const friend = store.getters["getFriend"](member.Member.ID);
        userInfo.id = friend.Info.ID;
        userInfo.avatar = friend.Info.Avatar;
        userInfo.isAdd = true;
        userInfo.remark = friend.Remark;
        userInfo.username = friend.Info.Username;
      } else {
        userInfo.id = member.Member.ID;
        userInfo.avatar = member.Member.Avatar;
        userInfo.username = member.Member.Username;
        userInfo.isAdd = false;
      }

      this.$emit("showUserInfo", userInfo);
    },
    async joinGroup(groupId) {
      store.dispatch("joinGroup", {
        groupId,
        success: (group) => {
          alert("添加成功");
          const groupInfo = new GroupInfo(
            group.GroupID,
            group.GroupName,
            group.Description,
            group.Avatar
          );
          this.$emit("showGroupInfo", groupInfo);
        },
        error: (msg) => {
          alert(msg);
        },
      });
    },
    async leaveGroup(groupId) {
      if (!this.confirmLeave) {
        this.confirmLeave = true;
        return;
      }
      store.dispatch("leaveGroup", {
        groupId,
        success: () => {
          alert("退出成功");
          this.$emit("leaveGroup");
          this.isGroupAdded = false;
          this.confirmLeave = false;
        },
        error: (msg) => {
          this.confirmLeave = false;
          alert("退出失败 " + msg);
        },
      });
    },
    async checkGroupAdded() {
      this.isGroupAdded = await store.dispatch("isGroupAdded", this.group.id);
    },

    async clickAvatar() {
      await store.dispatch("getRole", {
        groupId: this.group.id,
        success: (role) => {
          this.isOwner = role === "owner";
        },
      });

      this.errorMessage = "";
      if (this.isOwner) {
        this.showFileInput = true;
        console.log(this.showFileInput);
      }
    },

    updateAvatar(url) {
      console.log(url);
      $.ajax({
        url: "http://localhost:3000/group/update/photo",
        headers: {
          Authorization: "Bearer " + store.state.user.token,
        },
        type: "POST",
        data: JSON.stringify({
          group_id: this.group.id.toString(),
          avatar: url,
        }),
        success(resp) {
          console.log(resp);
          if (resp.code === 1000) {
            this.avatar = url;
            store.dispatch("getGroups");
          } else {
            this.errorMessage = resp.msg;
          }
        },
        error() {
          this.errorMessage = "上传失败";
        },
      });
    },

    async handleFileChange(event) {
      const ossClient = new OSSClient();
      const file = event.target.files[0];
      const validImageTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/bmp",
      ];
      const validExtensions = ["jpeg", "jpg", "png", "gif", "bmp"];

      if (!file) {
        return;
      }

      const fileExtension = file.name.split(".").pop().toLowerCase();
      if (
        !validImageTypes.includes(file.type) ||
        !validExtensions.includes(fileExtension)
      ) {
        this.errorMessage = "文件类型无效";
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage = "文件大小过大";
        return;
      }

      const uuid = uuidv4();
      const fileName = `group/${this.group.id}/${uuid}.${fileExtension}`;
      const url = await ossClient.uploadFile(file, fileName, true);
      this.updateAvatar(url);
    },

    removeMember(userId) {
      const groupId = this.group.id;
      $.ajax({
        url: "http://localhost:3000/group/remove/member",
        type: "POST",
        headers: {
          Authorization: "Bearer " + store.state.user.token,
        },
        contentType: "application/json",
        data: JSON.stringify({
          member_id: userId.toString(),
          group_id: groupId.toString(),
        }),
        success(resp) {
          console.log(resp);
          if (resp.code === 1000) {
            store.dispatch("getMembers", {
              groupId: groupId,
              error(msg) {
                alert(msg);
              },
            });
            alert("移除成功");
          } else {
            alert(resp.msg);
          }
        },
        error() {
          alert("移除失败");
        },
      });
    },

    async removeMessages(sessionId) {
      if (!this.confirmMessage) {
        this.confirmMessage = true;
      } else {
        try {
          await deleteChatMessage(
            "GroupChatMessages",
            store.state.user.id,
            sessionId
          );
          alert("删除成功");
          store.commit("session/removeMessages", sessionId);
        } catch (error) {
          console.log(error);
          alert("删除失败");
        }
        this.confirmMessage = false;
      }
    },
  },
  watch: {
    group: {
      handler() {
        this.confirmMessage = false;
        this.confirmLeave = false;
        this.checkGroupAdded();
        store.dispatch("getRole", {
          groupId: this.group.id,
          success: (role) => {
            this.isOwner = role === "owner";
          },
        });
      },
      deep: true,
    },
  },
  async mounted() {
    this.checkGroupAdded();
    store.dispatch("getRole", {
      groupId: this.group.id,
      success: (role) => {
        this.isOwner = role === "owner";
      },
    });
  },
};
</script>

<style scoped>
.center-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.group-info {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  flex-direction: column;
  padding: 20px;
  box-sizing: border-box;
}

.avatar-container {
  margin-bottom: 20px;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 10px;
  cursor: pointer;
}

div.error-message {
  color: red;
}

.options {
  display: flex;
  align-items: center;
}

.options span {
  cursor: pointer;
}

.underline {
  border-bottom: 1px solid #000;
  margin: 0 10px;
}

.group-details {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  margin-bottom: 20px;
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

.join-group-btn {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

div.btns {
  display: flex;
  justify-content: space-between;
}

.leave-group-btn-confirm {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #cb332e;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.leave-group-btn {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #d7903f;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
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
}

.members {
  width: 100%;
}

.members ul {
  padding: 0;
  list-style-type: none;
}

.members li {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
  cursor: pointer;
}

.members li img.avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  margin-right: 10px;
}

.role {
  margin-left: 20px;
}

.remove-member-btn {
  margin-left: 20px;
  cursor: pointer;
}

.remove-member-btn:hover {
  color: red;
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
</style>
