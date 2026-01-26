document.addEventListener('DOMContentLoaded', function () {
    // Check for success message from loan request submission
    if (localStorage.getItem('loanRequestSuccess') === 'true') {
        showSuccessMessage('Your loan request has been submitted successfully! Admin will review it soon.');
        localStorage.removeItem('loanRequestSuccess');
    }

    // Check for success message from offer submission
    if (localStorage.getItem('offerSuccess') === 'true') {
        showSuccessMessage('Your offer has been sent successfully! The borrower will review it.');
        localStorage.removeItem('offerSuccess');
    }

    // Check for success message from rating submission
    if (localStorage.getItem('ratingSuccess') === 'true') {
        showSuccessMessage('Your rating has been submitted successfully!');
        localStorage.removeItem('ratingSuccess');
    }

    loadLoans();
    setupFilters();
    setupSearch();
    setupSort();
    setupUserNameClick();
});

function showSuccessMessage(text) {
    const message = document.createElement('div');
    message.className = 'success-notification';
    message.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${text}</span>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer; margin-left: 10px;">&times;</button>
    `;
    document.body.appendChild(message);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (message.parentElement) {
            message.remove();
        }
    }, 5000);
}

let currentCategory = 'all';
let currentSearch = '';

async function loadLoans(category = 'all', search = '') {
    const container = document.querySelector('.loans-container');

    if (!container) {
        console.error('Loans container not found');
        return;
    }

    // Show loading state
    container.innerHTML = `
        <div class="loading" style="padding: 40px; text-align: center;">
            <i class="fas fa-spinner fa-spin" style="font-size: 48px; color: var(--primary);"></i>
            <p style="margin-top: 20px; font-size: 18px;">Loading approved loans...</p>
        </div>
    `;

    try {
        let url = 'api/api-get-approved-loans.php?';
        if (category !== 'all') url += `category=${encodeURIComponent(category)}&`;
        if (search) url += `search=${encodeURIComponent(search)}&`;

        console.log('Fetching from:', url); // Debug log

        const response = await fetch(url);

        console.log('Response status:', response.status); // Debug log
        console.log('Response ok:', response.ok); // Debug log

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();

        console.log('API Response:', data); // Debug log

        if (data.success && data.loans.length > 0) {
            container.innerHTML = '';
            data.loans.forEach(loan => {
                container.innerHTML += createLoanCard(loan);
            });

            // Scroll to specific loan if hash is present
            if (window.location.hash) {
                setTimeout(() => {
                    const target = document.querySelector(window.location.hash);
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        target.style.boxShadow = '0 0 20px rgba(112, 193, 191, 0.6)';
                        setTimeout(() => {
                            target.style.boxShadow = '';
                        }, 2000);
                    }
                }, 300);
            }
        } else {
            container.innerHTML = `
                <div class="empty-state" style="padding: 60px; text-align: center;">
                    <i class="fas fa-inbox" style="font-size: 64px; color: rgba(255,255,255,0.3); margin-bottom: 20px;"></i>
                    <h3 style="margin-bottom: 10px;">No approved loans found</h3>
                    <p style="color: rgba(255,255,255,0.7);">There are currently no approved loan requests matching your criteria.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading loans:', error);
        container.innerHTML = `
            <div class="empty-state" style="padding: 60px; text-align: center;">
                <i class="fas fa-exclamation-triangle" style="font-size: 64px; color: #dc4650; margin-bottom: 20px;"></i>
                <h3 style="margin-bottom: 10px;">Error loading loans</h3>
                <p style="color: rgba(255,255,255,0.7);">Please try refreshing the page. Error: ${error.message}</p>
            </div>
        `;
    }
}

function createLoanCard(loan) {
    const category = loan.custom_category || loan.category;
    const duration = loan.custom_duration || (loan.duration_months ? `${loan.duration_months} months` : 'N/A');

    // Truncate reason if too long
    const reason = loan.reason.length > 200 ? loan.reason.substring(0, 200) + '...' : loan.reason;

    const documents = loan.documents || 'No documents';

    // Check if current user is the borrower
    const currentUserId = localStorage.getItem('userId');
    const isOwnLoan = currentUserId && (parseInt(loan.borrower_id) === parseInt(currentUserId));
    const hasOffered = loan.user_has_offered == 1;
    const isLender = loan.user_is_lender == 1; // Has accepted offer (gave money)

    console.log('Checking loan ownership:', {
        loanId: loan.loan_id,
        borrowerId: loan.borrower_id,
        currentUserId: currentUserId,
        isOwnLoan: isOwnLoan,
        hasOffered: hasOffered,
        isLender: isLender
    });

    // Format rating display
    let ratingDisplay = '';
    if (loan.avg_rating && parseFloat(loan.avg_rating) > 0) {
        const avgRating = parseFloat(loan.avg_rating).toFixed(1);
        ratingDisplay = `<span class="user-rating">(${avgRating}★)</span>`;
    }

    return `
        <article class="loan-card" id="loan-${loan.loan_id}" data-date="${loan.created_at}" data-amount="${loan.amount}">
            <div class="card-header">
                <h3>User Name: <span class="user-name" data-user-id="${loan.borrower_id}">${loan.full_name || 'Anonymous'}</span> ${ratingDisplay}</h3>
            </div>

            <div class="loan-info">
                <p><span class="label">Category:</span> <span class="tag">${category}</span></p>
                <p><span class="label">Reason:</span> ${reason}</p>
                <p><span class="label">Amount needed:</span> ${parseFloat(loan.amount).toLocaleString()} taka</p>
                <p><span class="label">Loan duration:</span> ${duration}</p>
                <p><span class="label">Repayment option:</span> ${loan.repayment_option}</p>
                <p><span class="label">Given document:</span> ${documents}</p>
            </div>

            <div class="card-footer">
                <div class="actions">
                    ${isOwnLoan
            ? `<button class="btn-rating btn-disabled" onclick="event.preventDefault(); alert('You cannot rate your own loan request.'); return false;">Submit Rating</button>`
            : !isLender
                ? `<button class="btn-rating btn-disabled" onclick="event.preventDefault(); alert('Only lenders who provided money can submit a rating.'); return false;">Submit Rating</button>`
                : `<a href="rate-borrower.html?loan_id=${loan.loan_id}" class="btn-rating">Submit Rating</a>`
        }
                    ${isOwnLoan
            ? `<button class="btn-offer btn-disabled" onclick="event.preventDefault(); alert('You cannot make an offer on your own loan request.'); return false;">Make Offer</button>`
            : hasOffered
                ? `<button class="btn-offer btn-disabled" onclick="event.preventDefault(); alert('You have already made an offer on this loan.'); return false;">Make Offer</button>`
                : `<a href="offer-form.html?loan_id=${loan.loan_id}" class="btn-offer">Make Offer</a>`
        }
                </div>
                <div class="stats">Accepted: ${loan.accepted_count || 0} &nbsp;&nbsp; Response: ${loan.response_count || 0}</div>
            </div>
        </article>
    `;
}

function getColorFromName(name) {
    const colors = ['2563eb', 'dc3545', '28a745', 'ffc107', '17a2b8', '6f42c1', 'fd7e14', '20c997'];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
}

function setupFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            // Remove active from all buttons
            filterButtons.forEach(b => b.classList.remove('active'));
            // Add active to clicked button
            this.classList.add('active');

            // Get filter value
            currentCategory = this.getAttribute('data-filter');

            // Reload loans with filter
            loadLoans(currentCategory, currentSearch);
        });
    });
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');

    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function () {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentSearch = this.value.trim();
                loadLoans(currentCategory, currentSearch);
            }, 500); // Wait 500ms after user stops typing
        });
    }
}

function setupSort() {
    const sortSelect = document.getElementById('sortSelect');

    if (sortSelect) {
        sortSelect.addEventListener('change', function () {
            const sortValue = this.value;
            const container = document.querySelector('.loans-container');
            const cards = Array.from(container.querySelectorAll('.loan-card'));

            if (sortValue === 'recent') {
                // Sort by date (most recent first)
                cards.sort((a, b) => {
                    const dateA = new Date(a.dataset.date);
                    const dateB = new Date(b.dataset.date);
                    return dateB - dateA;
                });
            } else if (sortValue === 'oldest') {
                // Sort by date (oldest first)
                cards.sort((a, b) => {
                    const dateA = new Date(a.dataset.date);
                    const dateB = new Date(b.dataset.date);
                    return dateA - dateB;
                });
            } else if (sortValue === 'amount-high') {
                // Sort by amount (highest first)
                cards.sort((a, b) => {
                    return parseFloat(b.dataset.amount) - parseFloat(a.dataset.amount);
                });
            } else if (sortValue === 'amount-low') {
                // Sort by amount (lowest first)
                cards.sort((a, b) => {
                    return parseFloat(a.dataset.amount) - parseFloat(b.dataset.amount);
                });
            }

            // Clear and re-append sorted cards
            container.innerHTML = '';
            cards.forEach(card => container.appendChild(card));
        });
    }
}

function setupUserNameClick() {
    // Add event delegation for username clicks
    const loansContainer = document.querySelector('.loans-container');
    if (loansContainer) {
        loansContainer.addEventListener('click', function (e) {
            if (e.target.classList.contains('user-name')) {
                const userId = e.target.getAttribute('data-user-id');
                if (userId) {
                    openUserProfileOverlay(userId);
                }
            }
        });
    }
}

async function openUserProfileOverlay(userId) {
    try {
        const response = await fetch(`api/api-get-public-profile.php?userId=${userId}`);
        const data = await response.json();

        if (!data.success) {
            alert('Error loading profile: ' + data.error);
            return;
        }

        displayUserProfileOverlay(data);
    } catch (error) {
        console.error('Error loading profile:', error);
        alert('Failed to load profile. Please try again.');
    }
}

function displayUserProfileOverlay(data) {
    const user = data.user;
    const stats = data.statistics;

    // Format verification status
    let verificationBadge = '';
    if (user.verification_status === 'verified') {
        verificationBadge = '<span style="color: #22c55e;">✓ Verified</span>';
    } else if (user.verification_status === 'pending') {
        verificationBadge = '<span style="color: #f5b800;">⏳ Pending</span>';
    } else {
        verificationBadge = '<span style="color: #ef4444;">✗ Not Verified</span>';
    }

    // Create overlay HTML
    const overlayHTML = `
        <div class="profile-overlay" id="profileOverlay">
            <div class="profile-overlay-content">
                <div class="profile-overlay-header">
                    <h2>${user.full_name || 'User Profile'}</h2>
                    <button class="profile-close-btn" onclick="closeUserProfileOverlay()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="profile-overlay-body">
                    <div class="profile-info-grid">
                        <div class="profile-info-item">
                            <span class="profile-label">Username:</span>
                            <span class="profile-value">${user.username || 'N/A'}</span>
                        </div>
                        <div class="profile-info-item">
                            <span class="profile-label">Student ID:</span>
                            <span class="profile-value">${user.student_id || 'N/A'}</span>
                        </div>
                        <div class="profile-info-item">
                            <span class="profile-label">University:</span>
                            <span class="profile-value">${user.university || 'N/A'}</span>
                        </div>
                        <div class="profile-info-item">
                            <span class="profile-label">Verification:</span>
                            <span class="profile-value">${verificationBadge}</span>
                        </div>
                        <div class="profile-info-item">
                            <span class="profile-label">Role:</span>
                            <span class="profile-value">${user.role || 'N/A'}</span>
                        </div>
                        <div class="profile-info-item">
                            <span class="profile-label">Rating:</span>
                            <span class="profile-value">${user.avg_rating ? `${user.avg_rating}★ (${user.rating_count} ratings)` : 'No ratings yet'}</span>
                        </div>
                    </div>

                    <div class="profile-stats-grid">
                        <div class="profile-stat-box">
                            <div class="stat-label">Total Funds Collected</div>
                            <div class="stat-amount">৳${stats.total_funding_received.toLocaleString()}</div>
                        </div>
                        <div class="profile-stat-box">
                            <div class="stat-label">Total Loans Collected</div>
                            <div class="stat-amount">৳${stats.total_loans_received.toLocaleString()}</div>
                        </div>
                    </div>

                    <div class="profile-section">
                        <h3>Loan Requests</h3>
                        <div class="stats-row">
                            <span class="stat-item">Total: <strong>${stats.total_loans}</strong></span>
                            <span class="stat-item stat-approved">Approved: <strong>${stats.approved_loans}</strong></span>
                            <span class="stat-item stat-pending">Pending: <strong>${stats.pending_loans}</strong></span>
                            <span class="stat-item stat-rejected">Rejected: <strong>${stats.rejected_loans}</strong></span>
                        </div>
                    </div>

                    <div class="profile-section">
                        <h3>Funding Posts</h3>
                        <div class="stats-row">
                            <span class="stat-item">Total: <strong>${stats.total_funding}</strong></span>
                            <span class="stat-item stat-approved">Approved: <strong>${stats.approved_funding}</strong></span>
                            <span class="stat-item stat-pending">Pending: <strong>${stats.pending_funding}</strong></span>
                            <span class="stat-item stat-rejected">Rejected: <strong>${stats.rejected_funding}</strong></span>
                        </div>
                    </div>

                    <div class="profile-section">
                        <h3>Loan Offers Made (as Lender)</h3>
                        <div class="stats-row">
                            <span class="stat-item">Total: <strong>${stats.total_offers}</strong></span>
                            <span class="stat-item stat-approved">Accepted: <strong>${stats.accepted_offers}</strong></span>
                            <span class="stat-item stat-pending">Pending: <strong>${stats.pending_offers}</strong></span>
                            <span class="stat-item stat-rejected">Rejected: <strong>${stats.rejected_offers}</strong></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Add overlay to body
    document.body.insertAdjacentHTML('beforeend', overlayHTML);

    // Add click outside to close
    const overlay = document.getElementById('profileOverlay');
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
            closeUserProfileOverlay();
        }
    });
}

function closeUserProfileOverlay() {
    const overlay = document.getElementById('profileOverlay');
    if (overlay) {
        overlay.remove();
    }
}
