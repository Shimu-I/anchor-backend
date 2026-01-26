// Category button functionality
const categoryButtons = document.querySelectorAll('.category-btn');
const customCategoryInput = document.getElementById('customCategory');
const hiddenCategoryInput = document.getElementById('hiddenCategory');
let selectedCategory = '';

// Cover Photo Upload Functionality
const coverPhotoBtn = document.getElementById('coverPhotoBtn');
const coverPhotoInput = document.getElementById('coverPhotoInput');
const coverPhotoPreview = document.getElementById('coverPhotoPreview');
const removeCoverPhotoBtn = document.getElementById('removeCoverPhotoBtn');
let selectedCoverPhoto = null;

if (coverPhotoBtn) {
    coverPhotoBtn.addEventListener('click', () => {
        coverPhotoInput.click();
    });
}

if (coverPhotoInput) {
    coverPhotoInput.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            selectedCoverPhoto = file;

            // Create preview
            const reader = new FileReader();
            reader.onload = function (e) {
                coverPhotoPreview.innerHTML = `<img src="${e.target.result}" alt="Cover Photo Preview">`;
                coverPhotoPreview.classList.add('has-image');
                removeCoverPhotoBtn.style.display = 'inline-block';
            };
            reader.readAsDataURL(file);
        } else {
            alert('Please select a valid image file.');
            coverPhotoInput.value = '';
        }
    });
}

if (removeCoverPhotoBtn) {
    removeCoverPhotoBtn.addEventListener('click', () => {
        coverPhotoInput.value = '';
        selectedCoverPhoto = null;
        coverPhotoPreview.innerHTML = `
            <i class="fas fa-image" style="font-size: 48px; color: #00bfa5; margin-bottom: 10px;"></i>
            <p style="color: #888; font-size: 14px;">No cover photo selected</p>
            <p style="color: #666; font-size: 12px;">Default category image will be used</p>
        `;
        coverPhotoPreview.classList.remove('has-image');
        removeCoverPhotoBtn.style.display = 'none';
    });
}

categoryButtons.forEach(button => {
    button.addEventListener('click', function () {
        // Remove active class from all buttons
        categoryButtons.forEach(btn => btn.classList.remove('active'));

        // Add active class to clicked button
        this.classList.add('active');

        selectedCategory = this.dataset.category;
        hiddenCategoryInput.value = selectedCategory;

        // Show/hide custom input based on selection
        if (selectedCategory === 'custom') {
            customCategoryInput.style.display = 'inline-block';
            customCategoryInput.focus();
            customCategoryInput.required = true;
        } else {
            customCategoryInput.style.display = 'none';
            customCategoryInput.value = '';
            customCategoryInput.required = false;
        }
    });
});

// Initialize - hide custom category input
customCategoryInput.style.display = 'none';

// Fund Breakdown functionality
let itemCount = 0;

function addBreakdownItem() {
    itemCount++;
    const container = document.getElementById('breakdownItems');
    const itemDiv = document.createElement('div');
    itemDiv.className = 'breakdown-item';
    itemDiv.id = `item-${itemCount}`;

    // Added name attributes for PHP processing
    itemDiv.innerHTML = `
        <input type="text" name="item_name[]" placeholder="Item Name" class="item-name" required>
        <input type="number" name="item_quantity[]" placeholder="Quantity" class="item-quantity" min="1" required>
        <input type="number" name="item_cost[]" placeholder="Cost per unit" class="item-cost" min="0" step="0.01" required>
        <input type="number" placeholder="Total" class="item-total" readonly>
    `;

    container.appendChild(itemDiv);

    // Add event listeners for auto-calculation
    const quantityInput = itemDiv.querySelector('.item-quantity');
    const costInput = itemDiv.querySelector('.item-cost');
    const totalInput = itemDiv.querySelector('.item-total');

    function calculateItemTotal() {
        const quantity = parseFloat(quantityInput.value) || 0;
        const cost = parseFloat(costInput.value) || 0;
        const total = quantity * cost;
        totalInput.value = total.toFixed(2);
        calculateGrandTotal();
    }

    quantityInput.addEventListener('input', calculateItemTotal);
    costInput.addEventListener('input', calculateItemTotal);
}

function calculateGrandTotal() {
    const allTotals = document.querySelectorAll('.item-total');
    let grandTotal = 0;

    allTotals.forEach(input => {
        const value = parseFloat(input.value) || 0;
        grandTotal += value;
    });

    document.getElementById('totalAmount').value = `Total: $${grandTotal.toFixed(2)}`;
    document.getElementById('hiddenAmountNeeded').value = grandTotal.toFixed(2);
}

// Add Item Button
document.getElementById('addItemBtn').addEventListener('click', addBreakdownItem);

// Initialize with one item
addBreakdownItem();

// File Upload handlers
document.querySelector('.upload-btn').addEventListener('click', function () {
    document.getElementById('fileUpload').click();
});

document.getElementById('fileUpload').addEventListener('change', function (e) {
    const files = e.target.files;
    if (files.length > 0) {
        alert(`${files.length} file(s) selected`);
    }
});

// Other purpose input visibility
// Note: name is now purpose[]
const otherCheckbox = document.querySelector('input[value="other"]');
const otherInput = document.getElementById('otherPurpose');

if (otherCheckbox) {
    otherCheckbox.addEventListener('change', function () {
        if (this.checked) {
            otherInput.style.display = 'inline-block';
        } else {
            otherInput.style.display = 'none';
            otherInput.value = '';
        }
    });
}

// Initialize other input as hidden
if (otherInput) otherInput.style.display = 'none';

// Form submission key validation
document.getElementById('fundraiserForm').addEventListener('submit', function (e) {
    // Validate category selection
    if (!hiddenCategoryInput.value) {
        e.preventDefault();
        alert('Please select a category.');
        return;
    }

    // Validate confirmation
    const updateCommitment = document.getElementById('updateCommitment');
    const confirmation = document.getElementById('confirmation');

    if (!updateCommitment.checked) {
        e.preventDefault();
        alert('Please agree to provide updates during the fundraiser.');
        return;
    }

    if (!confirmation.checked) {
        e.preventDefault();
        alert('Please confirm that the information provided is accurate.');
        return;
    }

    // Allow default submission to PHP
});

// Real-time validation feedback
const requiredInputs = document.querySelectorAll('input[required], textarea[required]');
requiredInputs.forEach(input => {
    input.addEventListener('blur', function () {
        if (!this.value.trim()) {
            this.style.borderLeft = '3px solid #ff6b6b';
        } else {
            this.style.borderLeft = '3px solid #7dd3d3';
        }
    });

    input.addEventListener('focus', function () {
        this.style.borderLeft = 'none';
    });
});