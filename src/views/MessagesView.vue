<template>
  <div class="container mt-4">
    <div class="tweet-form mb-4 p-4 bg-light rounded">
      <div class="d-flex align-items-center mb-3">
        <img
          :src="userProfileImage"
          alt="Profile"
          class="profile-image rounded-circle me-3"
        />
        <textarea
          v-model="tweet"
          class="form-control"
          rows="3"
          placeholder="What's happening?"
        ></textarea>
      </div>
      <div class="d-flex justify-content-between">
        <input
          type="file"
          @change="onImageChange"
          class="form-control me-2"
          style="width: 50%"
        />
        <button @click="postTweet" class="btn btn-primary">Post</button>
      </div>
    </div>
    <div class="tweets-list">
      <div
        v-for="tweet in tweets"
        :key="tweet.id"
        class="tweet-item mb-3 p-3 bg-light rounded"
      >
        <div class="d-flex align-items-start">
          <img
            :src="tweet.data().profileImage || defaultProfileImage"
            alt="Profile"
            class="profile-image-small rounded-circle me-2"
          />
          <div class="tweet-content">
            <h5>{{ tweet.data().username }}</h5>
            <p class="mb-1">{{ tweet.data().tweet }}</p>
            <div v-if="tweet.data().imageUrl">
              <a
                :href="tweet.data().imageUrl"
                data-lightbox="tweet-images"
                data-title="Tweet Image"
              >
                <img
                  :src="tweet.data().imageUrl"
                  alt="Tweet image"
                  class="tweet-image mt-2"
                />
              </a>
            </div>
            <div class="tweet-actions mt-2">
              <button
                @click="toggleLike(tweet.id)"
                class="btn btn-outline-primary btn-sm me-2"
              >
                {{ isTweetLiked(tweet) ? "Unlike" : "Like" }} ({{
                  tweet.data().likes || 0
                }})
              </button>
              <button
                v-if="tweet.data().uid === currentUser.uid"
                @click="deleteTweet(tweet.id)"
                class="btn btn-outline-danger btn-sm"
              >
                Delete
              </button>
              <button
                v-if="currentUser && tweet.data().uid !== currentUser.uid"
                @click="toggleFollow(tweet.data().uid)"
                class="btn btn-outline-secondary btn-sm"
              >
                {{
                  followingUsers.includes(tweet.data().uid)
                    ? "Unfollow"
                    : "Follow"
                }}
              </button>
              <button
                @click="toggleReply(tweet.id)"
                class="btn btn-outline-info btn-sm"
              >
                Reply
              </button>
            </div>
            <small v-if="tweet.data().timestamp" class="text-muted">
              {{
                new Date(tweet.data().timestamp.seconds * 1000).toLocaleString()
              }}
            </small>
            <small v-else class="text-muted">Timestamp não disponível</small>

            <div v-if="replyingTo === tweet.id" class="reply-form mt-3">
              <textarea
                v-model="reply"
                class="form-control mb-2"
                rows="2"
                placeholder="Write your reply..."
              ></textarea>
              <button
                @click="postReply(tweet.id)"
                class="btn btn-success btn-sm me-2"
              >
                Reply
              </button>
              <button @click="cancelReply" class="btn btn-secondary btn-sm">
                Cancel
              </button>
            </div>
            <div v-if="tweet.data().replies" class="replies mt-3">
              <div
                v-for="reply in tweet.data().replies"
                :key="reply.id"
                class="reply-item mb-2 p-2 bg-white rounded"
              >
                <div class="d-flex align-items-start">
                  <img
                    :src="reply.profileImage || defaultProfileImage"
                    alt="Profile"
                    class="profile-image-small rounded-circle me-2"
                  />
                  <div class="reply-content">
                    <h6>{{ reply.username }}</h6>
                    <p class="mb-1">{{ reply.text }}</p>
                    <div class="reply-actions mt-2">
                      <button
                        @click="toggleLikeReply(tweet.id, reply.id)"
                        class="btn btn-outline-primary btn-sm me-2"
                      >
                        {{ isReplyLiked(reply) ? "Unlike" : "Like" }} ({{
                          reply.likes || 0
                        }})
                      </button>
                      <button
                        v-if="reply.uid === currentUser.uid"
                        @click="deleteReply(tweet.id, reply.id)"
                        class="btn btn-outline-danger btn-sm"
                      >
                        Delete
                      </button>
                    </div>
                    <small v-if="reply.timestamp" class="text-muted">
                      {{
                        new Date(
                          reply.timestamp.seconds * 1000
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
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  setDoc,
  where,
} from "firebase/firestore";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

// Import lightbox2 CSS and JS
import "lightbox2/dist/css/lightbox.css";
import "lightbox2/dist/js/lightbox.js";
import "jquery";

const tweet = ref("");
const userProfileImage = ref("");
const defaultProfileImage =
  "https://t4.ftcdn.net/jpg/00/64/67/27/360_F_64672736_U5kpdGs9keUll8CRQ3p3YaEv2M6qkVY5.jpg";
const tweetImage = ref(null);
const tweets = ref([]);
const followingUsers = ref([]);
const currentUser = ref(null);
const storage = getStorage();
const tweetUsername = ref("");
const reply = ref("");
const replyingTo = ref(null);

const loadUserProfileImage = async () => {
  const user = auth.currentUser;
  if (user) {
    currentUser.value = user;
    const userDoc = doc(db, "users", user.uid);
    const userSnap = await getDoc(userDoc);
    if (userSnap.exists()) {
      userProfileImage.value =
        userSnap.data().profileImage || defaultProfileImage;
      const username = userSnap.data().name; // Get the username from the user document
      tweetUsername.value = username ? username : "Anônimo"; // Use username if available, otherwise default to "Anônimo"
    } else {
      console.error("Usuário não encontrado.");
    }
  }
};

const loadFollowingUsers = async () => {
  const user = auth.currentUser;
  if (user) {
    const userDoc = doc(db, "followers", user.uid);
    const userSnap = await getDoc(userDoc);
    if (userSnap.exists() && userSnap.data().following) {
      followingUsers.value = userSnap.data().following;
    }
  }
};

const postTweet = async () => {
  const user = auth.currentUser;

  if (user) {
    const userDoc = doc(db, "users", user.uid);
    const userSnap = await getDoc(userDoc);

    let tweetData = {
      uid: user.uid,
      tweet: tweet.value,
      timestamp: serverTimestamp(),
      likes: 0,
      profileImage: userProfileImage.value,
      username: userSnap.data().fullName || "Anônimo", // Use fullName from users collection
      replies: [], // Add replies field
    };

    if (tweetImage.value) {
      const imageRef = storageRef(
        storage,
        `tweets/${user.uid}/${tweetImage.value.name}`
      );
      const snapshot = await uploadBytes(imageRef, tweetImage.value);
      const imageUrl = await getDownloadURL(snapshot.ref);
      tweetData.imageUrl = imageUrl;
    }

    try {
      const docRef = await addDoc(collection(db, "tweets"), tweetData);
      console.log("Tweet guardado com sucesso!");

      // Fetch the newly added tweet document
      const newTweetSnap = await getDoc(docRef);
      const newTweetData = { id: docRef.id, data: () => newTweetSnap.data() };

      // Update the tweets array to include the new tweet
      tweets.value.unshift(newTweetData); // Add the new tweet to the beginning of the array
    } catch (e) {
      console.error("Erro ao guardar tweet: ", e);
    }
  } else {
    console.error("Usuário não autenticado.");
  }

  tweet.value = "";
  tweetImage.value = null;
};


const onImageChange = (event) => {
  tweetImage.value = event.target.files[0];
};

const toggleLike = async (tweetId) => {
  const user = auth.currentUser;
  if (!user) return;

  const tweetRef = doc(db, "tweets", tweetId);
  const tweetSnapshot = await getDoc(tweetRef);
  const currentLikes = tweetSnapshot.data().likes || 0;
  const likedBy = tweetSnapshot.data().likedBy || [];

  if (likedBy.includes(user.uid)) {
    await updateDoc(tweetRef, {
      likes: currentLikes - 1,
      likedBy: likedBy.filter((uid) => uid !== user.uid),
    });
  } else {
    await updateDoc(tweetRef, {
      likes: currentLikes + 1,
      likedBy: [...likedBy, user.uid],
    });
  }

  // Reload tweets after the like operation is done
  loadTweets();
};

const isTweetLiked = (tweet) => {
  const user = auth.currentUser;
  if (!user) return false;

  // Check if the likedBy field exists and is an array
  if (tweet.data().likedBy && Array.isArray(tweet.data().likedBy)) {
    return tweet.data().likedBy.includes(user.uid);
  } else {
    return false; // Return false if the likedBy field is not found or not an array
  }
};

const deleteTweet = async (tweetId) => {
  const tweetRef = doc(db, "tweets", tweetId);
  await deleteDoc(tweetRef);

  // Remove the deleted tweet from the tweets array
  tweets.value = tweets.value.filter((tweet) => tweet.id !== tweetId);
};

const toggleFollow = async (uid) => {
  const user = auth.currentUser;
  if (user) {
    const userDoc = doc(db, "followers", user.uid);
    const userSnap = await getDoc(userDoc);

    if (userSnap.exists()) {
      const currentFollowing = userSnap.data().following || [];
      const isFollowing = currentFollowing.includes(uid);
      const updatedFollowing = isFollowing
        ? currentFollowing.filter((id) => id !== uid)
        : [...currentFollowing, uid];

      await updateDoc(userDoc, { following: updatedFollowing });
      followingUsers.value = updatedFollowing; // Update the followingUsers array

      const targetUserDoc = doc(db, "followers", uid);
      const targetUserSnap = await getDoc(targetUserDoc);

      if (targetUserSnap.exists()) {
        const currentFollowers = targetUserSnap.data().followers || [];
        const updatedFollowers = isFollowing
          ? currentFollowers.filter((id) => id !== user.uid)
          : [...currentFollowers, user.uid];

        await updateDoc(targetUserDoc, { followers: updatedFollowers });
      }
    } else {
      if (!userSnap.exists()) {
        await setDoc(userDoc, { following: [uid] });
        followingUsers.value = [uid]; // Update the followingUsers array
      }

      const targetUserDoc = doc(db, "followers", uid);
      const targetUserSnap = await getDoc(targetUserDoc);

      if (!targetUserSnap.exists()) {
        await setDoc(targetUserDoc, { followers: [user.uid] });
      } else {
        const updatedFollowers = targetUserSnap.data().followers
          ? [...targetUserSnap.data().followers, user.uid]
          : [user.uid];
        await updateDoc(targetUserDoc, { followers: updatedFollowers });
      }
    }
  }
};

const toggleReply = (tweetId) => {
  replyingTo.value = replyingTo.value === tweetId ? null : tweetId;
};

const postReply = async (tweetId) => {
  const user = auth.currentUser;
  if (!user || reply.value.trim() === "") return;

  const tweetRef = doc(db, "tweets", tweetId);
  const tweetSnapshot = await getDoc(tweetRef);
  const currentReplies = tweetSnapshot.data().replies || [];

  const userDoc = doc(db, "users", user.uid);
  const userSnap = await getDoc(userDoc);

  const newReply = {
    id: new Date().getTime().toString(), // Unique ID for the reply
    uid: user.uid,
    text: reply.value,
    timestamp: new Date().getTime(), // Use a timestamp here
    likes: 0,
    profileImage: userProfileImage.value,
    username: userSnap.data().fullname,
  };

  await updateDoc(tweetRef, {
    replies: [...currentReplies, newReply],
  });

  // Reload tweets after the reply operation is done
  loadTweets();
  reply.value = "";
  replyingTo.value = null;
};

const deleteReply = async (tweetId, replyId) => {
  const tweetRef = doc(db, "tweets", tweetId);
  const tweetSnapshot = await getDoc(tweetRef);
  const currentReplies = tweetSnapshot.data().replies || [];

  const updatedReplies = currentReplies.filter((reply) => reply.id !== replyId);

  await updateDoc(tweetRef, {
    replies: updatedReplies,
  });

  // Reload tweets after the delete operation is done
  loadTweets();
};

const toggleLikeReply = async (tweetId, replyId) => {
  const user = auth.currentUser;
  if (!user) return;

  const tweetRef = doc(db, "tweets", tweetId);
  const tweetSnapshot = await getDoc(tweetRef);
  const currentReplies = tweetSnapshot.data().replies || [];

  const updatedReplies = currentReplies.map((reply) => {
    if (reply.id === replyId) {
      const currentLikes = reply.likes || 0;
      const likedBy = reply.likedBy || [];

      if (likedBy.includes(user.uid)) {
        return {
          ...reply,
          likes: currentLikes - 1,
          likedBy: likedBy.filter((uid) => uid !== user.uid),
        };
      } else {
        return {
          ...reply,
          likes: currentLikes + 1,
          likedBy: [...likedBy, user.uid],
        };
      }
    }
    return reply;
  });

  await updateDoc(tweetRef, {
    replies: updatedReplies,
  });

  // Reload tweets after the like operation is done
  loadTweets();
};

const isReplyLiked = (reply) => {
  const user = auth.currentUser;
  if (!user) return false;

  // Check if the likedBy field exists and is an array
  if (reply.likedBy && Array.isArray(reply.likedBy)) {
    return reply.likedBy.includes(user.uid);
  } else {
    return false; // Return false if the likedBy field is not found or not an array
  }
};

const loadTweets = async () => {
  const user = auth.currentUser;
  if (!user) return;

  // Ensure following users are loaded
  await loadFollowingUsers();

  // Create a Firestore query to fetch tweets
  let q;

  // Fetch tweets from the current user and users that the current user follows
  q = query(
    collection(db, "tweets"),
    where("uid", "in", [user.uid, ...followingUsers.value]),
    orderBy("timestamp", "desc")
  );

  try {
    // Fetch all tweets based on the query
    const querySnapshot = await getDocs(q);
    const loadedTweets = [];

    querySnapshot.forEach((doc) => {
      // Add the tweet object to the loadedTweets array
      loadedTweets.push({
        id: doc.id,
        data: () => doc.data(),
      });
    });

    tweets.value = loadedTweets;
  } catch (error) {
    console.error("Error loading tweets:", error);
  }
};

const cancelReply = () => {
  replyingTo.value = null;
  reply.value = "";
};

onMounted(async () => {
  await loadUserProfileImage();
  await loadFollowingUsers(); // Load following users first
  await loadTweets(); // Then load tweets
});
</script>

<style scoped>
.profile-image {
  width: 50px;
  height: 50px;
}

.profile-image-small {
  width: 30px;
  height: 30px;
}

.tweet-image {
  max-width: 100%;
  height: auto;
  max-height: 300px;
  border-radius: 10px;
  object-fit: cover;
}

.post-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
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

.tweet-actions button {
  margin-right: 10px;
}

.reply-form {
  display: flex;
  flex-direction: column;
}

.replies {
  margin-top: 10px;
}

.reply-item {
  padding: 10px;
  border: 1px solid #ccc;
}
</style>
