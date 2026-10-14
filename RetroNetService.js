/**
 * RetroNetService.js - Realny rdzeń procesów i autoryzacji ekosystemu RetroNet
 * Stworzone przez: Karol Kopeć (14 lat, klasa 7)
 * Szkoła Podstawowa nr 11 z Oddziałami Integracyjnymi im. Kornela Makuszyńskiego w Białymstoku (ul. Sienkiewicza)
 * Rok utworzenia: 2026 | Fundament firmowy
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

                unpackRegistrationPackage: function (rawPackageData) {
                    try {
                        if (typeof unpackge !== 'undefined' && typeof unpackge.extract === 'function') {
                            return unpackge.extract(rawPackageData);
                        }
                        return JSON.parse(atob(rawPackageData));
                    } catch (err) {
                        console.error("RetroNetService [unpackge]: Błąd rozpakowywania kontenera danych:", err);
                        return null;
                    }
                },

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
                            }).catch(() => {
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

                register: function (username, password, extraData) {
                    const cleanName = username.trim().toLowerCase();
                    const fullEmail = cleanName.includes('@') ? cleanName : cleanName + SUFFIX;

                    return db.collection('users').get().then((snapshot) => {
                        let maxId = 1000;
                        snapshot.forEach((doc) => {
                            const id = parseInt(doc.data().peerId, 10);
                            if (!isNaN(id) && id > maxId) maxId = id;
                        });
                        const nextId = (maxId + 1).toString();

                        return auth.createUserWithEmailAndPassword(fullEmail, password).then((cred) => {
                            return db.collection('users').doc(cred.user.uid).set({
                                username: cleanName.split('@')[0],
                                peerId: nextId,
                                age: extraData.age,
                                accountType: extraData.accountType,
                                phone: extraData.phone,
                                registeredAt: new Date().toISOString()
                            });
                        });
                    });
                },

                logout: function () {
                    return auth.signOut().then(() => window.location.reload());
                }
            };
        }
    };
})(window);
