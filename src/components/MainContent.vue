<template>
  <div class="d-flex">
    <SideBar />
  </div>
</template>
  
  <script>
import SideBar from "@/components/SideBar.vue";

export default {
  components: {
    SideBar,
  },
};
</script>
  
  <style scoped>
.d-flex {
  display: flex;
}

.flex-grow-1 {
  flex-grow: 1;
}
</style>
  