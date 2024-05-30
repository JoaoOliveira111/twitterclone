<template>
  <div class="container mt-5">
    <!-- Added container class -->
    <div class="row justify-content-md-center">
      <div class="col-md-6">
        <!-- Increased column width -->
        <div class="card">
          <div class="card-body">
            <h5 class="card-title mb-4">Register</h5>
            <form @submit.prevent="registerAction" class="register-form">
              <div class="mb-3">
                <label for="firstName" class="form-label">First Name</label>
                <input
                  type="text"
                  class="form-control"
                  id="firstName"
                  name="firstName"
                  v-model="firstName"
                />
              </div>
              <div class="mb-3">
                <label for="lastName" class="form-label">Last Name</label>
                <input
                  type="text"
                  class="form-control"
                  id="lastName"
                  name="lastName"
                  v-model="lastName"
                />
              </div>
              <div class="mb-3">
                <label for="email" class="form-label">Email</label>
                <input
                  type="email"
                  class="form-control"
                  id="email"
                  name="email"
                  v-model="email"
                />
              </div>
              <div class="mb-3">
                <label for="password" class="form-label">Password</label>
                <input
                  type="password"
                  class="form-control"
                  id="password"
                  name="password"
                  v-model="password"
                />
              </div>
              <div class="mb-3">
                <label for="confirmPassword" class="form-label"
                  >Confirm Password</label
                >
                <input
                  type="password"
                  class="form-control"
                  id="confirmPassword"
                  name="confirmPassword"
                  v-model="confirmPassword"
                />
              </div>
              <div class="d-grid gap-2">
                <button
                  :disabled="isSubmitting"
                  type="submit"
                  class="btn btn-primary"
                >
                  Register Now
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { auth, db } from "../firebase/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";

const router = useRouter();
const firstName = ref("");
const lastName = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const validationErrors = ref({});
const isSubmitting = ref(false);

const registerAction = async () => {
  if (password.value !== confirmPassword.value) {
    validationErrors.value.password = "Passwords do not match";
    return;
  }

  isSubmitting.value = true;
  validationErrors.value = {}; // Clear previous errors

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email.value,
      password.value
    );
    const user = userCredential.user;

    // Combine first name and last name to create full name
    const fullName = `${firstName.value} ${lastName.value}`;

    // Store additional user info in Firestore, including UID
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      firstName: firstName.value,
      lastName: lastName.value,
      email: email.value,
      fullName: fullName, // Save full name in Firestore
    });

    // Redirect to the login page after successful registration
    router.push("/login");
  } catch (error) {
    isSubmitting.value = false;
    validationErrors.value = { error: error.message };
  }
};
</script>

<style scoped>
/* Register Form Styles */
.container {
  width: 100%;
}

.register-form {
  width: 100%;
}

.register-form .form-control {
  margin-bottom: 20px;
  padding: 10px;
}

.register-form .btn {
  width: 100%;
  padding: 10px;
  background-color: #1da1f2;
  color: white;
  border: none;
  cursor: pointer;
}

.register-form .btn:hover {
  background-color: #0e80d2;
}
</style>
