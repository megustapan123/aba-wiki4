# Firebase Setup For Combo Sharing

1. Create a Firebase project and register a Web app.
2. Enable **Anonymous** sign-in in Authentication.
3. Create a Firestore database and a Cloud Storage bucket.
4. Copy the public Web app configuration values into `firebase-config.js`.
5. In Firebase Console, open **Firestore Database > Rules** and deploy the contents of `firestore.rules`.
6. Open **Storage > Rules** and deploy the contents of `storage.rules`.
7. Approve a submission by changing its Firestore `status` from `pending` to `approved`.

The public site can only read approved combo records. Anonymous visitors can create one pending record for their own uploaded video, but cannot alter or delete submissions. Firebase Console and trusted Admin SDK scripts can approve records because they bypass client security rules.

## Firestore Index

Create this index when Firebase links to it after the first gallery query:

- Collection: `combos`
- Fields: `status` ascending, `createdAt` descending
