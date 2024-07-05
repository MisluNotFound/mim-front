import { createStore } from 'vuex';
import ModuleUser from '@/store/user'
import ModuleFriend from '@/store/friend'
import ModuleGroups from '@/store/group'
import ModuleSession from '@/store/session'

export default createStore({
  state: {
  },
  getters: {
  },
  mutations: {
  },
  actions: {},
  modules: {
    user: ModuleUser,
    friend: ModuleFriend,
    group: ModuleGroups,
    session: ModuleSession
  },
});
