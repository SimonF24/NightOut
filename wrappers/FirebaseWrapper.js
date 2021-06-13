import firebase from 'firebase';
import 'firebase/firestore';
import {
  firebaseAPIKey,
  firebaseAuthDomain,
  firebaseDatabaseURL,
  firebaseProjectId,
  firebaseStorageBucket,
  firebaseMessagingSenderID,
} from '../secrets';

class FirebaseWrapper {
    constructor() {
      if (!firebase.apps.length) {firebase.initializeApp({
          apiKey: firebaseAPIKey,
          authDomain: firebaseAuthDomain,
          databaseURL: firebaseDatabaseURL,
          projectId: firebaseProjectId,
          storageBucket: firebaseStorageBucket,
          messagingSenderID: firebaseMessagingSenderID
        })
      }
    }

    changePassword(password, successCallback, failureCallback) {
      // Changes the current user's password, note that the user must have signed in recently
      firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
          user.updatePassword(password).then(successCallback).catch((error) => failureCallback(error))
        } else {
          error = {
            code:'custom',
            message:'No user logged in'
          }
          failureCallback(error)
        }
      });
    }

    checkUsernameExists(username) {
      //Checks if the given username exists in the database, says username doesn't exist in the case of an error
      let db = firebase.firestore();
      let exists = false;
      db.collection('usernames').doc(username).get().then(function(doc) {
        if (doc.exists) {
          exists = true;
        } else {
          exists = false;
        }
      }).catch() // Fail silently, don't break the app over this
      return exists
    }

    deleteUser(user, successCallback, failureCallback) {
      // Deletes the user's data and account, note that the user must have signed in recently for this to be effective
      // To get to the screen where they can delete their account, the user must have a username
      // so we don't need to handle the cases where user is null or the user's username is null
      let db = firebase.firestore();
      let batch = db.batch();

      const userRef = db.collection('users').doc(user.uid.toString())
      batch.delete(userRef)

      const usernameRef = db.collection('usernames').doc(user.username)
      batch.delete(usernameRef)

      batch.commit()
        .catch((error) => failureCallback(error)) // Neither user data nor user account was deleted
        .then(user.delete())
        .then(successCallback)
        .catch((error) => { // User data was deleted but user account was not
          error.customMessage = 'Your account data was deleted but an error occured while deleting your account';
          failureCallback(error)
        }) 
    }
  
    getCurrentUser() { 
      // Checks if a user is currently signed in, if a user is signed in
      // it tries to get the user's displayName and username from firebase
      // and add them to the returned user model.
      // This will return null if no user exists and fields that don't exist will be null
      firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
          let db = firebase.firestore();
          db.collection('users')
          .doc(user.uid.toString())
          .get()
          .then(function(userDoc) {
            if (userDoc.exists) {
              user.displayName = userDoc.data.displayName;
              user.username = userDoc.data.username
            } else {
              user.displayName = null;
              user.username = null;
            }})
          .catch(function(error) {
            user = null; // Set the user to null if an error occurs
          })
        }
        return user;
      })
    }
  
    loginWithEmailAndPassword(email, password, successCallback, failureCallback) {
      // Logs a user into firebase using an email and password 
      firebase
        .auth()
        .signInWithEmailAndPassword(email, password)
        .then(successCallback)
        .catch((error) => failureCallback(error));
    }

    loginWithFacebook(token, successCallback, failureCallback) {
      // Logs a user into firebase using a Facebook authentication token
      let credential = firebase.auth.FacebookAuthProvider.credential(token);
      firebase.auth().signInWithCredential(credential).then(successCallback).catch((error) => failureCallback(error));
    }

    reauthenticateWithFacebook(token, successCallback, failureCallback) {
      let credential = firebase.auth.FacebookAuthProvider.credential(token);
      firebase.auth().reauthenticateWithCredential(credential).then(successCallback).catch((error) => failureCallback(error));
    }

    sendPasswordResetEmail(emailAddress, successCallback, failureCallback) {
      // Sends a password reset email to the email entered if an account exists for that email
      firebase.auth().sendPasswordResetEmail(emailAddress).then(successCallback).catch((error) => failureCallback(error))
    }

    signOut(successCallback, failureCallback) {
      // Checks if a user is currently signed in to firebase and if there is signs the user out of firebase
      let user = this.getCurrentUser();
      if (user) {
        firebase
        .auth()
        .signOut()
        .then(successCallback)
        .catch((error) => failureCallback(error));
      } else { // No user is signed in, which is the desired outcome of this function
        successCallback();
      }
    }

    signUp(displayName, email, password, username, successCallback, failureCallback) {
      // Creates a firebase user account and tries to set the displayName and username in cloud Firestore
      firebase
        .auth()
        .createUserWithEmailAndPassword(email, password)
        .catch((error) => failureCallback(error)) // An error occured and no user was created
        .then(() => {

            let db = firebase.firestore();
            let batch = db.batch();
            let user = this.getCurrentUser();

            const userRef = db.collection('users').doc(user.uid.toString())
            batch.set(userRef,{
              displayName: displayName, 
              username:username
            })

            const usernameRef = db.collection('usernames').doc(username)
            batch.set(usernameRef, {
              uid:user.uid
            })

            return batch.commit() // Returns a promise to continue to chain
          }
        )
        .finally(successCallback); // Since a user was created, call the action a success,
                                   // the home page will deal with the case where the dislayName 
                                   // or username weren't actually updated
    }

    updateDisplayName(user, displayName, successCallback, failureCallback) {
      // Tries to update an existing user document with a new displayName, if the document wasn't found, one is created
      let db = firebase.firestore();
      db.collection('users')
        .doc(user.uid.toString())
        .set({
          displayName: displayName
        }, {merge: true})
        .then(successCallback)
        .catch((error) => failureCallback(error))
    }

    updateUsername(user, username, successCallback, failureCallback) {
      // Tries to update an existing user document with a new username and update the username index accordingly
      let db = firebase.firestore();
      let batch = db.batch()

      const userRef = db.collection('users').doc(user.uid.toString())
      batch.set(userRef, {username:username}, {merge: true})

      if (user.username !== null) { // Only try to delete the previous username index doc if the user had a prior username
        const oldUsernameRef = db.collection('usernames').doc(user.username)
        batch.delete(oldUsernameRef)
      }

      const newUsernameRef = db.collection('usernames').doc(username)
      batch.set(newUsernameRef, {
        uid: user.uid
      })

      batch.commit().then(successCallback).catch((error) => failureCallback(error))
    }

    updateDisplayNameAndUsername(user, displayName, username, successCallback, failureCallback) {
      // Tries to update an existing user document with a new displayName and username, if the document wasn't found, one is created
      let db = firebase.firestore();
      let batch = db.batch()

      const userRef = db.collection('users').doc(user.uid.toString())
      batch.set(userRef, {
        displayName: displayName,
        username: username
      }, {merge: true})

      if (user.username !== null) { // Only try to delete the previous username index doc if the user had a prior username
        const oldUsernameRef = db.collection('usernames').doc(user.username)
        batch.delete(oldUsernameRef)
      }
      
      const newUsernameRef = db.collection('usernames').doc(username)
      batch.set(newUsernameRef, {
        uid: user.uid
      })

      batch.commit().then(successCallback).catch((error) => failureCallback(error))
    }
  
}

const firebaseWrapper = new FirebaseWrapper();
export default firebaseWrapper;