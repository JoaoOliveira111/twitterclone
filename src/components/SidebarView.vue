<template>
  <div class="sidebar">
    <div class="sidebar-header">
      <h2>Twitter Clone</h2>
    </div>
    <nav class="sidebar-nav">
      <router-link to="/home" class="sidebar-link" active-class="active-link">
        Home
      </router-link>
      <router-link to="/messages" v-if="isAuthenticated" class="sidebar-link" active-class="active-link">
        Messages
      </router-link>
      <router-link
        v-if="isAuthenticated"
        to="/profile"
        class="sidebar-link"
        active-class="active-link"
      >
        Profile
      </router-link>
      <router-link
        v-if="!isAuthenticated"
        to="/register"
        class="sidebar-link"
        active-class="active-link"
      >
        Register
      </router-link>
      <router-link
        v-if="!isAuthenticated"
        to="/login"
        class="sidebar-link"
        active-class="active-link"
      >
        Login
      </router-link>
      <button v-if="isAuthenticated" @click="logout" class="sidebar-link">
        Logout
      </button>
    </nav>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import { auth } from "../firebase/firebase"; // Import Firebase authentication
import { ref } from "vue";

const router = useRouter();
const isAuthenticated = ref(false); // State to track authentication status

// Check if user is authenticated
auth.onAuthStateChanged((user) => {
  isAuthenticated.value = !!user;
});

const logout = async () => {
  try {
    await auth.signOut(); // Sign out from Firebase Authentication
    router.push("/login"); // Redirect to the login page after logout
  } catch (error) {
    console.error("Error logging out:", error);
  }
};
</script>
<style>
.sidebar {
  width: 250px;
  background-color: #fff;
  height: 100vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: fixed;
  top: 0;
  left: 0;
}

.sidebar-header {
  padding: 1rem;
  background-color: #1da1f2;
  color: #fff;
  text-align: center;
}

.sidebar-nav {
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
}

.sidebar-link {
  padding: 1rem;
  color: #333;
  text-decoration: none;
  transition: background-color 0.3s;
}

.sidebar-link:hover {
  background-color: #f5f8fa;
}

.active-link {
  background-color: #e1e8ed;
  font-weight: bold;
}

/* Optional: Add styles for footer or additional content */
</style>
