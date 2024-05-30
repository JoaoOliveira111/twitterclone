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

          <div class="tweets-list">
            <div
              v-for="tweet in tweets"
              :key="tweet.id"
              class="tweet-item mb-3 p-3 bg-light rounded"
            >
              <div class="d-flex align-items-start">
                <img
                  :src="tweet.data.profileImage || defaultProfileImage"
                  alt="Profile"
                  class="profile-image-small rounded-circle me-2"
                />
                <div class="tweet-content">
                  <h5>{{ tweet.data.username }}</h5>
                  <p class="mb-1">{{ tweet.data.tweet }}</p>
                  <div v-if="tweet.data.imageUrl">
                    <a
                      :href="tweet.data.imageUrl"
                      data-lightbox="tweet-images"
                      data-title="Tweet Image"
                    >
                      <img
                        :src="tweet.data.imageUrl"
                        alt="Tweet image"
                        class="tweet-image mt-2"
                      />
                    </a>
                  </div>
                  <div class="tweet-actions mt-2">
                    <span
                      >Likes: {{ tweet.data.likes || 0 }} | Replies:
                      {{ tweet.data.replies.length || 0 }}
                    </span>
                  </div>
                  <small v-if="tweet.data.timestamp" class="text-muted">
                    {{
                      new Date(
                        tweet.data.timestamp.seconds * 1000
                      ).toLocaleString()
                    }}
                  </small>
                  <small v-else class="text-muted"
                    >Timestamp não disponível</small
                  >
                </div>
              </div>
            </div>
          </div>
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
  query,
  orderBy,
} from "firebase/firestore";

const suggestions = ref([]);
const followingUsers = ref([]);
const currentUser = ref(auth.currentUser);
const tweets = ref([]);

const setFollowersDocument = async (uid) => {
  const userRef = doc(db, "followers", uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    await setDoc(userRef, { followers: [], following: [] });
  }
};

const loadTweets = async () => {
  try {
    // Create a Firestore query to fetch all tweets
    const q = query(collection(db, "tweets"), orderBy("timestamp", "desc"));

    // Fetch all tweets based on the query
    const querySnapshot = await getDocs(q);
    const loadedTweets = [];

    querySnapshot.forEach((doc) => {
      console.log(doc);
      // Add the tweet object to the loadedTweets array
      loadedTweets.push({
        id: doc.id,
        data: doc.data(),
      });
    });

    tweets.value = loadedTweets;
  } catch (error) {
    console.error("Error loading tweets:", error);
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

  await loadTweets();
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
.tweets-list {
  width: 100%;
  margin-top: 20px;
}

.tweet-item {
  display: flex;
  align-items: flex-start;
  padding: 10px;
  border-bottom: 1px solid #ccc;
}
.tweet-image {
  max-width: 100%;
  height: auto;
  max-height: 300px;
  border-radius: 10px;
  object-fit: cover;
}
.profile-image {
  width: 50px;
  height: 50px;
}

.profile-image-small {
  width: 30px;
  height: 30px;
}
.tweet-content {
  margin-left: 10px;
  flex-grow: 1;
}

.tweet-content p {
  margin: 0;
}

.tweet-content small {
  display: block;
  color: #888;
  margin-top: 5px;
}
</style>
