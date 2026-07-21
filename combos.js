import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { addDoc, collection, getFirestore, onSnapshot, orderBy, query, serverTimestamp, where } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js';
import { firebaseConfig } from './firebase-config.js';

const configurationKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'appId'];
const status = document.getElementById('combo-status');
const form = document.getElementById('combo-form');
const submitButton = document.getElementById('combo-submit');
const submitStatus = document.getElementById('combo-submit-status');
const grid = document.getElementById('combo-grid');
const videoLimit = 35 * 1024 * 1024;
const acceptedVideoTypes = new Set(['video/mp4', 'video/webm', 'video/quicktime']);

function showConfigurationMessage() {
    status.textContent = 'Combo sharing will be available after Firebase is connected.';
    submitButton.disabled = true;
    submitStatus.textContent = 'Add your Firebase web app settings to firebase-config.js.';
}

function renderCombos(snapshot) {
    grid.replaceChildren();
    const combos = snapshot.docs.map((entry) => entry.data());

    if (!combos.length) {
        status.textContent = 'No approved combos have been published yet.';
        return;
    }

    status.textContent = `${combos.length} approved combo${combos.length === 1 ? '' : 's'}.`;
    combos.forEach((combo) => {
        const card = document.createElement('article');
        card.className = 'combo-card';

        const video = document.createElement('video');
        video.src = combo.videoUrl;
        video.controls = true;
        video.preload = 'metadata';
        video.playsInline = true;
        video.setAttribute('aria-label', `${combo.title} combo video`);

        const body = document.createElement('div');
        body.className = 'combo-card-body';
        const title = document.createElement('h3');
        title.textContent = combo.title;
        const character = document.createElement('p');
        character.className = 'combo-character';
        character.textContent = combo.character;
        body.append(title, character);

        if (combo.notes) {
            const notes = document.createElement('p');
            notes.className = 'combo-notes';
            notes.textContent = combo.notes;
            body.append(notes);
        }

        card.append(video, body);
        grid.append(card);
    });
}

async function initializeComboLibrary() {
    if (!configurationKeys.every((key) => firebaseConfig[key])) {
        showConfigurationMessage();
        return;
    }

    try {
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const database = getFirestore(app);
        const storage = getStorage(app);
        const credentials = await signInAnonymously(auth);
        const approvedCombos = query(
            collection(database, 'combos'),
            where('status', '==', 'approved'),
            orderBy('createdAt', 'desc')
        );

        onSnapshot(approvedCombos, renderCombos, () => {
            status.textContent = 'Unable to load community combos.';
        });

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const title = document.getElementById('combo-title').value.trim();
            const character = document.getElementById('combo-character').value.trim();
            const notes = document.getElementById('combo-notes').value.trim();
            const video = document.getElementById('combo-video').files[0];

            if (!video || !acceptedVideoTypes.has(video.type) || video.size > videoLimit) {
                submitStatus.textContent = 'Use an MP4, WebM, or MOV video up to 35 MB.';
                return;
            }

            submitButton.disabled = true;
            submitStatus.textContent = 'Uploading combo...';

            try {
                const extension = video.name.split('.').pop().toLowerCase() || 'mp4';
                const videoPath = `combo-videos/${credentials.user.uid}/${crypto.randomUUID()}.${extension}`;
                const videoReference = ref(storage, videoPath);
                await uploadBytes(videoReference, video, { contentType: video.type });
                const videoUrl = await getDownloadURL(videoReference);

                await addDoc(collection(database, 'combos'), {
                    title,
                    character,
                    notes,
                    videoUrl,
                    videoPath,
                    ownerId: credentials.user.uid,
                    status: 'pending',
                    createdAt: serverTimestamp()
                });

                form.reset();
                submitStatus.textContent = 'Submitted for review.';
            } catch (error) {
                console.warn('Unable to submit combo.', error);
                submitStatus.textContent = 'Upload failed. Please try again.';
            } finally {
                submitButton.disabled = false;
            }
        });
    } catch (error) {
        console.warn('Unable to initialize Firebase combos.', error);
        status.textContent = 'Unable to connect to combo sharing.';
    }
}

initializeComboLibrary();
