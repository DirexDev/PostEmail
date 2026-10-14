/**
 * RetroNetService.js - Centralny rdzeń usług i tożsamości ekosystemu RetroNet
 */
(function (window) {
    const firebaseConfig = {
        apiKey: "AIzaSyB7Q9TSXa4CQc2nSiUhS044wD463jBHpr0",
        authDomain: "retronetcall.firebaseapp.com",
        projectId: "retronetcall",
        storageBucket: "retronetcall.firebasestorage.app",
        messagingSenderId: "820407833858",
        appId: "1:820407833858:web:e4e1cc71f364955b3bde1b"
    };

    if (!window.firebase) {
        console.error("RetroNetService: Brak załadowanego SDK Firebase!");
        return;
    }

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    const auth = firebase.auth();
    const db = firebase.firestore();
    
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    const SUFFIX = "@retronet.call";

    window.RetroNet = {
        auth: auth,
        db: db,
        suffix: SUFFIX,

        onAuthReady: function (callback) {
            auth.onAuthStateChanged((user) => {
                if (user) {
                    db.collection('users').doc(user.uid).get().then((doc) => {
                        const userData = doc.exists ? doc.data() : { username: user.email.split('@')[0], peerId: "1001" };
                        callback({
                            user: user,
                            username: userData.username,
                            fullAddress: userData.username + SUFFIX,
                            peerId: userData.peerId
                        });
                    }).catch(err => {
                        console.error("RetroNetService: Błąd pobierania profilu z Firestore:", err);
                        callback({
                            user: user,
                            username: user.email.split('@')[0],
                            fullAddress: user.email,
                            peerId: "1001"
                        });
                    });
                } else {
                    callback(null);
                }
            });
        },

        login: function (username, password) {
            const cleanName = username.trim().toLowerCase();
            const fullEmail = cleanName.includes('@') ? cleanName : cleanName + SUFFIX;
            return auth.signInWithEmailAndPassword(fullEmail, password);
        },

        register: function (username, password) {
            const cleanName = username.trim().toLowerCase();
            const fullEmail = cleanName.includes('@') ? cleanName : cleanName + SUFFIX;

            return db.collection('users').get().then((snapshot) => {
                let maxId = 1000;
                snapshot.forEach((doc) => {
                    const id = parseInt(doc.data().peerId, 10);
                    if (!isNaN(id) && id > maxId) {
                        maxId = id;
                    }
                });
                const nextId = (maxId + 1).toString();

                return auth.createUserWithEmailAndPassword(fullEmail, password).then((cred) => {
                    return db.collection('users').doc(cred.user.uid).set({
                        username: cleanName.split('@')[0],
                        peerId: nextId
                    });
                });
            });
        },

        logout: function () {
            return auth.signOut().then(() => {
                window.location.reload();
            });
        }
    };
    console.log("RetroNetService załadowany pomyślnie.");
})(window);
