// Payment Modal for Funding Page Overlay
let currentFundraiserData = null;

// Show donation amount input dialog first
function showDonationAmountDialog(fundraiserId, fundraiserTitle, category, totalAmount, progressPercentage, amountRaised, organizerName, location) {
    const dialogHTML = `
        <div class="donation-amount-dialog-overlay" id="donationAmountDialog">
            <div class="donation-amount-dialog">
                <button class="dialog-close-btn" onclick="closeDonationAmountDialog()">×</button>
                <div class="dialog-icon">
                    <i class="fas fa-hand-holding-heart" style="font-size: 48px; color: #00bfa5;"></i>
                </div>
                <h2>Support This Cause</h2>
                <p class="dialog-message">Every contribution makes a difference! Please enter the amount you would like to donate to <strong>${fundraiserTitle}</strong>.</p>
                
                <div class="fundraiser-mini-info">
                    <div class="mini-progress-bar">
                        <div class="mini-progress-fill" style="width: ${progressPercentage}%;"></div>
                    </div>
                    <div class="mini-progress-text">
                        <span class="raised">৳${parseFloat(amountRaised).toLocaleString('en-BD')} raised</span>
                        <span class="goal">of ৳${parseFloat(totalAmount).toLocaleString('en-BD')}</span>
                    </div>
                </div>
                
                <div class="amount-input-section">
                    <label for="userDonationAmount">Your Donation Amount</label>
                    <div class="amount-input-wrapper">
                        <span class="currency-symbol">৳</span>
                        <input type="number" id="userDonationAmount" placeholder="Enter amount" min="1" step="0.01" autofocus>
                    </div>
                    <p class="amount-hint">Donate any amount that fits your budget</p>
                </div>
                
                <div class="quick-amounts">
                    <button class="quick-amount-btn" onclick="setQuickAmount(100)">৳100</button>
                    <button class="quick-amount-btn" onclick="setQuickAmount(500)">৳500</button>
                    <button class="quick-amount-btn" onclick="setQuickAmount(1000)">৳1,000</button>
                    <button class="quick-amount-btn" onclick="setQuickAmount(5000)">৳5,000</button>
                </div>
                
                <div class="dialog-actions">
                    <button class="dialog-btn-secondary" onclick="closeDonationAmountDialog()">Maybe Later</button>
                    <button class="dialog-btn-primary" onclick="proceedToPayment('${fundraiserId}', '${fundraiserTitle.replace(/'/g, "\\'")}', '${category}', '${totalAmount}', '${progressPercentage}', '${amountRaised}', '${organizerName.replace(/'/g, "\\'")}', '${location}')">Continue to Payment</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', dialogHTML);
    document.body.style.overflow = 'hidden';

    // Add enter key listener
    document.getElementById('userDonationAmount').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            proceedToPayment(fundraiserId, fundraiserTitle, category, totalAmount, progressPercentage, amountRaised, organizerName, location);
        }
    });
}

// Set quick amount
function setQuickAmount(amount) {
    document.getElementById('userDonationAmount').value = amount;
}

// Close donation amount dialog
function closeDonationAmountDialog() {
    const dialog = document.getElementById('donationAmountDialog');
    if (dialog) {
        dialog.remove();
        document.body.style.overflow = '';
    }
}

// Proceed to payment after amount validation
function proceedToPayment(fundraiserId, fundraiserTitle, category, totalAmount, progressPercentage, amountRaised, organizerName, location) {
    const amountInput = document.getElementById('userDonationAmount');
    const amount = parseFloat(amountInput.value);

    if (!amount || amount <= 0) {
        // Show polite notification
        showNotification('Please enter the donation amount you would like to contribute. Every amount helps!', 'info');
        amountInput.focus();
        return;
    }

    // Close dialog and open payment modal
    closeDonationAmountDialog();
    openPaymentModal(fundraiserId, fundraiserTitle, category, amount, progressPercentage, amountRaised, organizerName, location);
}

// Show notification
function showNotification(message, type = 'info') {
    const iconMap = {
        'info': 'fa-info-circle',
        'success': 'fa-check-circle',
        'error': 'fa-exclamation-circle'
    };

    const colorMap = {
        'info': '#00bfa5',
        'success': '#00d4b8',
        'error': '#ff6b6b'
    };

    const notification = document.createElement('div');
    notification.className = 'custom-notification';
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        gap: 12px;
        max-width: 400px;
        z-index: 99999;
        animation: slideInRight 0.3s ease;
        border-left: 4px solid ${colorMap[type]};
    `;

    notification.innerHTML = `
        <i class="fas ${iconMap[type]}" style="color: ${colorMap[type]}; font-size: 24px;"></i>
        <span style="color: #333; font-size: 14px; flex: 1;">${message}</span>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; color: #999; cursor: pointer; font-size: 20px; padding: 0; width: 24px; height: 24px;">×</button>
    `;

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Open payment modal
function openPaymentModal(fundraiserId, fundraiserTitle, category, amount, progressPercentage, amountRaised, organizerName, location) {
    currentFundraiserData = {
        id: fundraiserId,
        title: fundraiserTitle,
        category: category,
        amount: amount,
        progressPercentage: progressPercentage,
        amountRaised: amountRaised,
        organizerName: organizerName,
        location: location
    };

    const modalHTML = `
        <div class="payment-overlay-modal" id="paymentModalOverlay">
            <div class="payment-modal-container">
                <!-- Close Button -->
                <button class="payment-modal-close" onclick="closePaymentModal()">×</button>
                
                <!-- Left Side: Fundraiser Info -->
                <div class="payment-left-panel">
                    <span class="payment-category-badge">${category}</span>
                    <h3>Donating to:</h3>
                    <h2>${fundraiserTitle}</h2>
                    <div class="payment-progress">
                        <div class="payment-progress-bar">
                            <div class="payment-progress-fill" style="width: ${progressPercentage}%;"></div>
                        </div>
                        <div class="payment-progress-text">
                            <span class="raised">৳${parseFloat(amountRaised).toLocaleString('en-BD')} raised</span>
                            <span>Goal: ৳${parseFloat(amount).toLocaleString('en-BD')}</span>
                        </div>
                    </div>
                    <div class="payment-organizer-info">
                        <div>
                            <span class="label">Organizer</span>
                            <span class="value">${organizerName}</span>
                        </div>
                        ${location ? `
                        <div>
                            <span class="label">Location</span>
                            <span class="value">${location}</span>
                        </div>
                        ` : ''}
                    </div>
                    
                    <!-- Donation Amount Input -->
                    <div class="left-amount-section">
                        <label>Your Donation Amount</label>
                        <div class="amount-input-wrapper">
                            <span class="currency-symbol">৳</span>
                            <input type="number" min="1" step="0.01" value="" id="leftAmountInput" class="left-amount-input" placeholder="Enter amount">
                        </div>
                        <div class="quick-amounts">
                            <button type="button" class="quick-amount-btn" data-amount="100">৳100</button>
                            <button type="button" class="quick-amount-btn" data-amount="500">৳500</button>
                            <button type="button" class="quick-amount-btn" data-amount="1000">৳1000</button>
                            <button type="button" class="quick-amount-btn" data-amount="5000">৳5000</button>
                        </div>
                        <p class="amount-hint">Every amount helps make a difference!</p>
                    </div>
                </div>
                
                <!-- Right Side: Payment Form -->
                <div class="payment-right-panel">
                    <form id="inlinePaymentForm" action="php/payment-gateway.php" method="POST" autocomplete="off">
                        <input type="hidden" name="submit_payment" value="1">
                        <input type="hidden" name="ref_amount" id="modalHiddenAmount" value="${amount}">
                        <input type="hidden" name="ref_type" value="funding">
                        <input type="hidden" name="ref_id" value="${fundraiserId}">
                        <input type="hidden" name="payment_method" id="modalHiddenMethod" value="card">
                        <input type="hidden" name="mobile_provider" id="modalMobileProvider">
                        
                        <h2>Complete Your Donation</h2>
                        
                        <h3>Payment Method</h3>
                        
                        <div class="payment-method-tabs">
                            <button type="button" class="payment-tab active" data-method="card">Cards</button>
                            <button type="button" class="payment-tab" data-method="mobile">Mobile Banking</button>
                        </div>
                        
                        <div class="payment-tab-content" id="cardContent">
                            <div class="card-logos">
                                <img src="images/payment-gateway/visa.jpg" alt="Visa" style="height: 30px;">
                                <img src="images/payment-gateway/mastercard.jpg" alt="Mastercard" style="height: 30px;">
                                <img src="images/payment-gateway/americanex.jpg" alt="Amex" style="height: 30px;">
                            </div>
                            <input type="text" name="card_number" placeholder="Card Number" maxlength="19" class="payment-input" autocomplete="off">
                            <div class="payment-input-row">
                                <input type="text" name="card_expiry" placeholder="MM/YY" maxlength="5" class="payment-input" autocomplete="off">
                                <input type="text" name="card_cvc" placeholder="CVC/CVV" maxlength="4" class="payment-input" autocomplete="off">
                            </div>
                            <input type="text" name="card_holder" placeholder="Card Holder Name" class="payment-input" autocomplete="off">
                            <div class="payment-checkbox">
                                <input type="checkbox" id="modalTerms">
                                <label for="modalTerms">I agree to the Terms of Service</label>
                            </div>
                        </div>
                        
                        <div class="payment-tab-content" id="mobileContent" style="display: none;">
                            <div class="mobile-options">
                                <div class="mobile-option" data-provider="nagad">
                                    <img src="images/payment-gateway/nogod.jpg" alt="Nagad">
                                </div>
                                <div class="mobile-option" data-provider="bkash">
                                    <img src="images/payment-gateway/bkash.jpg" alt="bKash">
                                </div>
                                <div class="mobile-option" data-provider="rocket">
                                    <img src="images/payment-gateway/rocket.jpg" alt="Rocket">
                                </div>
                                <div class="mobile-option" data-provider="dbbl">
                                    <img src="images/payment-gateway/dbbl.jpg" alt="DBBL">
                                </div>
                                <div class="mobile-option" data-provider="upay">
                                    <img src="images/payment-gateway/upai.jpg" alt="Upay">
                                </div>
                            </div>
                            <p id="selectedProvider" style="text-align: center; color: #00bfa5; font-weight: 600; margin: 16px 0 8px 0; font-size: 14px;"></p>
                        </div>
                        
                        <button type="submit" name="submit_payment" class="payment-submit-btn">
                            Pay <span id="modalPayAmount">0.00</span> ৳
                        </button>
                    </form>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.style.overflow = 'hidden';

    initializePaymentModal();
}

// Close payment modal
function closePaymentModal() {
    const modal = document.getElementById('paymentModalOverlay');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
    }
}

// Initialize modal interactions
function initializePaymentModal() {
    const leftAmountInput = document.getElementById('leftAmountInput');
    const payAmountSpan = document.getElementById('modalPayAmount');
    const hiddenAmount = document.getElementById('modalHiddenAmount');
    const hiddenMethod = document.getElementById('modalHiddenMethod');
    const mobileProvider = document.getElementById('modalMobileProvider');

    // Set initial pay amount to 0 or show placeholder
    payAmountSpan.textContent = '0.00';

    // Quick amount buttons
    document.querySelectorAll('.quick-amount-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const amount = this.getAttribute('data-amount');
            leftAmountInput.value = amount;
            payAmountSpan.textContent = parseFloat(amount).toFixed(2);
            hiddenAmount.value = amount;
        });
    });

    // Amount update from left panel
    if (leftAmountInput) {
        const updateAmount = function () {
            const val = parseFloat(leftAmountInput.value) || 0;
            payAmountSpan.textContent = val.toFixed(2);
            hiddenAmount.value = val.toFixed(2);
        };

        leftAmountInput.addEventListener('input', updateAmount);
        leftAmountInput.addEventListener('keyup', updateAmount);
    }

    // Tab switching - fix resizing issue
    const cardContent = document.getElementById('cardContent');
    const mobileContent = document.getElementById('mobileContent');

    document.querySelectorAll('.payment-tab').forEach(tab => {
        tab.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelectorAll('.payment-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            const method = this.getAttribute('data-method');
            hiddenMethod.value = method;

            if (method === 'card') {
                cardContent.style.display = 'block';
                mobileContent.style.display = 'none';
            } else {
                cardContent.style.display = 'none';
                mobileContent.style.display = 'block';
            }
        });
    });

    // Mobile banking selection
    document.querySelectorAll('.mobile-option').forEach(option => {
        option.addEventListener('click', function () {
            document.querySelectorAll('.mobile-option').forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');

            const provider = this.getAttribute('data-provider');
            mobileProvider.value = provider;
            document.getElementById('selectedProvider').textContent = `Selected: ${provider.toUpperCase()}`;
        });
    });

    // Form validation and confirmation
    const formElement = document.getElementById('inlinePaymentForm');
    if (!formElement) {
        return;
    }

    formElement.addEventListener('submit', function (e) {
        e.preventDefault();

        const amount = parseFloat(leftAmountInput.value) || 0;

        if (amount <= 0) {
            showNotification('Please enter a donation amount in the left panel', 'error');
            if (leftAmountInput) leftAmountInput.focus();
            return false;
        }

        if (hiddenMethod.value === 'mobile' && !mobileProvider.value) {
            showNotification('Please select a mobile banking provider', 'error');
            return false;
        }

        if (hiddenMethod.value === 'card') {
            const termsCheckbox = document.getElementById('modalTerms');

            if (!termsCheckbox.checked) {
                showNotification('Please agree to the Terms of Service', 'error');
                return false;
            }
        }

        // Show confirmation dialog
        showPaymentConfirmation(this, amount, currentFundraiserData);
    });

    // Close on backdrop click
    document.getElementById('paymentModalOverlay').addEventListener('click', function (e) {
        if (e.target === this) {
            closePaymentModal();
        }
    });
}

// Show payment confirmation dialog
function showPaymentConfirmation(form, amount, fundraiserData) {
    const confirmHTML = `
        <div class="confirmation-dialog-overlay" id="confirmationDialog">
            <div class="confirmation-dialog">
                <div class="confirmation-icon">
                    <i class="fas fa-shield-alt" style="font-size: 56px; color: #00bfa5;"></i>
                </div>
                <h2>Confirm Your Donation</h2>
                <p class="confirmation-message">You are about to donate <strong style="color: #00bfa5; font-size: 20px;">৳${parseFloat(amount).toLocaleString('en-BD', { minimumFractionDigits: 2 })}</strong> to support <strong>${fundraiserData.title}</strong>.</p>
                
                <div class="confirmation-details">
                    <div class="detail-row">
                        <span class="detail-label">Fundraiser:</span>
                        <span class="detail-value">${fundraiserData.title}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Organizer:</span>
                        <span class="detail-value">${fundraiserData.organizerName}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Your Donation:</span>
                        <span class="detail-value" style="color: #00bfa5; font-weight: 700;">৳${parseFloat(amount).toLocaleString('en-BD', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
                
                <p class="confirmation-note">
                    <i class="fas fa-info-circle" style="color: #00bfa5;"></i>
                    Your contribution will help make a real difference. This transaction is secure and your payment details are protected.
                </p>
                
                <div class="confirmation-actions">
                    <button class="confirm-btn-cancel" onclick="closeConfirmationDialog()">
                        <i class="fas fa-times"></i> Cancel Payment
                    </button>
                    <button class="confirm-btn-proceed" onclick="confirmAndSubmitPayment()">
                        <i class="fas fa-check-circle"></i> Yes, Proceed
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', confirmHTML);

    // Store form reference for submission
    window.pendingPaymentForm = form;
}

// Close confirmation dialog
function closeConfirmationDialog() {
    const dialog = document.getElementById('confirmationDialog');
    if (dialog) {
        dialog.remove();
    }
    window.pendingPaymentForm = null;
}

// Confirm and submit payment
function confirmAndSubmitPayment() {
    console.log('confirmAndSubmitPayment called');
    console.log('Pending form:', window.pendingPaymentForm);

    if (window.pendingPaymentForm) {
        // Store reference before closing dialog
        const formToSubmit = window.pendingPaymentForm;

        console.log('Form to submit:', formToSubmit);

        // Close dialog (this will set pendingPaymentForm to null)
        closeConfirmationDialog();

        // Submit using stored reference
        console.log('Submitting form...');
        formToSubmit.submit();
    } else {
        console.error('No pending payment form found!');
        alert('Error: Form not found. Please try again.');
    }
}
