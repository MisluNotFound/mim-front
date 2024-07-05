<template>
  <div class="search" @click.stop>
    <input
      v-model="searchContent"
      class="search-input"
      type="text"
      :placeholder="`搜索我的${searchType === 'friends' ? '好友' : '群聊'}`"
      @focus="isDropdownVisible = true"
    />
    <span class="search-btn" @click="search">🔍</span>
    <ul v-if="isDropdownVisible && searchResults.length" class="results-list">
      <li
        v-for="(result, index) in searchResults"
        :key="index"
        @click="showInfo(result)"
      >
        {{ formatDisplayName(result) }}
      </li>
    </ul>
  </div>
</template>
<script>
import { useStore } from "vuex";
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import { GroupInfo, UserInfo } from "@/utils/models";

export default {
  props: {
    searchType: {
      type: String,
      required: true,
    },
  },

  setup(props, context) {
    const store = useStore();
    const searchContent = ref("");
    const searchResults = ref([]);
    const isDropdownVisible = ref(false);

    const search = () => {
      let result = [];
      if (props.searchType === "friends") {
        result = store.getters["getFriendByName"](searchContent.value);
      } else {
        result = store.getters["getGroupByName"](searchContent.value);
      }
      searchResults.value = result;
    };

    const hideDropdown = () => {
      isDropdownVisible.value = false;
    };

    const handleClickOutside = (event) => {
      if (!event.target.closest(".search")) {
        hideDropdown();
      }
    };

    const formatDisplayName = (result) => {
      if (props.searchType === "groups") {
        return result.GroupName;
      }

      return result.Remark
        ? `${result.Remark}（${result.Info.Username}）`
        : result.Info.Username;
    };

    const showInfo = (result) => {
      if (props.searchType === "friends") {
        const userInfo = new UserInfo(
          result.Info.ID,
          result.Remark,
          result.Info.Username,
          result.Info.Avatar,
          true
        );
        context.emit("showUserInfo", userInfo);
        searchResults.value = [];
      } else {
        const groupInfo = new GroupInfo(
          result.GroupID,
          result.GroupName,
          result.Description,
          result.Avatar
        );
        context.emit("showGroupInfo", groupInfo);
        searchResults.value = [];
      }
    };

    watch(
      () => props.searchType,
      () => {
        searchContent.value = ""; 
        searchResults.value = []; 
        isDropdownVisible.value = false; 
      }
    );

    watch(searchContent, (newValue) => {
      if (newValue.trim() === "") {
        searchResults.value = [];
        isDropdownVisible.value = false;
      } else {
        search();
        isDropdownVisible.value = true;
      }
    });

    onMounted(() => {
      document.addEventListener("click", handleClickOutside);
    });

    onBeforeUnmount(() => {
      document.removeEventListener("click", handleClickOutside);
    });

    return {
      searchContent,
      searchResults,
      isDropdownVisible,
      formatDisplayName,
      showInfo,
    };
  },
};
</script>
  
<style scoped>
.search {
  position: relative;
  width: 300px;
}

.search-input {
  border-radius: 5px;
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  box-sizing: border-box;
}

.search-btn {
  position: absolute;
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
  cursor: pointer;
}

.results-list {
  position: absolute;
  width: 100%;
  background-color: white;
  border: 1px solid #ccc;
  border-top: none;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  padding: 0;
  margin: 0;
  list-style-type: none;
}

.results-list li {
  padding: 10px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
}

.results-list li:hover {
  background-color: #f0f0f0;
}
</style>
  