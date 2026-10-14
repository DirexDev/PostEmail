/**
 * RetroNetService.js - Centralny rdzeń usług i tożsamości ekosystemu RetroNet
 */
(function (window) {
    // Konfiguracja bazy danych Firebase
    const firebaseConfig = {
        apiKey: "AIzaSyB7Q9TSXa4CQc2nSiUhS044wD463jBHpr0",
        authDomain: "retronetcall.firebaseapp.com",
        projectId: "retronetcall",
        storageBucket: "retronetcall.firebasestorage.app",
        messagingSenderId: "820407833858",
        appId: "1:820407833858:web:e4e1cc71f364955b3bde1b"
    };

    // Inicjalizacja Firebase, jeśli jeszcze nie nastąpiła
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    const auth = firebase.auth();
    const db = firebase.firestore();
    
    // Ustawienie stałej trwałości sesji w przeglądarce
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

    const SUFFIX = "@retronet.call";

    // Globalny obiekt systemowy RetroNet dostępny dla wszystkich aplikacji w rodzinie
    window.RetroNet = {
        auth: auth,
        db: db,
        suffix: SUFFIX,

        // Nasłuchiwanie stanu autoryzacji użytkownika
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
                        console.error("RetroNetService: Błąd pobierania profilu użytkownika:", err);
                        callback(null);
                    });
                } else {
                    callback(null);
                }
            });
        },

        // Logowanie do sieci RetroNet
        login: function (username, password) {
            const cleanName = username.trim().toLowerCase();
            const fullEmail = cleanName.includes('@') ? cleanName : cleanName + SUFFIX;
            return auth.signInWithEmailAndPassword(fullEmail, password);
        },

        // Rejestracja nowego konta z automatycznym, sekwencyjnym przydzielaniem ID (1001, 1002...)
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

        // Wylogowanie z sieci
        logout: function () {
            return auth.signOut().then(() => {
                window.location.reload();
            });
        }
    };
})(window);
