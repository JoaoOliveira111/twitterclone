<template>
  <div class="container mt-5">
    <div class="row justify-content-center">
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">Sign In</div>
          <div class="card-body">
            <form @submit.prevent="loginAction">
              <div class="mb-3">
                <label for="email" class="form-label">Email address</label>
                <input
                  type="email"
                  class="form-control"
                  id="email"
                  v-model="email"
                  required
                />
              </div>
              <div class="mb-3">
                <label for="password" class="form-label">Password</label>
                <input
                  type="password"
                  class="form-control"
                  id="password"
                  v-model="password"
                  required
                />
              </div>
              <button
                type="submit"
                class="btn btn-primary"
                :disabled="isSubmitting"
              >
                Login
              </button>
              <p class="mt-3">
                Don't have an account?
                <router-link to="/register">Register here</router-link>
              </p>
              <div v-if="loginError" class="alert alert-danger mt-3">
                {{ loginError }}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { auth } from '../firebase/firebase'; 
import { signInWithEmailAndPassword,onAuthStateChanged  } from "firebase/auth"// import your firebase auth instance

const email = ref('');
const password = ref('');
const isSubmitting = ref(false);
const loginError = ref(null);
const router = useRouter();

onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in, redirect to home
    router.push("/home");
  }
});

const loginAction = async () => {
  isSubmitting.value = true;
  loginError.value = null;

  try {
    await signInWithEmailAndPassword(auth, email.value, password.value);
    router.push("/home");
  } catch (error) {
    if (error.code === "auth/wrong-password") {
      loginError.value = "The password you entered is incorrect. Please try again.";
    } else {
      loginError.value = "An error occurred. Please try again later.";
    }
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.card-header {
  font-weight: bold;
}
</style>