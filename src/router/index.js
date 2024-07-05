import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/user/LoginView.vue';
import Register from '../views/user/RegisterView.vue';
import Chat from '../components/ChatPanel.vue';
import NotFound from '@/views/NotFound.vue'
import ContactList from '@/views/contact/ContactList.vue'
import SessionList from '@/views/session/SessionListPage.vue'
import store from '@/store'

const routes = [
  {
    path: "/",
    name: "home",
    redirect: "/session/"
  },
    {
      path: "/session/",
      name: "session_list",
      component: SessionList,
      meta: {
        requestAuth: true,
      }
    },
  {
    path: "/contact/",
    name: "contact_list",
    component: ContactList,
    meta: {
      requestAuth: true,
    }
  },
  {
    path: "/user/login/",
    name: "user_login",
    component: Login,
    meta: {
      requestAuth: false,
    }
  },
  {
    path: "/user/register/",
    name: "user_register",
    component: Register,
    meta: {
      requestAuth: false,
    }
  },
  {
    path: "/chat/:sessionId/",
    name: "chat",
    component: Chat,
    meta: {
      requestAuth: true,
    }
  },
  {
    path: "/404/",
    name: "404",
    component: NotFound,
    meta: {
      requestAuth: false,
    }
  },
  {
    path: "/:catchAll(.*)",
    redirect: "/404/"
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  if (!store.state.user.is_login && to.meta.requestAuth) {
    next({ name: 'user_login' })
  } else {
    next()
  }
})


export default router;
