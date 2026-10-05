RIVENZ CLOTHING — STEP 3: PRODUCT DETAILS

This step adds a dedicated RIVENZ product-details experience after the Shop / Products page.

Changed:
- services.html: the Shop card "Details" action now opens product-details.html for the selected product.
- product-details.html: new dedicated product details page.

Product details includes:
- Multiple product images with thumbnails, arrows and touch swipe
- Product name, category, description and price / offer price
- Color selection
- Size selection (using the configured stock sizes)
- Stock availability for the selected option
- Quantity controls
- Size chart display when product data contains one
- Add to Cart (stores the selected product variant in the RIVENZ cart store)
- Buy Now with selected product, color, size and quantity passed to the existing order flow

Not changed:
- Checkout / Order Form
- Payment flow
- Order confirmation
- Admin product manager
- Firebase / R2 configuration
- Other unrelated project files

File changes:
- Modified: 1 existing file
- Added: 2 new files (product-details.html + this README)
- Total package files: 39
- Missing from source package: 0
- Extra/unrelated modified files: 0

The existing UI direction is preserved; this step only establishes the clothing product-detail layer needed before the Cart step.
