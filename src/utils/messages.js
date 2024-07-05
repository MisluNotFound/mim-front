import store from '@/store';
import $ from 'jquery'

export function fetchOfflineMessages(sessionId, isGroup, token) {
    $.ajax({
        url: "http://localhost:3000/message/pulloffline",
        method: "post",
        headers: {
            Authorization: `Bearer ` + token,
        },
        contentType: "application/json",
        data: JSON.stringify({
            session_id: sessionId,
            is_group: isGroup,
        }),
        success: (resp) => {
            console.log(resp)
            if (resp.code == 1000 && resp.data) {
                return resp.data
            } else {
                console.log(resp.msg);
            }
        },
        error: (resp) => {
            console.error("fetchOfflineMessages error:", resp);
        },
    });
}

export function decodeBase64(base64String) {
    const decodedString = atob(base64String);
    const bytes = new Uint8Array(decodedString.length);
    for (let i = 0; i < decodedString.length; i++) {
        bytes[i] = decodedString.charCodeAt(i);
    }
    const decoder = new TextDecoder("utf-8");
    return decoder.decode(bytes);
}

export function isMessageDuplicate(messageId, sessionId) {
    return store.state.session.messages[sessionId].some(
        (msg) => msg.id == messageId
    );
}