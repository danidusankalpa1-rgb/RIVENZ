STEP 2 — Client Profile + Client Details

This step only adds a clean Firestore-backed client profile system.

New pages:
- profile.html — client-facing profile page
- client-details.html — admin client management page

Live sync:
- Both pages use Firestore onSnapshot on clients/{uid}.
- Client edits name/phone -> admin client details updates.
- Admin edits name/phone -> client profile updates.

Existing invitation STEP 1 files were kept unchanged.
Existing order/payment/service systems were not redesigned in this step.

Deploy website files as usual. No R2 Worker change is required for STEP 2.
