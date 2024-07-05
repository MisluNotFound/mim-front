import $ from "jquery";

export default {
    namespaced: true,
    state: {
        sessions: [],
        unreadCounts: {},
        hasOfflineMessages: {},
        messages: {}
    },
    mutations: {
        setSessions(state, sessions) {
            state.sessions = sessions;
        },
        addMessages(state, { sessionId, messages }) {
            if (!state.messages[sessionId]) {
                state.messages[sessionId] = [];
            }

            messages.forEach((message) => {
                if (!isMessageDuplicate(message, state.messages[sessionId])) {
                    state.messages[sessionId].push(message);
                }
            });
        },

        addMessage(state, { sessionId, message }) {
            if (!state.messages[sessionId]) {
                state.messages[sessionId] = [];
            }
            state.messages[sessionId].push(message)
        },
        addMessagesToTop(state, { sessionId, messages }) {
            if (!state.messages[sessionId]) {
                state.messages[sessionId] = [];
            }

            console.log("before", sessionId, state.messages[sessionId])
            messages.forEach((message) => {
                if (!isMessageDuplicate(message, state.messages[sessionId])) {
                    state.messages[sessionId].unshift(message);
                }
            });

            console.log("after", state.messages[sessionId])
        },
        removeMessages(state, sessionId) {
            state.messages[sessionId] = []
        },
        addSession(state, { session, userId }) {
            if (!isSessionDuplicate(state.sessions, session)) {
                state.sessions.unshift(session)
            }
            console.log("sessions", state.sessions)
            localStorage.setItem(userId, JSON.stringify(state.sessions));
        },
        removeSession(state, { sessionId, userId }) {
            state.sessions = state.sessions.filter(session => session.SessionID !== sessionId);
            localStorage.setItem(userId, JSON.stringify(state.sessions));
        },
        setUnreadCounts(state, unreadCounts) {
            state.unreadCounts = unreadCounts;
        },
        addUnreadCount(state, sessionId) {
            if (state.unreadCounts[sessionId]) {
                state.unreadCounts[sessionId]++
            } else {
                state.unreadCounts[sessionId] = 1
            }
            console.log("unread count plus", sessionId, state.unreadCounts[sessionId])
        },
        updateUnreadCount(state, { sessionId, count }) {
            state.unreadCounts[sessionId] = count;
        },
        clearUnreadCount(state, sessionId) {
            delete state.unreadCounts[sessionId];
        },
        setHasOfflineMessages(state, { sessionId, hasMessages }) {
            if (hasMessages) {
                state.hasOfflineMessages[sessionId] = true;
            } else {
                delete state.hasOfflineMessages[sessionId];
            }
        },
    },
    getters: {
        getSessions: state => state.sessions,
        getSessionById: state => id => state.sessions.find(session => session.SessionID == id),
        getUnreadCountById: (state) => (id) => {
            return state.unreadCounts[id] || 0;
        },
        hasOfflineMessages: state => id => state.hasOfflineMessages[id] || false,
        getMessagesBySessionId: (state) => (sessionId) => {
            const messages = state.messages[sessionId] || [];
            return [...messages]
        }
    },
    actions: {
        fetchSessions({ commit, rootState }) {
            const userId = rootState.user.id;
            const storedSessions = localStorage.getItem(userId);
            let sessions = storedSessions ? JSON.parse(storedSessions) : [];
            commit('setSessions', sessions);
        },

        fetchUnreadCounts({ commit, rootState }) {
            $.ajax({
                url: "http://localhost:3000/message/pulloffline/count",
                type: "get",
                headers: {
                    Authorization: `Bearer ${rootState.user.token}`,
                },
                success(resp) {
                    if (resp.code == 1000) {
                        console.log("fetchUnReadCount", resp)
                        if (resp.data) {
                            // 构造本地unReadCount
                            const unreadCounts = resp.data.reduce((acc, sessionInfo) => {
                                acc[sessionInfo.SessionID] = sessionInfo.Count;
                                return acc;
                            }, {});
                            commit('setUnreadCounts', unreadCounts);
                            resp.data.forEach(sessionInfo => {
                                sessionInfo.LastMessage.Timer = formatTimestamp(sessionInfo.LastMessage.Timer)
                                sessionInfo.isGroup = sessionInfo.LastMessage.IsGroup
                                sessionInfo.name = sessionInfo.Remark
                                sessionInfo.LastMessage.Content = decodeBase64(sessionInfo.LastMessage.Content);
                                commit('addSession', { session: sessionInfo, userId: rootState.user.id });
                                commit('setHasOfflineMessages', { sessionId: sessionInfo.SessionID, hasMessages: true });
                            });
                        }
                    } else {
                        console.log(resp.Msg)
                    }
                }, error(resp) {
                    console.log(resp)
                }
            });
        },
        removeSession({ commit, rootState }, sessionId) {
            commit('removeSession', { sessionId, userId: rootState.user.id });
            commit('clearUnreadCount', sessionId);
        },
        updateUnreadCount({ commit }, { sessionId, count }) {
            commit('updateUnreadCount', { sessionId, count });
        },
        markSessionAsRead({ commit }, sessionId) {
            commit('setHasOfflineMessages', { sessionId, hasMessages: false });
        },
        updateLastRead(context, { lastMessage, sessionId, userId }) {
            console.log(context.state.sessions)
            // 获取原有session
            const session = context.getters.getSessionById(sessionId)
            // 修改
            session.LastMessage = lastMessage
            // 提交
            context.commit("addSession", { session: session, userId: userId })
        }
    },
};

function isSessionDuplicate(sessions, session) {
    if (sessions.length === 0) return false;

    let sessionFound = false;

    for (let i = 0; i < sessions.length; i++) {
        console.log(sessions[i].SessionID, session.SessionID)
        if (sessions[i].SessionID == session.SessionID) {
            sessions.splice(i, 1);
            sessions.unshift(session);
            sessionFound = true;
            break;
        }
    }

    return sessionFound;
}


function formatTimestamp(timestamp) {
    const date = new Date(timestamp);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function isMessageDuplicate(message, sessionMessages) {
    return sessionMessages.some((msg) => msg.id == message.id);
}

function decodeBase64(base64String) {
    const decodedString = atob(base64String);
    const bytes = new Uint8Array(decodedString.length);
    for (let i = 0; i < decodedString.length; i++) {
        bytes[i] = decodedString.charCodeAt(i);
    }
    const decoder = new TextDecoder("utf-8");
    return decoder.decode(bytes);
}