import { createRouter, createWebHistory } from "vue-router";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { ref } from "vue";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

import Messages from "../views/MessagesView.vue";
import Profile from "../views/ProfileView.vue";
import Login from "../views/LoginView.vue";
import Register from "../views/RegisterView.vue";
import Home from "../views/HomeView.vue";

const routes = [
  { path: "/home", component: Home },
  { path: "/messages", component: Messages, meta: { requiresAuth: true } }, // Home route requires authentication
  { path: "/profile", component: Profile, meta: { requiresAuth: true } }, // Profile route requires authentication
  { path: "/login", component: Login },
  { path: "/register", component: Register },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});
const auth = getAuth();
const db = getFirestore();
let isAuthenticated = ref(false);
let userEmail = ref(null);
let isAdmin = ref(false);

const authReady = new Promise((resolve) => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      isAuthenticated.value = true;
      userEmail.value = user.email;

      // Buscar dados adicionais do Firestore
      const userDoc = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDoc);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        isAdmin.value = userData.email === "admin@gmail.com"; // Verificação de administrador

        if (isAdmin.value) {
          // Redirecionar para /admin se o usuário for admin
          router.push({ name: "AdminPanel" });
        }
      } else {
        // Documento não existe, então vamos criar um documento padrão
        await setDoc(userDoc, { email: user.email, name: "User" });
        console.log("No such document, creating default user document.");
        isAdmin.value = user.email === "admin@gmail.com"; // Verificação de administrador

        if (isAdmin.value) {
          // Redirecionar para /admin se o usuário for admin
          router.push({ name: "AdminPanel" });
        }
      }
    } else {
      isAuthenticated.value = false;
      userEmail.value = null;
      isAdmin.value = false;
    }
    resolve();
  });
});

router.beforeEach(async (to, from, next) => {
  await authReady;

  if (to.meta.requiresAuth && !isAuthenticated.value) {
    next({ name: "Login" }); 
    
  } else {
    next();
  }
});


export default router;
