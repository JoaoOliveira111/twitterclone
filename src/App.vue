<template>
  <div id="app">
    <div class="sidebar">
      <Sidebar />
    </div>
    <div>
    <div class="router-view">
      <router-view />
    </div>
    </div>
  </div>
</template>

<script setup>
import Sidebar from "./components/SidebarView.vue";
</script>

<style>
#app {
  height: 100vh;
}

.sidebar {
  flex: 0 0 250px; /* Fixed width of sidebar */
}

.router-view {
  display:flex ;
  flex: 1; /* Occupy remaining space */
  overflow-y: auto; /* Enable vertical scrolling if content overflows */
  margin-left: 20px; /* Set margin to the desired space between sidebar and router view */
  padding: 20px; /* Add padding for content */
}

/* Reset CSS */
*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
}

html,
body {
  width: 100%;
  height: 100%;
}
</style>

