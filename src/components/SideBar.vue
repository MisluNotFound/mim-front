<template>
  <div class="d-flex flex-column vh-100 bg-light">
    <div class="p-3">
      <!-- 用户头像 -->
      <img
        :src="$store.state.user.photo"
        alt=""
        class="user-avatar"
        @click="showInfo"
      />

      <ul class="nav flex-column">
        <li class="nav-item">
          <router-link
            class="nav-link"
            :to="{ name: 'session_list' }"
            :class="{ active: $route.name === 'session_list' }"
            >会话</router-link
          >
        </li>
        <li class="nav-item">
          <router-link
            class="nav-link"
            :to="{ name: 'contact_list' }"
            :class="{ active: $route.name === 'contact_list' }"
            >联系人</router-link
          >
        </li>
      </ul>
    </div>
    <MyInfo :visible="isVisible" @closeModel="closeModel" />
  </div>
</template>

<script>
import MyInfo from "@/components/MyInfo.vue";
import { ref } from "vue";
export default {
  components: {
    MyInfo,
  },
  setup() {
    const isVisible = ref(false);
    const showInfo = () => {
      isVisible.value = true;
    };

    const closeModel = () => {
      isVisible.value = false;
    };

    return {
      showInfo,
      closeModel,
      isVisible,
    };
  },
};
</script>

<style scoped>
.nav-link {
  cursor: pointer;
}

.active {
  color: #007bff;
  font-weight: bold;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-bottom: 10px;
  cursor: pointer;
}
</style>
