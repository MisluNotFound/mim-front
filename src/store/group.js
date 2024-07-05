import axios from 'axios';
import JSONBig from 'json-bigint';

export default {
    state: {
        groups: [],
        members: {}
    },
    mutations: {
        setGroups(state, groups) {
            state.groups = groups;
            console.log(state.groups);
        },
        setMembers(state, { groupId, members }) {
            state.members[groupId] = members;
            console.log(state.members[groupId], members);
        },
    },
    getters: {
        getMembers: (state) => (groupId) => {
            const members = state.members[groupId] || [];
            return [...members];
        },
        getGroup: (state) => (groupId) => {
            return state.groups.find(group => group.GroupID === Number(groupId));
        },
        getGroupByName: (state) => (name) => {
            return state.groups.filter(group => group.GroupName.includes(name));
        },
        getRole: (state) => (groupId, userId) => {
            const members = state.members[groupId] || [];
            return members.find(member => member.Member.ID === userId && member.Role === 'owner')
        },
        getMember: (state) => ({ groupId, userId }) => {
            const members = state.members[groupId] || []
            return members.find(member => member.Member.ID == userId)
        }
    },
    actions: {
        async getGroups({ commit, rootState }) {
            const token = rootState.user.token;

            try {
                const response = await axios.get('http://localhost:3000/group/getall', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    transformResponse: [
                        function (data) {
                            return JSONBig.parse(data);
                        },
                    ]
                });
                const resp = response.data;
                console.log(resp);
                if (resp.code === 1000) {
                    commit('setGroups', resp.data);
                }
            } catch (error) {
                console.error('获取好友列表失败:', error);
            }
        },

        async getMembers({ commit, rootState }, { groupId, error }) {
            try {
                const response = await axios.get('http://localhost:3000/group/members', {
                    headers: {
                        Authorization: `Bearer ${rootState.user.token}`,
                    },
                    params: {
                        group_id: groupId.toString(),
                    },
                    transformResponse: [
                        function (data) {
                            return JSONBig.parse(data);
                        },
                    ]
                });
                const resp = response.data;
                console.log(resp);
                if (resp.code === 1000) {
                    commit('setMembers', { groupId: groupId.toString(), members: resp.data });
                } else {
                    error(resp.msg)
                }
            } catch (error) {
                error("获取群成员失败")
            }
        },

        async isGroupAdded(context, groupId) {
            // context.getGroups()
            return new Promise((resolve) => {
                let isAdded = false;
                context.state.groups.forEach(group => {
                    if (group.GroupID.toString() === groupId.toString()) {
                        isAdded = true;
                    }
                });
                resolve(isAdded);
            });
        },

        async leaveGroup({ dispatch, rootState }, { groupId, success, error }) {
            try {
                const response = await axios.post(
                    'http://localhost:3000/group/leave',
                    JSON.stringify({
                        group_id: groupId.toString()
                    }),
                    {
                        headers: {
                            Authorization: `Bearer ${rootState.user.token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                const resp = response.data;
                console.log(resp);
                if (resp.code === 1000) {
                    dispatch("getGroups");
                    success();
                } else {
                    error(resp.msg);
                }
            } catch (err) {
                error("退出失败");
            }
        },

        async joinGroup({ rootState, dispatch }, { groupId, success, error }) {
            try {
                const response = await axios.post('http://localhost:3000/group/join',
                    JSON.stringify({
                        group_id: groupId,
                    }),
                    {
                        headers: {
                            Authorization: `Bearer ${rootState.user.token}`,
                        }
                    }
                )
                const resp = response.data
                console.log(response)
                if (resp.code === 1000) {
                    success(resp.data)
                    dispatch('getGroups')
                } else {
                    error(resp.data.msg)
                }
            } catch (err) {
                console.log(err)
                error("加群失败")
            }
        },
        

        async getRole({ rootState }, { groupId, success }) {
            try {
                const response = await axios.get('http://localhost:3000/group/role', {
                    headers: {
                        Authorization: `Bearer ${rootState.user.token}`,
                    },
                    params: {
                        group_id: groupId.toString(),
                    },
                });
                const resp = response.data;
                console.log(resp);
                if (resp.code === 1000) {
                    success(resp.data)
                }
            } catch (error) {
                console.log(error)
            }
        },

    }
};
