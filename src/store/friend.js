import $ from 'jquery';
import { deleteChatMessage } from '@/utils/database';

export default {
    state: {
        friends: []
    },
    mutations: {
        setFriends(state, friends) {
            state.friends = friends
            console.log(state.friends)
        },
        addFriend(state, friend) {
            if (!isFriendDuplicated(state.friends, friend)) {
                console.log(friend, state.friends)
                const newFriend = {
                    Info: {
                        Avatar: friend.Avatar,
                        ID: friend.ID,
                        Username: friend.Username
                    },
                    Remark: ""
                }
                state.friends.push(newFriend)
            }
        },
        removeFriend(state, userId) {
            state.friends = state.friends.filter(friend => friend.Info.ID !== userId)
        }
    },
    getters: {
        getFriend: (state) => (friendId) => {
            return state.friends.find(friend => friend.Info.ID === Number(friendId));
        },
        getFriendByName: (state) => (name) => {
            return state.friends.filter(friend => {
                return friend.Info.Username.includes(name) || friend.Remark.includes(name);
            });
        }
    },
    actions: {
        getFriends({ commit, rootState }) {
            const token = rootState.user.token;
            $.ajax({
                url: 'http://localhost:3000/friend/get',
                headers: {
                    Authorization: "Bearer " + token,
                },
                method: 'GET',
                success(resp) {
                    if (resp.code == 1000) {
                        console.log(resp.data)
                        commit('setFriends', resp.data);
                    } else {
                        console.log(resp.msg)
                    }
                },
                error(xhr, status, error) {
                    console.error('获取好友列表失败:', error);
                }
            });
        },
        addFriend({ commit, rootState }, { userId, error }) {
            const token = rootState.user.token;
            $.ajax({
                url: 'http://localhost:3000/friend/add',
                headers: {
                    Authorization: "Bearer " + token,
                },
                data: JSON.stringify({
                    friend_id: userId
                }),
                method: 'POST',
                success(resp) {
                    console.log(resp)
                    if (resp.code == 1000) {
                        commit("addFriend", resp.data)
                    } else {
                        error(resp.msg)
                    }
                },
                error(xhr, status, error) {
                    console.error('获取好友列表失败:', error);
                }
            });
        },
        async isFriendAdded(context, userId) {
            return new Promise((resolve) => {
                let isAdded = false;
                if (context.state.friends) {
                    context.state.friends.forEach(friend => {
                        if (friend.Info.ID === Number(userId)) {
                            isAdded = true;
                        }
                    });
                }
                resolve(isAdded);
            });
        },
        removeFriend({ commit, rootState }, { userId, error, success }) {
            const token = rootState.user.token;
            $.ajax({
                url: 'http://localhost:3000/friend/remove',
                headers: {
                    Authorization: "Bearer " + token,
                },
                data: JSON.stringify({
                    friend_id: userId
                }),
                method: 'DELETE',
                success(resp) {
                    console.log(resp)
                    if (resp.code == 1000) {
                        commit("removeFriend", userId)
                        deleteChatMessage("SingleChatMessages", rootState.user.id, userId)
                        success()
                    } else {
                        error(resp.msg)
                    }
                },
                error(xhr, status, error) {
                    console.error('获取好友列表失败:', error);
                }
            });
        }
    },
};

function isFriendDuplicated(friends, friend) {
    if (!friends) {
        return false
    }

    return friends.some(existFriend => existFriend.Info.ID === friend.ID);
}
