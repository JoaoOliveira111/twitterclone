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
// Import lightbox2 CSS and JS
import "lightbox2/dist/css/lightbox.css";
import "lightbox2/dist/js/lightbox.js";
import "jquery";
</script>

<style>
#app {
  height: 100vh;
}

.sidebar {
  flex: 0 0 250px; /* Fixed width of sidebar */
}

.router-view {
  position: relative;
  flex: 0;
  overflow-y: auto;
  margin-left: 20vw;
  padding: 20px;

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

