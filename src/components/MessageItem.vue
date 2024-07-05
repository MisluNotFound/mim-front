<template>
  <div class="message-container" :class="{ mine: isMine }">
    <img :src="message.user.avatar" class="avatar" />
    <div class="message-bubble">
      <span class="username">{{ message.user.Username }}</span>
      <p>{{ message.content }}</p>
    </div>
  </div>
</template>
  
<script>
export default {
  props: {
    message: {
      type: Object,
      required: true,
    },
    isMine: {
      type: Boolean,
      default: false,
    },
  },
};
</script>
  
<style scoped>
.message-container {
  display: flex;
  margin-bottom: 10px;
}

.mine {
  justify-content: flex-end;
}

.avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  margin-right: 10px;
}

.message-bubble {
  max-width: 70%;
  background-color: #f0f0f0;
  border-radius: 10px;
  padding: 10px;
}

.username {
  font-weight: bold;
  margin-bottom: 5px;
}
</style>
  