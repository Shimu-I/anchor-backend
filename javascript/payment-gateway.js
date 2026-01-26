// javascript/payment-gateway.js
document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    // UI Elements
    const amountDisplay = document.getElementById('amountDisplay');
    const payBtnAmount = document.getElementById('payBtnAmount');
    const loadingState = document.getElementById('loadingState');
    const paymentOverlay = document.getElementById('paymentOverlay');
    const fundraiserInfo = document.getElementById('fundraiserInfo');

    // Hidden Fields
    const hiddenAmount = document.getElementById('hiddenAmount');
    const hiddenType = document.getElementById('hiddenType');
    const hiddenId = document.getElementById('hiddenId');
    const hiddenMethod = document.getElementById('hiddenMethod');
    const mobileProvider = document.getElementById('mobileProvider');

    // Tabs
    const tabs = document.querySelectorAll('.payment-tabs .tab');
    const tabContents = document.querySelectorAll('.tab-content');

    // 1. Process URL Parameters
    const urlParams = new URLSearchParams(window.location.search);
    const amount = urlParams.get('amount') || '0.00';
    const type = urlParams.get('type') || '';
    const id = urlParams.get('id') || '';

    // Populate Hidden Fields
    if (hiddenAmount) hiddenAmount.value = amount;
    if (hiddenType) hiddenType.value = type;
    if (hiddenId) hiddenId.value = id;

    // Load Fundraiser Details
    if (type === 'funding' && id) {
        loadFundraiserDetails(id, amount);
    } else {
        showError('Invalid payment request');
    }

    // Function to load fundraiser details
    async function loadFundraiserDetails(postId, suggestedAmount) {
        try {
            const response = await fetch(`api-get-funding-details.php?id=${postId}`);
            const data = await response.json();

            if (data.success && data.post) {
                displayFundraiserInfo(data.post, suggestedAmount);
                loadingState.style.display = 'none';
                paymentOverlay.style.display = 'flex';
            } else {
                showError(data.error || 'Fundraiser not found');
            }
        } catch (error) {
            console.error('Error loading fundraiser:', error);
            showError('Error loading fundraiser details');
        }
    }

    // Display fundraiser information
    function displayFundraiserInfo(post, suggestedAmount) {
        const html = `
            <span class="fundraiser-category">${post.display_category}</span>
            <h3>Donating to:</h3>
            <h2>${post.title}</h2>
            <div class="fundraiser-progress">
                <div class="fundraiser-progress-bar">
                    <div class="fundraiser-progress-fill" style="width: ${post.progress_percentage}%;"></div>
                </div>
                <div class="fundraiser-progress-text">
                    <span class="raised">৳${parseFloat(post.amount_raised).toLocaleString('en-BD')} raised</span>
                    <span>Goal: ৳${parseFloat(post.amount_needed).toLocaleString('en-BD')}</span>
                </div>
            </div>
            <div class="fundraiser-info-details">
                <div class="info-item">
                    <span class="info-label">Organizer</span>
                    <span class="info-value">${post.full_name}</span>
                </div>
                ${post.location ? `
                    <div class="info-item">
                        <span class="info-label">Location</span>
                        <span class="info-value">${post.location}</span>
                    </div>
                ` : ''}
            </div>
        `;

        fundraiserInfo.innerHTML = html;

        // Set amounts
        if (amountDisplay) {
            amountDisplay.value = parseFloat(suggestedAmount).toFixed(2);

            // Update on input
            amountDisplay.addEventListener('input', function () {
                const newAmount = parseFloat(this.value) || 0;
                if (payBtnAmount) payBtnAmount.textContent = newAmount.toFixed(2);
                if (hiddenAmount) hiddenAmount.value = newAmount.toFixed(2);
            });
        }
        if (payBtnAmount) payBtnAmount.textContent = parseFloat(suggestedAmount).toFixed(2);
    }

    // Show error
    function showError(message) {
        loadingState.innerHTML = `
            <div style="text-align: center;">
                <i class="fas fa-exclamation-circle" style="font-size: 48px; color: #ff6b6b; margin-bottom: 20px;"></i>
                <p style="font-size: 18px; margin-bottom: 10px;">Error</p>
                <p style="opacity: 0.8;">${message}</p>
                <a href="funding.html" style="display: inline-block; margin-top: 20px; padding: 10px 30px; background: #00bfa5; color: white; text-decoration: none; border-radius: 25px; font-weight: 600;">
                    Back to Fundraisers
                </a>
            </div>
        `;
    }

    // 2. Tab Switching Logic
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Remove active class from all contents
            tabContents.forEach(c => c.classList.remove('active'));

            // Activate clicked tab
            tab.classList.add('active');

            // Show corresponding content
            const targetId = tab.getAttribute('data-tab') === 'cards' ? 'cardsTab' : 'mobileTab';
            document.getElementById(targetId).classList.add('active');

            // Update Payment Method
            if (tab.getAttribute('data-tab') === 'cards') {
                hiddenMethod.value = 'card';
                mobileProvider.required = false;
            } else {
                hiddenMethod.value = 'mobile';
                mobileProvider.required = true;
            }
        });
    });

    // 3. Mobile Banking Selection
    const mobileOptions = document.querySelectorAll('.mobile-banking-option');
    const selectedText = document.getElementById('selectedMobileText');

    mobileOptions.forEach(option => {
        option.addEventListener('click', function () {
            // Remove selection from others
            mobileOptions.forEach(opt => opt.style.border = '1px solid #ddd');

            // Select this one
            this.style.border = '2px solid #27ae60';

            const provider = this.getAttribute('data-method');
            mobileProvider.value = provider;
            selectedText.textContent = "Selected: " + provider.toUpperCase();
        });
    });

    // 4. Form Validation before Submit
    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm) {
        paymentForm.addEventListener('submit', function (e) {
            const currentAmount = parseFloat(amountDisplay.value) || 0;

            // Validate amount
            if (currentAmount <= 0) {
                e.preventDefault();
                alert('Please enter a valid donation amount greater than 0');
                return false;
            }

            // Check if type and id are set
            if (!hiddenType.value || !hiddenId.value) {
                e.preventDefault();
                alert('Invalid payment request. Please try again from the fundraiser page.');
                return false;
            }

            // If mobile banking, check if provider is selected
            if (hiddenMethod.value === 'mobile' && !mobileProvider.value) {
                e.preventDefault();
                alert('Please select a mobile banking provider');
                return false;
            }

            // If card, validate basic card info
            if (hiddenMethod.value === 'card') {
                const cardNumber = document.querySelector('input[name="card_number"]').value;
                const cardExpiry = document.querySelector('input[name="card_expiry"]').value;
                const cardCvc = document.querySelector('input[name="card_cvc"]').value;
                const cardHolder = document.querySelector('input[name="card_holder"]').value;

                if (!cardNumber || cardNumber.length < 13) {
                    e.preventDefault();
                    alert('Please enter a valid card number');
                    return false;
                }

                if (!cardExpiry || cardExpiry.length !== 5) {
                    e.preventDefault();
                    alert('Please enter card expiry in MM/YY format');
                    return false;
                }

                if (!cardCvc || cardCvc.length < 3) {
                    e.preventDefault();
                    alert('Please enter a valid CVC/CVV');
                    return false;
                }

                if (!cardHolder || cardHolder.trim() === '') {
                    e.preventDefault();
                    alert('Please enter card holder name');
                    return false;
                }
            }

            // If all validations pass, update hidden amount one more time
            hiddenAmount.value = currentAmount.toFixed(2);

            // Show processing message
            const submitBtn = document.getElementById('confirmPayBtn');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = 'Processing...';
            }
        });
    }

});