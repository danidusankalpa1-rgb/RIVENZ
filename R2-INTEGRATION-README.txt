GRAPHICS - R2 FILE STORAGE INTEGRATION
======================================

This version keeps Firebase Authentication + Firestore for account/order data and
moves order-related file uploads to the Cloudflare R2 bucket through the Worker.

Cloudflare Worker
-----------------
Worker URL:
https://graphics-file-api.danidusankalpa56.workers.dev

R2 binding already configured in the dashboard:
Variable name: FILES
Bucket: graphics-order-files

1. Open the Cloudflare Worker graphics-file-api.
2. Open Edit code.
3. Replace worker.js with the contents of cloudflare-worker.js in this package.
4. Deploy.
5. The Worker root should return:
   Graphics File API is running

The Worker verifies Firebase ID tokens before allowing uploads/downloads and uses
the FILES R2 binding. Do not make the R2 bucket public and do not put an R2 API
secret in the website code.

Website files changed
---------------------
- order-flow.js
  - Removed Firebase Storage.
  - Uploads order files to the Cloudflare Worker/R2.
  - Fetches private R2 files with the signed-in Firebase ID token.
- order.html
  - Uses the new R2 upload path and updated error messages.
- order-details.html
  - Loads private R2 preview/final/refund files through the Worker.
- admin.html
  - Loads payment proofs and previews through the Worker.
- admin-order.html
  - Loads client files, payment proofs and previews through the Worker.

Order files stored in R2
------------------------
Client reference files, payment receipts, balance receipts, previews, final files,
and refund receipts are uploaded through the Worker.

Each upload receives a random object ID, for example:
users/<firebase-uid>/orders/<order-id>/<folder>/<random-id>_<filename>

Firestore stores the returned path/metadata in the order document.

Important
---------
This package does NOT make the R2 bucket public.
The website must be served over HTTPS for Firebase Auth/Worker requests in production.

Existing browser-only sample/portfolio storage is intentionally left untouched in
this first migration so the existing UI is not disrupted. The order file flow is
now the shared R2 flow.
