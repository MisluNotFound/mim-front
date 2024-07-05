import $ from 'jquery'
import webSocketService from '@/utils/websocket';

export default {
    state: {
        id: "",
        username: "",
        password: "",
        photo: "",
        is_login: false,
        token: "",
        pulling_info: true,
        isConnected: false,
        errorMessage: "",
    },
    getters: {
    },
    mutations: {
        updatePhoto(state, photo) {
            state.photo = photo
        },
        updateUser(state, user) {
            state.id = user.id;
            state.username = user.username;
            state.password = user.password;
            state.photo = user.photo;
            state.is_login = user.is_login;
        },
        updateToken(state, token) {
            state.token = token;
        },
        updateUsername(state, username) {
            state.username = username
        },
        logout(state) {
            state.id = '',
                state.username = "",
                state.password = "",
                state.photo = "",
                state.is_login = false,
                state.token = ""
            if (state.websocket) {
                state.websocket.close();
            }
            state.websocket = null;
        },
        updatePullingInfo(state, pulling_info) {
            state.pulling_info = pulling_info
        },
        clearWebSocket(state) {
            if (state.websocket) {
                state.websocket.close();
            }
            state.websocket = null;
        },
        setErrorMessage(state, message) {
            state.errorMessage = message
        },
        setConnected(state, connected) {
            state.isConnected = connected
        },
        clearErrorMessage(state) {
            state.errorMessage = ""
        }
    },
    actions: {
        login(context, data) {
            $.ajax({
                url: 'http://localhost:3000/user/signin',
                type: "post",
                contentType: 'application/json',
                data: JSON.stringify({
                    username: data.username,
                    password: data.password
                }),
                success(resp) {
                    if (resp.code === 1000) {
                        localStorage.setItem("jwt_token", resp.data)
                        context.commit("updateToken", resp.data)
                        data.success(resp)
                    } else {
                        data.error(resp)
                    }
                },
                error(resp) {
                    data.error(resp)
                }
            })
        },
        getinfo(context, data) {
            $.ajax({
                async: false,
                url: "http://localhost:3000/user/getinfo",
                type: "get",
                headers: {
                    Authorization: "Bearer " + context.state.token,
                },
                success(resp) {
                    if (resp.code === 1000) {
                        console.log(resp)
                        context.commit("updateUser", {
                            id: resp.data.ID,
                            username: resp.data.Username,
                            password: resp.data.Password,
                            is_login: true,
                            photo: resp.data.Avatar
                        });
                        data.success(resp);
                    } else {
                        data.error(resp);
                    }
                },
                error(resp) {
                    data.error(resp);
                }
            })
        },
        logout(context) {
            localStorage.removeItem("jwt_token")
            webSocketService.disconnect()
            context.commit("logout")
        },
        updateUsername(context, { username, error, success }) {
            $.ajax({
                url: "http://localhost:3000/user/update/name",
                type: "POST",
                data: JSON.stringify({
                    name: username
                }),
                headers: {
                    Authorization: "Bearer " + context.state.token,
                },
                success(resp) {
                    if (resp.code === 1000) {
                        context.commit("updateUsername", username)
                        success()
                    } else {
                        error(resp.msg)
                    }
                },
                error() {
                    error("修改失败")
                }
            })
        },
        updatePassword(context, { oldPassword, newPassword, confirmPassword, error, success }) {
            $.ajax({
                url: "http://localhost:3000/user/update/password",
                type: "POST",
                data: JSON.stringify({
                    old_password: oldPassword,
                    new_password: newPassword,
                    re_password: confirmPassword,
                }),
                headers: {
                    Authorization: "Bearer " + context.state.token,
                },
                success(resp) {
                    if (resp.code !== 1000) {
                        error(resp.msg)
                    } else {
                        success()
                    }
                },
                error() {
                    error("修改失败")
                }
            })
        }
    },
    modules: {
    }
}