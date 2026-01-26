// Get user ID from URL parameter
const urlParams = new URLSearchParams(window.location.search);
const viewUserId = urlParams.get('userId');

if (!viewUserId) {
    window.location.href = 'loan.html';
}

document.addEventListener('DOMContentLoaded', function () {
    loadPublicProfile();
});

async function loadPublicProfile() {
    try {
        const response = await fetch(`api/api-get-public-profile.php?userId=${viewUserId}`);
        const data = await response.json();

        if (!data.success) {
            alert('Error loading profile: ' + data.error);
            window.location.href = 'loan.html';
            return;
        }

        displayPublicProfile(data);
    } catch (error) {
        console.error('Error loading profile:', error);
        alert('Failed to load profile. Please try again.');
    }
}

function displayPublicProfile(data) {
    const user = data.user;
    const stats = data.statistics;

    // Display user information
    document.getElementById('userName').textContent = user.full_name || 'N/A';
    document.getElementById('userUsername').innerHTML = `<strong>Username:</strong> ${user.username || 'N/A'}`;
    document.getElementById('userUniversity').innerHTML = `<strong>University:</strong> ${user.university || 'N/A'}`;
    document.getElementById('userRole').innerHTML = `<strong>Role:</strong> ${user.role || 'N/A'}`;

    // Display rating
    if (user.avg_rating) {
        document.getElementById('userRating').innerHTML = `<strong>Rating:</strong> ${user.avg_rating}★ (${user.rating_count} ratings)`;
    } else {
        document.getElementById('userRating').innerHTML = `<strong>Rating:</strong> No ratings yet`;
    }

    // Display statistics
    document.getElementById('totalFundsCollected').textContent = `৳${stats.total_funding_received.toLocaleString()}`;
    document.getElementById('totalLoansCollected').textContent = `৳${stats.total_loans_received.toLocaleString()}`;

    // Display loans
    displayLoans(data.loans);

    // Display funding posts
    displayFunding(data.funding);

    // Display offers
    displayOffers(data.offers);
}

function displayLoans(loans) {
    const container = document.getElementById('loansContainer');
    const countElement = document.getElementById('loanCount');

    countElement.textContent = loans.length;

    if (loans.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px; color: #b0c4c4;">No loan requests yet</p>';
        return;
    }

    container.innerHTML = loans.map(loan => `
        <div class="profile-card">
            <div class="card-header-section">
                <span class="category-badge">${loan.custom_category || loan.category}</span>
                <span class="status-badge status-${loan.status}">${loan.status}</span>
            </div>
            <div class="card-body">
                <div class="card-row">
                    <span class="card-label">Amount Needed:</span>
                    <span class="card-value">৳${parseFloat(loan.amount).toLocaleString()}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Interest Rate:</span>
                    <span class="card-value">${loan.interest_rate}%</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Duration:</span>
                    <span class="card-value">${loan.duration_months} months</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Reason:</span>
                    <span class="card-value">${loan.reason || 'N/A'}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Posted:</span>
                    <span class="card-value">${new Date(loan.created_at).toLocaleDateString()}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function displayFunding(funding) {
    const container = document.getElementById('fundingContainer');
    const countElement = document.getElementById('fundingCount');

    countElement.textContent = funding.length;

    if (funding.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px; color: #b0c4c4;">No funding posts yet</p>';
        return;
    }

    container.innerHTML = funding.map(post => {
        const progress = (parseFloat(post.amount_raised) / parseFloat(post.amount_needed)) * 100;

        return `
            <div class="profile-card">
                <div class="card-header-section">
                    <span class="category-badge">${post.custom_category || post.category}</span>
                    <span class="status-badge status-${post.status}">${post.status}</span>
                </div>
                <div class="card-body">
                    <h4 class="card-title">${post.title}</h4>
                    <div class="card-row">
                        <span class="card-label">Goal:</span>
                        <span class="card-value">৳${parseFloat(post.amount_needed).toLocaleString()}</span>
                    </div>
                    <div class="card-row">
                        <span class="card-label">Raised:</span>
                        <span class="card-value">৳${parseFloat(post.amount_raised).toLocaleString()}</span>
                    </div>
                    <div class="card-row">
                        <span class="card-label">Progress:</span>
                        <span class="card-value">${progress.toFixed(1)}%</span>
                    </div>
                    <div class="card-row">
                        <span class="card-label">Contributors:</span>
                        <span class="card-value">${post.contributor_count}</span>
                    </div>
                    <div class="card-row">
                        <span class="card-label">Posted:</span>
                        <span class="card-value">${new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function displayOffers(offers) {
    const container = document.getElementById('offersContainer');
    const countElement = document.getElementById('offersCount');

    countElement.textContent = offers.length;

    if (offers.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px; color: #b0c4c4;">No loan offers made yet</p>';
        return;
    }

    container.innerHTML = offers.map(offer => `
        <div class="profile-card">
            <div class="card-header-section">
                <span class="category-badge">${offer.custom_category || offer.category}</span>
                <span class="status-badge status-${offer.status}">${offer.status}</span>
            </div>
            <div class="card-body">
                <div class="card-row">
                    <span class="card-label">Borrower:</span>
                    <span class="card-value">${offer.borrower_name}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Offer Amount:</span>
                    <span class="card-value">৳${parseFloat(offer.amount).toLocaleString()}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Interest Rate:</span>
                    <span class="card-value">${offer.interest_rate}%</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Message:</span>
                    <span class="card-value">${offer.offer_message || 'N/A'}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Offered:</span>
                    <span class="card-value">${new Date(offer.created_at).toLocaleDateString()}</span>
                </div>
            </div>
        </div>
    `).join('');
}
