<template>
  <div class="create-group">
    <button class="create-group-btn" @click="showCreateModal = true">
      新建群聊
    </button>

    <div v-if="showCreateModal" class="modal">
      <div class="modal-content">
        <h5>新建群聊</h5>
        <input v-model="groupName" placeholder="请输入群名称" type="text" />
        <textarea v-model="description" placeholder="请输入简介" type="text">
        </textarea>
        <button @click="createGroup" class="save-btn">保存</button>
        <button @click="showCreateModal = false" class="cancel-btn">
          取消
        </button>
      </div>
    </div>
  </div>
</template>
  
  <script>
import { ref } from "vue";
import $ from "jquery";
import { useStore } from "vuex";
import { GroupInfo } from "@/utils/models";

export default {
  setup(props, { emit }) {
    const showCreateModal = ref(false);
    const groupName = ref("");
    const description = ref("");
    const errorMessage = ref("");
    const store = useStore();

    const createGroup = () => {
      groupName.value = groupName.value.trim();
      description.value = description.value.trim();
      if (groupName.value.length === 0) {
        errorMessage.value = "请输入群名称";
        return;
      }

      if (groupName.value.length > 10) {
        errorMessage.value = "名称长度不能超过10";
        return;
      }
      if (description.value.length > 50) {
        errorMessage.value = "简介长度不能超过50";
        return;
      }

      $.ajax({
        url: "http://localhost:3000/group/new",
        type: "POST",
        headers: {
          Authorization: "Bearer " + store.state.user.token,
        },
        data: JSON.stringify({
          group_name: groupName.value,
          description: description.value,
        }),
        success(resp) {
          if (resp.code === 1000) {
            const group = new GroupInfo(
              resp.data.GroupID,
              resp.data.GroupName,
              resp.data.Avatar
            );
            showCreateModal.value = false;
            store.dispatch("getGroups");
            errorMessage.value = "";
            groupName.value = "";
            description.value = "";
            emit("showGroupInfo", group);
          } else {
            errorMessage.value = resp.msg;
          }
        },
      });
    };

    return {
      showCreateModal,
      groupName,
      createGroup,
      description,
    };
  },
};
</script>
  
  <style scoped>
.create-group {
  text-align: center;
  margin-top: 20px;
}

.create-group-btn {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #2553b5;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.modal textarea {
  border-radius: 4px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal {
  background: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.modal input {
  display: block;
  width: 100%;
  margin: 10px 0;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.modal button {
  border-radius: 4px;
  margin: 5px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  color: white;
  border: none;
}

.save-btn {
  background-color: green;
}

.cancel-btn {
  background: rgb(233, 139, 33);
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
</style>
  