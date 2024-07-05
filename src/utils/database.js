const DB_VERSION = 7;
const DB_NAME = "messageDB";

function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = function (event) {
            const db = event.target.result;
            if (!db.objectStoreNames.contains("SingleChatMessages")) {
                const objectStore = db.createObjectStore("SingleChatMessages", { keyPath: "id" });
                objectStore.createIndex("user_session", ["user_id", "session_id"], { unique: false });
            }
            if (!db.objectStoreNames.contains("GroupChatMessages")) {
                const objectStore = db.createObjectStore("GroupChatMessages", { keyPath: "id" });
                objectStore.createIndex("user_session", ["user_id", "session_id"], { unique: false });
            }
        };

        request.onsuccess = function (event) {
            resolve(event.target.result);
        };

        request.onerror = function () {
            reject(request.error);
        };
    });
}

export async function addSingleChatMessage(message) {
    try {
        const db = await openDatabase();
        const transaction = db.transaction(["SingleChatMessages"], "readwrite");
        const objectStore = transaction.objectStore("SingleChatMessages");
        const addRequest = objectStore.add(message);

        addRequest.onsuccess = function () {
            console.log("单聊消息已成功存储到 IndexedDB 中");
        };

        addRequest.onerror = function () {
            console.error("添加单聊消息到 IndexedDB 失败:", addRequest.error);
        };
    } catch (error) {
        console.error("打开 IndexedDB 数据库失败:", error);
    }
}

export async function addGroupChatMessage(message) {
    message.session_id = String(message.session_id)
    try {
        const db = await openDatabase();
        const transaction = db.transaction(["GroupChatMessages"], "readwrite");
        const objectStore = transaction.objectStore("GroupChatMessages");
        const addRequest = objectStore.add(message);

        addRequest.onsuccess = function () {
            console.log("群聊消息已成功存储到 IndexedDB 中");
        };

        addRequest.onerror = function () {
            console.error("添加群聊消息到 IndexedDB 失败:", addRequest.error);
        };
    } catch (error) {
        console.error("打开 IndexedDB 数据库失败:", error);
    }
}

export async function getSingleChatMessages(userId, sessionId) {
    console.log(userId, sessionId)
    try {
        const db = await openDatabase();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(["SingleChatMessages"], "readonly");
            const objectStore = transaction.objectStore("SingleChatMessages");
            const index = objectStore.index("user_session");
            const request = index.getAll([userId, sessionId]);

            request.onsuccess = function () {
                resolve(request.result);
            };

            request.onerror = function () {
                reject(request.error);
            };
        });
    } catch (error) {
        console.error("打开 IndexedDB 数据库失败:", error);
        throw error;
    }
}

export async function getGroupChatMessages(userId, sessionId) {
    try {
        const db = await openDatabase();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(["GroupChatMessages"], "readonly");
            const objectStore = transaction.objectStore("GroupChatMessages");
            const index = objectStore.index("user_session");
            const request = index.getAll([userId, sessionId]);

            request.onsuccess = function () {
                resolve(request.result);
            };

            request.onerror = function () {
                reject(request.error);
            };
        });
    } catch (error) {
        console.error("打开 IndexedDB 数据库失败:", error);
        throw error;
    }
}

export async function updateChatMessage(storeName, id, updatedData) {
    try {
        const db = await openDatabase();
        const transaction = db.transaction([storeName], "readwrite");
        const objectStore = transaction.objectStore(storeName);

        // 获取现有记录
        const request = objectStore.get(id);

        request.onsuccess = function (event) {
            const data = event.target.result;
            if (data) {
                Object.assign(data, updatedData);

                const updateRequest = objectStore.put(data);

                updateRequest.onsuccess = function () {
                    console.log('记录更新成功');
                };

                updateRequest.onerror = function () {
                    console.error('记录更新失败:', updateRequest.error);
                };
            } else {
                console.error('未找到指定的记录');
            }
        };

        request.onerror = function () {
            console.error('获取记录失败:', request.error);
        };
    } catch (error) {
        console.error("打开 IndexedDB 数据库失败:", error);
    }
}

export async function deleteChatMessage(storeName, userId, sessionId) {
    console.log(storeName, userId, sessionId)
    try {
        const db = await openDatabase();
        const transaction = db.transaction([storeName], "readwrite");
        const objectStore = transaction.objectStore(storeName);

        const cursorRequest = objectStore.openCursor()
        cursorRequest.onsuccess = function (event) {
            const cursor = event.target.result;
            if (cursor) {
                const record = cursor.value;

                if (record.user_id === userId && record.session_id == sessionId) {
                    const deleteRequest = cursor.delete();
                    deleteRequest.onsuccess = function () {
                        console.log(`Deleted record with user_id: ${userId} and session_id: ${sessionId}`);
                    };
                }
                cursor.continue();
            }
        }
    } catch (error) {
        console.error("打开 IndexedDB 数据库失败:", error);
    }
}