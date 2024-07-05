<template>
  <div class="contact-container">
    <SideBar />
    <div class="sidebar">
      <div class="sidebar-options">
        <div
          class="sidebar-option"
          :class="{ active: selectedTab === 'friends' }"
          @click="selectTab('friends')"
        >
          好友
        </div>
        <div
          class="sidebar-option"
          :class="{ active: selectedTab === 'groups' }"
          @click="selectTab('groups')"
        >
          群聊
        </div>
      </div>
      <div class="search-content">
        <input
          type="text"
          class="search-input"
          :placeholder="`请输入${
            selectedTab === 'friends' ? '用户' : '群聊'
          }账号`"
          v-model="searchId"
        />
        <span class="search-btn" @click="search">🔍</span>
      </div>
      <div class="content-below">
        <SearchInput
          :searchType="selectedTab"
          @showUserInfo="showUserInfo"
          @showGroupInfo="showGroupInfo"
        />
        <div v-if="selectedTab === 'friends'">
          <ul class="contact-list">
            <li
              v-for="friend in friends"
              :key="friend.id"
              @click="selectUser(friend)"
            >
              <img :src="friend.Info.Avatar" alt="" class="avatar" />
              <span>{{
                friend.Remark != "" ? friend.Remark : friend.Info.Username
              }}</span>
            </li>
          </ul>
        </div>
        <div v-else-if="selectedTab === 'groups'">
          <ul class="group-list">
            <li
              v-for="group in groups"
              :key="group.id"
              @click="selectGroup(group)"
            >
              <img :src="group.Avatar" alt="" class="avatar" />
              <span>{{ group.GroupName }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div class="content-area">
      <UserInfos
        v-if="selectedItem && selectedTab === 'friends'"
        :user="selectedItem"
        @clearUserInfo="clearUserInfo"
      />
      <GroupInfos
        v-if="selectedItem && selectedTab === 'groups'"
        :group="selectedItem"
        @showUserInfo="showUserInfo"
        @refreshFriends="refreshFriends"
        @leaveGroup="clearGroupInfo"
        @showGroupInfo="showGroupInfo"
      />
      <CreateGroup v-if="!selectedItem" @showGroupInfo="showGroupInfo" />
    </div>
  </div>
</template>

<script>
import SideBar from "@/components/SideBar.vue";
import UserInfos from "@/components/UserInfo.vue";
import GroupInfos from "@/components/GroupInfo.vue";
import SearchInput from "@/components/SearchInput.vue";
import { useStore } from "vuex";
import { onMounted, ref, computed } from "vue";
import { UserInfo, GroupInfo } from "@/utils/models";
import $ from "jquery";
import CreateGroup from "../../components/CreateGroup.vue";

export default {
  components: {
    SideBar,
    UserInfos,
    GroupInfos,
    SearchInput,
    CreateGroup,
  },
  setup() {
    const selectedTab = ref("friends");
    const store = useStore();
    const selectedItem = ref(null);
    const searchId = ref();

    const fetchFriends = () => {
      store.dispatch("getFriends");
    };

    const fetchGroups = () => {
      store.dispatch("getGroups");
    };

    onMounted(() => {
      fetchFriends();
      fetchGroups();
    });

    const friends = computed(() => store.state.friend.friends);
    const groups = computed(() => store.state.group.groups);

    const selectTab = (tab) => {
      selectedTab.value = tab;
      console.log(selectedTab.value);
      selectedItem.value = null;
    };

    const selectUser = (item) => {
      const userInfo = new UserInfo(
        item.Info.ID,
        item.Remark,
        item.Info.Username,
        item.Info.Avatar,
        true
      );
      selectedItem.value = userInfo;
    };

    const selectGroup = (item) => {
      const groupInfo = new GroupInfo(
        item.GroupID,
        item.GroupName,
        item.Description,
        item.Avatar
      );
      selectedItem.value = groupInfo;
    };

    const showUserInfo = (user) => {
      selectedTab.value = "friends";
      console.log("showUserInfo", user)
      selectedItem.value = user;
    };

    const showGroupInfo = (group) => {
      selectedTab.value = "groups";
      selectedItem.value = group;
    };

    const search = async () => {
      var data;
      var url = "";
      if (selectedTab.value === "friends") {
        // 先看加没加
        const isAdd = await store.dispatch("isFriendAdded", searchId.value);
        if (isAdd) {
          // 直接显示
          const friend = store.getters["getFriend"](searchId.value);
          const userInfo = new UserInfo(
            friend.Info.ID,
            friend.Remark,
            friend.Info.Username,
            friend.Info.Avatar,
            true
          );
          showUserInfo(userInfo);
          return;
        } else {
          url = "http://localhost:3000/friend/find";
          data = {
            user_id: searchId.value,
          };
        }
      } else {
        // 先看加没加
        const isAdd = await store.dispatch("isGroupAdded", searchId.value);
        // 直接显示
        if (isAdd) {
          const group = store.getters["getGroup"](searchId.value);
          selectGroup(group);
          return;
        } else {
          url = "http://localhost:3000/group/find";
          data = {
            group_id: searchId.value,
          };
        }
      }

      $.ajax({
        url: url,
        headers: {
          Authorization: "Bearer " + store.state.user.token,
        },
        data: data,
        method: "GET",
        success(resp) {
          if (resp.code === 1000 && resp.data) {
            if (selectedTab.value === "friends") {
              const user = new UserInfo(
                resp.data.ID,
                "",
                resp.data.Username,
                resp.data.Avatar,
                false
              );
              showUserInfo(user);
            } else if (selectedTab.value === "groups") {
              const group = new GroupInfo(
                resp.data.GroupID,
                resp.data.GroupName,
                resp.data.Description,
                resp.data.Avatar
              );
              showGroupInfo(group);
            }
          } else {
            alert("目标不存在");
          }
        },
        error() {
          alert("目标不存在");
        },
      });
    };
    const refreshFriends = () => {
      friends.value = store.state.friend.friends;
    };

    const clearUserInfo = () => {
      selectedTab.value = "friends";
      selectedItem.value = null;
    };

    const clearGroupInfo = () => {
      selectedTab.value = "groups";
      selectedItem.value = null;
    };

    return {
      selectedItem,
      selectedTab,
      selectTab,
      friends,
      groups,
      selectUser,
      selectGroup,
      showUserInfo,
      searchId,
      search,
      clearUserInfo,
      refreshFriends,
      showGroupInfo,
      clearGroupInfo,
    };
  },
};
</script>

<style scoped>
.contact-container {
  display: flex;
  height: 100vh;
  width: 100%;
}

.sidebar {
  display: flex;
  flex-direction: column;
  width: 300px;
}

.sidebar-options {
  display: flex;
  flex-direction: row;
  justify-content: center;
  margin-bottom: 10px;
}

.sidebar-option {
  cursor: pointer;
  padding: 10px 20px;
  border-radius: 5px;
}

.sidebar-option.active {
  background-color: #e0e0e0;
}

.content-below {
  flex: 1;
  margin-top: 20px;
}

.contact-list,
.group-list {
  overflow-y: auto;
  list-style-type: none;
  padding: 0;
  margin-top: 10px;
}

.avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  margin-right: 10px;
}

li {
  cursor: pointer;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 5px;
  background-color: #f0f0f0;
}

li:hover {
  background-color: #e0e0e0;
}

.content-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
}

.search-content {
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
</style>
                                                                                                                                                                                                                                                                                                                                             