<template>
  <div class="container">
    <div class="row">
      <div class="col-md-8">
        <!-- Main Content -->
        <!-- Tendências -->
        <div class="mb-4">
          <h2>Tendências</h2>
          <ul class="list-group">
            <li class="list-group-item" v-for="trend in trends" :key="trend">
              {{ trend }}
            </li>
          </ul>
        </div>
      </div>
      <div class="col-md-4">
        <!-- Sidebar -->
        <!-- Sugestões de Seguimento -->
        <div>
          <h2>Quem seguir</h2>
          <h4 v-if="!auth.currentUser">
            Faça login para ver os utilizadores que pode seguir!
          </h4>
          <ul class="list-group">
            <li
              class="list-group-item d-flex justify-content-between align-items-center"
              v-for="suggestion in suggestions"
              :key="suggestion.handle"
            >
              <div>
                <h5 class="mb-0">{{ suggestion.name }}</h5>
                <p class="mb-0 text-muted">{{ suggestion.handle }}</p>
              </div>
              <button
                @click="toggleFollow(suggestion.uid)"
                class="btn btn-outline-primary"
              >
                {{
                  followingUsers.includes(suggestion.uid)
                    ? "Unfollow"
                    : "Follow"
                }}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { db, auth } from "../firebase/firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  setDoc,
} from "firebase/firestore";

const suggestions = ref([]);
const followingUsers = ref([]);
const currentUser = ref(auth.currentUser);

const setFollowersDocument = async (uid) => {
  const userRef = doc(db, "followers", uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    await setDoc(userRef, { followers: [], following: [] });
  }
};

const fetchSuggestions = async () => {
  try {
    if (currentUser.value) {
      const userDoc = doc(db, "followers", currentUser.value.uid);
      const userSnap = await getDoc(userDoc);
      const currentUserFollowing = userSnap.exists()
        ? userSnap.data().following || []
        : [];
      followingUsers.value = currentUserFollowing;

      const querySnapshot = await getDocs(collection(db, "users"));
      suggestions.value = querySnapshot.docs
        .map((doc) => ({ ...doc.data(), uid: doc.id }))
        .filter(
          (suggestion) =>
            suggestion.name &&
            suggestion.uid !== currentUser.value.uid &&
            !currentUserFollowing.includes(suggestion.uid)
        );
    }
  } catch (err) {
    console.error("Error fetching suggestions: ", err);
  }
};

const loadFollowingUsers = async () => {
  if (currentUser.value) {
    const userDoc = doc(db, "followers", currentUser.value.uid);
    const userSnap = await getDoc(userDoc);
    if (userSnap.exists() && userSnap.data().following) {
      const followingIds = userSnap.data().following;
      followingUsers.value = followingIds.filter(
        (id) => id !== currentUser.value.uid
      );
    }
  }
};

const toggleFollow = async (uid) => {
  if (currentUser.value) {
    const userDoc = doc(db, "followers", currentUser.value.uid);
    const userSnap = await getDoc(userDoc);

    const targetUserDoc = doc(db, "followers", uid);
    let targetUserSnap = await getDoc(targetUserDoc);

    if (!targetUserSnap.exists()) {
      await setDoc(targetUserDoc, { followers: [], following: [] });
      targetUserSnap = await getDoc(targetUserDoc);
    }

    if (userSnap.exists() && targetUserSnap.exists()) {
      const currentFollowing = userSnap.data().following || [];
      const isFollowing = currentFollowing.includes(uid);
      const updatedFollowing = isFollowing
        ? currentFollowing.filter((id) => id !== uid)
        : [...currentFollowing, uid];

      await updateDoc(userDoc, { following: updatedFollowing });
      followingUsers.value = updatedFollowing;

      const currentFollowers = targetUserSnap.data().followers || [];
      const updatedFollowers = isFollowing
        ? currentFollowers.filter((id) => id !== currentUser.value.uid)
        : [...currentFollowers, currentUser.value.uid];

      await updateDoc(targetUserDoc, { followers: updatedFollowers });
    }
  }
};

onMounted(async () => {
  if (currentUser.value) {
    await setFollowersDocument(currentUser.value.uid);
    await fetchSuggestions();
    await loadFollowingUsers();
  }
});
</script>

<style scoped>
.card {
  margin-bottom: 20px;
}

.card-img-top {
  height: 200px;
  object-fit: cover;
}

.list-group-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
