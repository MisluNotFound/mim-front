<template>
  <div v-if="isVisible" class="modal-overlay" @click="close">
    <div class="modal-content" @click.stop>
      <div class="info-header">
        <div class="title">个人信息</div>
        <div class="close-btn" @click="close">X</div>
      </div>
      <div class="info-item">
        <label for="avatarInput">
          <img
            :src="$store.state.user.photo"
            alt="user photo"
            class="photo"
            @click="openFileInput"
          />
        </label>
        <input
          v-if="showFileInput"
          type="file"
          id="avatarInput"
          style="display: none"
          @change="handleFileChange"
        />
      </div>
      <div class="error-message">{{ errorMessage }}</div>
      <div class="info-item">
        <span class="info-label">用户名:</span>
        <span class="info-value"
          ><div class="username" @click="editUsername">
            {{ $store.state.user.username }}
          </div></span
        >
      </div>
      <div v-if="showUsernameModal" class="modal">
        <div class="modal-content">
          <h5>修改用户名</h5>
          <input
            v-model="newUsername"
            placeholder="请输入新用户名"
            class="input"
          />
          <div class="error-message">{{ usernameError }}</div>
          <div class="btns">
            <button @click="updateUsername" class="save-btn">保存</button>
            <button @click="showUsernameModal = false" class="cancel-btn">
              取消
            </button>
          </div>
        </div>
      </div>
      <div class="info-item">
        <span class="info-label">账号:</span>
        <span class="info-value">{{ $store.state.user.id }}</span>
      </div>
      <div class="btns">
        <button class="update-password-btn" @click="editPassword">
          修改密码
        </button>
        <button class="logout" @click="logout">退出登录</button>
      </div>
      <div v-if="showPasswordModal" class="modal">
        <div class="modal-content">
          <h5>修改密码</h5>
          <span>原密码</span
          ><input
            v-model="oldPassword"
            placeholder=""
            class="input"
            type="password"
          />
          <span>新密码</span
          ><input
            v-model="newPassword"
            placeholder=""
            class="input"
            type="password"
          />
          <span>确认新密码</span
          ><input
            v-model="confirmPassword"
            placeholder=""
            class="input"
            type="password"
          />
          <div class="error-message">{{ passwordError }}</div>
          <div class="btns">
            <button @click="updatePassword" class="save-btn">保存</button>
            <button @click="showPasswordModal = false" class="cancel-btn">
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch } from "vue";
import { v4 as uuidv4 } from "uuid";
import OSSClient from "@/utils/oss";
import $ from "jquery";
import { useStore } from "vuex";
import router from "@/router";

export default {
  name: "UserModal",
  props: {
    visible: {
      type: Boolean,
      required: true,
    },
  },
  emits: ["closeModel"],
  setup(props, { emit }) {
    const store = useStore();
    const isVisible = ref(props.visible);
    const showFileInput = ref(false);
    const ossClient = new OSSClient();
    const errorMessage = ref("");
    watch(
      () => props.visible,
      (newVal) => {
        isVisible.value = newVal;
      }
    );

    const close = () => {
      isVisible.value = false;
      emit("closeModel", false);
    };

    const openFileInput = () => {
      errorMessage.value = "";
      showFileInput.value = true;
    };

    const handleFileChange = async (event) => {
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
        errorMessage.value = "文件类型无效";
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        console.log(file.size);
        errorMessage.value = "文件大小过大";
        return;
      }

      const uuid = uuidv4();
      const fileName = `user/${store.state.user.id}/${uuid}.${fileExtension}`;
      const url = await ossClient.uploadFile(file, fileName, true);
      updateAvatar(url);
    };

    const updateAvatar = (url) => {
      $.ajax({
        url: "http://localhost:3000/user/update/photo",
        headers: {
          Authorization: "Bearer " + store.state.user.token,
        },
        type: "POST",
        data: JSON.stringify({
          avatar: url,
        }),
        success(resp) {
          if (resp.code === 1000) {
            const oldPhoto = store.state.user.photo;
            console.log(oldPhoto);
            store.commit("updatePhoto", url);
            // if (oldPhoto != "") {
            //   ossClient.deleteFile(oldPhoto);
            // }
          } else {
            errorMessage.value = resp.msg;
          }
        },
        error() {
          errorMessage.value = "上传失败";
        },
      });
    };

    const showUsernameModal = ref(false);
    const showPasswordModal = ref(false);
    const newUsername = ref("");
    const usernameError = ref("");
    const passwordError = ref("");
    const oldPassword = ref("");
    const newPassword = ref("");
    const confirmPassword = ref("");
    const editUsername = () => {
      showUsernameModal.value = true;
    };

    const updateUsername = () => {
      usernameError.value = "";
      if (newUsername.value.trim().length === 0) {
        usernameError.value = "请输入新用户名";
        return;
      }

      if (newUsername.value.trim().length > 10) {
        usernameError.value = "长度不能大于10";
        return;
      }
      store.dispatch("updateUsername", {
        username: newUsername.value,
        error(errorMessage) {
          usernameError.value = errorMessage;
          newUsername.value = "";
        },
        success() {
          showUsernameModal.value = false;
          alert("修改成功");
        },
      });
    };

    const updatePassword = () => {
      passwordError.value = "";
      newPassword.value = newPassword.value.trim();
      oldPassword.value = oldPassword.value.trim();
      confirmPassword.value = confirmPassword.value.trim();
      if (newPassword.value.length === 0) {
        passwordError.value = "请输入新密码";
        return;
      }
      if (oldPassword.value.length === 0) {
        passwordError.value = "请输入原密码";
        return;
      }
      if (confirmPassword.value.length === 0) {
        passwordError.value = "请确认密码";
        return;
      }

      store.dispatch("updatePassword", {
        oldPassword: oldPassword.value,
        newPassword: newPassword.value,
        confirmPassword: confirmPassword.value,
        error(errorMessage) {
          passwordError.value = errorMessage;
        },
        success() {
          showPasswordModal.value = false;
          alert("修改成功");
        },
      });
    };

    const logout = () => {
      store.dispatch("logout");
      router.push({ name: "user_login" });
    };

    const editPassword = () => {
      showPasswordModal.value = true;
    };
    return {
      isVisible,
      close,
      openFileInput,
      handleFileChange,
      showFileInput,
      errorMessage,
      editUsername,
      showUsernameModal,
      editPassword,
      showPasswordModal,
      updateUsername,
      newUsername,
      usernameError,
      oldPassword,
      newPassword,
      confirmPassword,
      updatePassword,
      passwordError,
      logout,
    };
  },
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40%;
  height: auto;
  max-height: 70%;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 20px;
  text-align: left;
  width: 100%;
  max-height: 100%;
  overflow-y: auto;
}

.photo {
  max-height: 100px;
  max-width: 100px;
  cursor: pointer;
}

.info-header {
  display: flex;
  justify-content: space-between;
}

.close-btn {
  color: rgb(171, 167, 167);
  font-size: 20px;
  cursor: pointer;
}

.close-btn:hover {
  color: rgb(117, 176, 196);
}

.info-item {
  display: flex;
  justify-content: flex-start;
  margin: 10px 0;
}

.info-label {
  width: 100px;
  font-weight: bold;
  text-align: left;
}

.info-value {
  flex: 1;
  text-align: left;
}

.username {
  cursor: pointer;
}

button {
  margin-top: 20px;
}

div.error-message {
  color: red;
  font-size: 15px;
}

span {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #555;
}

.input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.update-password-btn {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #23d488;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.btns {
  display: flex;
  justify-content: space-between;
}

.save-btn {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #14ce33;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.logout {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: lightgray;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.cancel-btn {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #ea0303;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
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
</style>
