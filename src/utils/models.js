class Message {
    constructor(id, session_id, user_id, timer, body, type, url, sender) {
        this.id = id
        this.session_id = session_id
        this.user_id = user_id
        this.timer = timer
        this.body = body
        this.sender = sender // 判断是否是群聊消息和实际发送人
        this.type = type
        this.url = url
    }
}

class MessageReq {
    constructor(Seq, SenderID, TargetID, Ack, Type, Body, Media, URL) {
        this.Seq = Seq
        this.SenderID = SenderID
        this.TargetID = TargetID
        this.Type = Type
        this.Body = Body
        this.Media = Media
        this.URL = URL
    }
}

class UserInfo {
    constructor(id, remark, username, avatar, isAdd) {
        this.id = id
        this.remark = remark    // 备注 or 群备注
        this.username = username
        this.avatar = avatar
        this.isAdd = isAdd
    }
}

class GroupInfo {
    constructor(id, groupname, description, avatar) {
        this.id = id
        this.groupname = groupname
        this.avatar = avatar
        this.description = description
    }
}

export { Message, MessageReq, UserInfo, GroupInfo }
// single sender target(user) seq body timer extra
// group  sender target(user) seq body timer extra 