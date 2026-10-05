STEP 1 ONLY — WEDDING E-INVITATION REBUILD

This version only rebuilds the public Wedding E-Invitation content flow.

What changed:
- New isolated catalog: invitation-v2
- Admin can add couple names, title, description, live website URL and one or more screenshots.
- Screenshots are stored in R2.
- Invitation catalog is stored in the private R2 bucket as a JSON catalog.
- Admin verifies the saved invitation by reading it back before showing success.
- Admin remove verifies the item is actually gone.
- Public weddings.html reads only the new invitation-v2 catalog.
- Public page no longer falls back to browser localStorage for invitations.
- Public page has explicit DOM references (no fragile browser-global element IDs).
- Duplicate invitation grid markup was removed.
- Worker CORS now includes DELETE for removal.

Important:
- This does NOT rebuild Client Profile, Client Details, Order Details, Services, payments, or the normal order upload flow.
- Existing old invitation data is isolated by using invitation-v2; it is not displayed by the new page.
- Keep the R2 bucket private.

Deployment:
1. Cloudflare Worker graphics-file-api -> Edit code.
2. Replace worker.js with cloudflare-worker.js from this ZIP.
3. Deploy.
4. Replace website files with this ZIP.
5. Test only this flow:
   Admin -> Wedding Invitations -> Add Invitation
   -> refresh admin -> invitation remains
   -> open public Wedding E-Invites -> invitation appears
   -> open website -> screenshots
   -> return admin -> Remove Invitation -> refresh -> gone.
