# Variant Dropdown Code Explanation

This document explains the code implemented in `views/User/product details.ejs` to display product variants in separate dropdowns stacked vertically next to the "Add to Wishlist" button.

---

## 1. HTML and EJS Rendering Code (Lines 222 - 272)

```html
<!-- Options & Add to Wishlist -->
<div class="flex items-start gap-3"></div>
```

- **Explanation**: Creates a container box that lays out its children horizontally (`flex`), aligning them to the top of the container (`items-start`), with a 12px gap between elements (`gap-3`).

```html
<% // 1. Group the variants by their groupName (like "Color", "Panel") // We
create an empty object to hold the grouped lists of variants const variantGroups
= {}; if (variants && variants.length > 0) { for (let i = 0; i <
variants.length; i++) { const v = variants[i]; // If this groupName doesn't
exist in our object yet, create an empty array for it if
(!variantGroups[v.groupName]) { variantGroups[v.groupName] = []; } // Add the
variant to its respective group array variantGroups[v.groupName].push(v); } } //
Get the list of all group names (e.g. ["Color", "Panel"]) const groupNames =
Object.keys(variantGroups); %>
```

- **Explanation**:
  - Declares an empty JavaScript object named `variantGroups`.
  - Runs a standard `for` loop from `0` to `variants.length - 1` to inspect each variant `v` of the product.
  - If `variantGroups` does not have a key for the current variant's `groupName` (e.g. "Color"), it initializes it to an empty array `[]`.
  - Pushes the variant `v` into the array matching its `groupName`.
  - Uses `Object.keys()` to extract all unique group names (like `["Color", "Panel"]`) and stores them in the array `groupNames`.

```html
<% if (groupNames.length > 0) { %>
```

- **Explanation**: If there is at least one variant group name in the list, compile and output the following HTML blocks.

```html
<!-- Hidden input to store the active variant ID that is sent to the backend/cart -->
<input
  type="hidden"
  id="variant-select"
  value="<%= (typeof selectedVariantId !== 'undefined' && selectedVariantId) ? selectedVariantId : '' %>"
/>
```

- **Explanation**: Renders a hidden text input with ID `variant-select`. Its value is dynamically populated with the pre-selected variant's ID if one is defined; otherwise, it defaults to an empty string.

```html
<!-- Render separate dropdowns stacked vertically in a flex-grow container -->
<div class="flex flex-col gap-3 flex-grow"></div>
```

- **Explanation**: Creates a vertical flexbox container (`flex-col`) that automatically expands to fill all remaining horizontal space (`flex-grow`), with a 12px gap between child elements (`gap-3`).

```html
<% for (let i = 0; i < groupNames.length; i++) { %> <% const groupName =
groupNames[i]; %>
```

- **Explanation**: Loops through each group name in the `groupNames` list. On each iteration, it assigns the current group name to a variable `groupName`.

```html
<div class="relative h-12 w-full"></div>
```

- **Explanation**: Creates a container for each select dropdown that is 48px high (`h-12`), takes the full width of the parent container (`w-full`), and has a position of `relative` so that the custom arrow icon can be positioned absolutely inside it.

```html
                    <select class="variant-group-select w-full h-full appearance-none bg-white bg-none border border-slate-200 rounded px-4 pr-8 font-label text-xs font-bold uppercase tracking-wider text-[#0D1B2A] <%= locals.isBlocked ? 'cursor-not-allowed bg-slate-100 text-slate-400' : 'cursor-pointer' %> focus:outline-none"
                            data-group-name="<%= groupName %>"
                            onchange="handleVariantChange(this)"
                            <%= locals.isBlocked ? 'disabled' : '' %>>
```

- **Explanation**:
  - Renders an HTML `<select>` element.
  - Adds classes for styling (borders, margins, fonts, uppercase text, colors).
  - Uses a ternary expression to check if the product is blocked (`locals.isBlocked`). If true, it adds disabled cursors and background styles; otherwise, it shows a pointing cursor.
  - Sets the custom attribute `data-group-name` to the group's name.
  - Triggers the JavaScript function `handleVariantChange(this)` whenever the selection changes.
  - Disables the element if the product is blocked.

```html
<% const groupVariants = variantGroups[groupName]; %> <% for (let j = 0; j <
groupVariants.length; j++) { %> <% const v = groupVariants[j]; %>
```

- **Explanation**: Retrieves the array of variants belonging to the current `groupName`. Loops through each variant `v` in that array.

```html
                            <option value="<%= v._id %>"
                                    data-price-add="<%= v.priceAdd %>"
                                    data-images="<%= v.images ? v.images.join(',') : '' %>"
                                    data-stock="<%= v.stock %>"
                                    <%= (typeof selectedVariantId !== 'undefined' && selectedVariantId && selectedVariantId.toString() === v._id.toString()) ? 'selected' : '' %>>
                                <%= v.groupName %>: <%= v.option %> <%= v.priceAdd > 0 ? '(+₹' + v.priceAdd + ')' : '' %>
                            </option>
                        <% } %>
```

- **Explanation**:
  - Renders an HTML `<option>` element.
  - Sets the `value` to the variant's MongoDB ID (`v._id`).
  - Sets custom data attributes containing the price addition (`data-price-add`), image paths joined as a comma-separated string (`data-images`), and variant stock count (`data-stock`).
  - Compares the option's ID to `selectedVariantId` and appends `selected` to make it the default active option if they match.
  - Outputs the visible text for the option (e.g. `PANEL: IPS (+₹100)`).

```html
                    </select>
                    <span class="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-sm pointer-events-none text-[#0D1B2A]">expand_more</span>
                </div>
            <% } %>
        </div>
    <% } %>
```

- **Explanation**:
  - Closes the select tag.
  - Adds an arrow icon from Google Symbols, positioned absolutely on the right-hand edge, vertically centered, and configured to ignore click events (`pointer-events-none`).
  - Closes the EJS loop blocks.

---

## 2. JavaScript Interaction Code (Lines 725 - 815)

### Function: `handleVariantChange(selectElement)`

```javascript
// This function runs whenever the user changes a select option in one of the variant dropdowns
function handleVariantChange(selectElement) {
  // 1. Get the value of the option the user clicked (this is the selected variant ID)
  var selectedValue = selectElement.value;

  // 2. Get the hidden input that stores the active variant ID
  var hiddenInput = document.getElementById("variant-select");

  // 3. If a valid option is selected (not placeholder or empty)
  if (selectedValue) {
    // Update the hidden input value so the form knows which variant is selected
    if (hiddenInput) {
      hiddenInput.value = selectedValue;
    }

    // 4. Since only one variant can be purchased at a time, reset all other dropdowns
    var allSelects = document.querySelectorAll(".variant-group-select");
    for (var i = 0; i < allSelects.length; i++) {
      var select = allSelects[i];
      // If it is a different select element than the one clicked, reset it to its first option (index 0)
      if (select !== selectElement) {
        select.selectedIndex = 0;
      }
    }

    // 5. Update the page's product gallery, price, and stock indicators to match the selected variant
    updateVariantGallery(selectElement);
  }
}
```

- **Explanation**:
  - Sets up the change handler for dropdown selects.
  - Fetches the selected variant ID from the select value and stores it in the hidden input `#variant-select`.
  - Selects all dropdowns on the page using class `.variant-group-select`.
  - Loops through them and resets any other select element to index `0` (its default option), ensuring the user does not visually select options from multiple groups simultaneously.
  - Calls `updateVariantGallery` to refresh the pricing, image thumbnails, and stock details based on the selected variant.

---

### Function: `window.addEventListener('DOMContentLoaded', ...)`

```javascript
// This block of code runs when the webpage has finished loading completely
window.addEventListener('DOMContentLoaded', function () {
    var hiddenInput = document.getElementById('variant-select');
    var selectedVal = '';
    if (hiddenInput) {
        selectedVal = hiddenInput.value;
    }

    var activeSelect = null;

    // 1. If there is a pre-selected variant (e.g. redirected with a variant selected)
    if (selectedVal) {
        var allSelects = document.querySelectorAll('.variant-group-select');
        // Look through all dropdowns to find which one contains the pre-selected variant value
        for (var i = 0; i < allSelects.length; i++) {
            var select = allSelects[i];
            for (var j = 0; j < select.options.length; j++) {
                if (select.options[j].value === selectedVal) {
                    select.value = selectedVal;
                    activeSelect = select;
                    break;
                }
            }
            if (activeSelect) {
                break;
            }
        }
    }

    // 2. Fallback: If no variant is pre-selected, default to the first option of the first select group
    if (!activeSelect) {
        var firstSelect = document.querySelector('.variant-group-select');
        if (firstSelect) {
            if (firstSelect.options.length > 0) {
                firstSelect.selectedIndex = 0; // Select the first actual option
                if (hiddenInput) {
                    hiddenInput.value = firstSelect.value;
                }
                activeSelect = firstSelect;
            }
        }
    }

    // 3. If we have variant selects, update the gallery/price display with the active select
    var hasVariantSelects = document.querySelectorAll('.variant-group-select').length > 0;
    if (hasVariantSelects) {
        if (activeSelect) {
            updateVariantGallery(activeSelect);
        } else {
            resetVariantDisplay();
        }
    }
    ...
```

- **Explanation**:
  - Attaches a listener that executes when the HTML document is fully parsed.
  - Checks if the hidden `#variant-select` has an initial value (which occurs if a specific variant ID was pre-selected from the backend).
  - If a value exists, loops through all dropdown options to find it, sets that select's value, and designates it as the `activeSelect`.
  - If no variant is pre-selected, it queries the very first variant dropdown (`.variant-group-select`), selects its first option (`selectedIndex = 0`), updates the hidden `#variant-select` input's value, and sets it as the `activeSelect`.
  - Updates the page display with the details of the active select.

---

### Function: `updateVariantGallery(selectElement)`

```javascript
function updateVariantGallery(selectElement) {
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    if (!selectedOption) return;
    const imagesAttr = selectedOption.getAttribute('data-images') || '';
    const images = imagesAttr ? imagesAttr.split(',') : [];
    const priceAdd = parseFloat(selectedOption.getAttribute('data-price-add') || '0');
```

- **Explanation**:
  - Retrieves the selected option element from the active select dropdown using the `selectedIndex` property.
  - Exits early if there is no selected option.
  - Retrieves the `data-images` attribute containing image paths, splitting it into an array on each comma character.
  - Retrieves the `data-price-add` attribute containing the additional variant cost and parses it to a floating-point number, defaulting to `0` if empty.

---

### Function: `resetVariantDisplay()`

```javascript
function resetVariantDisplay() {
    // 1. Revert Price to base product price
    const priceEl = document.getElementById('product-price');
    ...
    // 2. Disable buttons and show "Select Variant" message
    const stockBadge = document.getElementById('stock-badge');
    const stockText = document.getElementById('stock-count-text');
    ...
```

- **Explanation**:
  - Finds the price elements (`#product-price` and `#product-base-price`) and resets their text content to the baseline product prices retrieved from custom data attributes.
  - Finds the stock indicator badges and updates their text to display `"Select Variant"`.
  - Disables the "Add to Cart" and "Buy Now" button elements so the user cannot click them, updating their labels to `"Select Variant"`.
