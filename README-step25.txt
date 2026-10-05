Graphics Website — Step 25

Fixed only the reported broken flows:
- Payment receipt upload/send now uses IndexedDB file storage so browser localStorage quota does not break uploads.
- Balance payment receipt upload/send fixed.
- Admin payment/balance receipt view and approval fixed.
- Admin preview/final/refund receipt uploads fixed and synced to the order.
- Final file is stored separately and remains locked until final approval + full payment.
- Sample image add/remove fixed with IndexedDB storage; service pages can display stored samples.
- Existing large data-URL uploads/samples are migrated to file storage when pages load.
- Order status options now include the statuses used by the payment/final-delivery flow.
- Refund receipt upload is hidden until the client actually submits a refund request.

No unrelated design/content features were intentionally changed.
This remains a browser-local demo; it is not a real backend/payment gateway.
