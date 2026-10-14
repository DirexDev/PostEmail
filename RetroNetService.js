/**
 * RetroNetService.js - Rdzeń autoryzacji, trwałego RetroNet ID oraz obsługi P2P i Catppa
 * Twórca: Karol Kopeć | Ekosystem RetroNet 2026
 */
(function (window) {
    window.RetroNetService = {
        init: function (firebaseConfig) {
            if (!window.firebase) {
                console.error("RetroNetService: Brak biblioteki Firebase SDK.");
                return;
            }

            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }

            const auth = firebase.auth();
            const db = firebase.firestore();
            
            auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
            const SUFFIX = "@retronet.call";

            return {
                auth: auth,
                db: db,
                suffix: SUFFIX,

                // Rozpakowywanie kontenera danych przez bibliotekę unpackge / Catppa
                unpackRegistrationPackage: function (rawPackageData) {
                    try {
                        if (typeof unpackge !== 'undefined' && typeof unpackge.extract === 'function') {
                            return unpackge.extract(rawPackageData);
                        }
                        const jsonString = atob(rawPackageData);
                        return JSON.parse(jsonString);
                    } catch (err) {
                        try { return JSON.parse(rawPackageData); } catch(e) { return null; }
                    }
                },

                // Obsługa sesji i ładowania danych po poprawnym wywołaniu logowania z Auth.html
                onAuthReady: function (callback) {
                    auth.onAuthStateChanged((user) => {
                        if (user) {
                            const userRef = db.collection('users').doc(user.uid);
                            userRef.get().then((doc) => {
                                const username = doc.exists && doc.data().username ? doc.data().username : user.email.split('@')[0];
                                callback({
                                    user: user,
                                    username: username,                // Czysta nazwa do szybkich połączeń P2P (np. "karol")
                                    fullAddress: username + SUFFIX,    // Pełny adres do poczty PostEmail (np. "karol@retronet.call")
                                    peerId: username                   // Stały identyfikator
                                });
                            });
                        } else {
                            callback(null);
                        }
                    });
                },

                // Logowanie wywoływane z Auth.html za pomocą czystej nazwy
                login: function (username, password) {
                    const cleanName = username.trim().toLowerCase().replace(SUFFIX, '');
                    const fullEmail = cleanName + SUFFIX;
                    return auth.signInWithEmailAndPassword(fullEmail, password);
                },

                // Rejestracja powiązana z kontenerem Catppa / unpackge i czystą nazwą
                register: function (username, password, extraData) {
                    const cleanName = username.trim().toLowerCase().replace(SUFFIX, '');
                    const fullEmail = cleanName + SUFFIX;

                    return auth.createUserWithEmailAndPassword(fullEmail, password).then((cred) => {
                        return db.collection('users').doc(cred.user.uid).set({
                            username: cleanName,
                            peerId: cleanName,
                            age: extraData.age,
                            accountType: extraData.accountType,
                            registeredAt: new Date().toISOString()
                        });
                    });
                },

                logout: function () {
                    return auth.signOut().then(() => window.location.href = "Auth.html");
                }
            };
        }
    };
})(window);
