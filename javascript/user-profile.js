document.addEventListener('DOMContentLoaded', function () {
    loadUserProfile();
    setupEventListeners();
});

let userData = null;

async function loadUserProfile() {
    try {
        const response = await fetch('api/api-get-user-profile.php');
        const data = await response.json();

        if (data.success) {
            userData = data;
            displayUserProfile(data);
            displayLoans(data.loans);
            displayFundingPosts(data.funding_posts);
            displayMyOffers(data.my_offers);
        } else {
            alert('Error loading profile: ' + data.error);
            if (data.error === 'Not logged in') {
                window.location = 'login.html';
            }
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to load profile data');
    }
}

function displayUserProfile(data) {
    const { user, rating, stats } = data;

    // Update profile header with N/A fallbacks and formatted labels
    document.getElementById('userName').textContent = user.full_name || 'User Profile';
    document.getElementById('userId').innerHTML = `<strong>User ID:</strong> ${user.user_id || 'N/A'}`;
    document.getElementById('userEmail').innerHTML = `<strong>Email:</strong> ${user.email || 'N/A'}`;
    document.getElementById('userUsername').innerHTML = `<strong>Username:</strong> ${user.username || 'N/A'}`;
    document.getElementById('userStudentId').innerHTML = `<strong>Student ID:</strong> ${user.student_id || 'N/A'}`;
    document.getElementById('userUniversity').innerHTML = `<strong>University:</strong> ${user.university || 'N/A'}`;

    const statusText = user.verification_status ? user.verification_status.charAt(0).toUpperCase() + user.verification_status.slice(1) : 'N/A';
    const statusColor = user.verification_status === 'verified' ? '#70C1BF' : user.verification_status === 'rejected' ? '#dc4650' : '#f5b800';
    document.getElementById('userStatus').innerHTML = `<strong>Verification:</strong> <span style="color: ${statusColor}">${statusText}</span>`;

    document.getElementById('userRole').innerHTML = `<strong>Role:</strong> ${user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'N/A'}`;

    // Display rating
    const ratingText = rating.avg_rating > 0
        ? `${rating.avg_rating}★ from ${rating.rating_count} reviews`
        : 'No ratings yet';
    document.getElementById('userRating').innerHTML = `<strong>Your Rating:</strong> ${ratingText}`;

    // Display stats
    document.getElementById('totalFundsCollected').textContent =
        `৳${parseFloat(stats.total_funding_received || 0).toLocaleString()}`;
    document.getElementById('totalLoansCollected').textContent =
        `৳${parseFloat(stats.total_loans_received || 0).toLocaleString()}`;

    // Update edit form
    document.getElementById('editFullName').value = user.full_name || '';
    document.getElementById('editEmail').value = user.email || '';
    document.getElementById('editStudentId').value = user.student_id || '';
    document.getElementById('editUniversity').value = user.university || '';

    // Update counts in section titles
    document.getElementById('loanCount').textContent = stats.loans.total_loans;
    document.getElementById('fundingCount').textContent = stats.funding.total_funding;
    document.getElementById('offersCount').textContent = stats.offers_made;
}

function displayLoans(loans) {
    const container = document.getElementById('loansContainer');

    if (!loans || loans.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px; color: rgba(255,255,255,0.6);">No loan requests yet</p>';
        return;
    }

    container.innerHTML = loans.map(loan => {
        const category = loan.custom_category || loan.category;
        const duration = loan.custom_duration || (loan.duration_months ? `${loan.duration_months} months` : 'N/A');
        const date = new Date(loan.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

        return `
            <div class="card">
                <div class="card-row">
                    <span class="card-label">Category</span>
                    <span class="badge badge-${category.toLowerCase().replace(' ', '-')}">${category}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Amount needed:</span>
                    <span class="card-value">${parseFloat(loan.amount).toLocaleString()} taka</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Duration:</span>
                    <span class="card-value">${duration}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Date:</span>
                    <span class="card-value">${date}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Status</span>
                    <span class="badge badge-${loan.status}">${loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}</span>
                </div>
                ${loan.status === 'approved' ? `
                <div class="card-row">
                    <span class="card-label">Offers received</span>
                    <a href="offer-received.html?loan_id=${loan.loan_id}" class="btn-view-small">${loan.offer_count} Offers</a>
                </div>` : ''}
                <a href="loan.html#loan-${loan.loan_id}" class="btn-view-details">View Details</a>
            </div>
        `;
    }).join('');
}

function displayFundingPosts(posts) {
    const container = document.getElementById('fundingContainer');

    if (!posts || posts.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px; color: rgba(255,255,255,0.6);">No funding posts yet</p>';
        return;
    }

    container.innerHTML = posts.map(post => {
        const category = post.custom_category || post.category;
        const date = new Date(post.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        const progress = post.current_amount && post.amount_needed
            ? Math.round((post.current_amount / post.amount_needed) * 100)
            : 0;

        return `
            <div class="card">
                <div class="card-row">
                    <span class="card-label">Category</span>
                    <span class="badge badge-${category.toLowerCase().replace(' ', '-')}">${category}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Target Amount:</span>
                    <span class="card-value">${parseFloat(post.amount_needed).toLocaleString()} taka</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Raised:</span>
                    <span class="card-value">${parseFloat(post.current_amount || 0).toLocaleString()} taka (${progress}%)</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Date:</span>
                    <span class="card-value">${date}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Status</span>
                    <span class="badge badge-${post.status}">${post.status.charAt(0).toUpperCase() + post.status.slice(1)}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Contributors:</span>
                    <span class="card-value">${post.contribution_count}</span>
                </div>
                <a href="funding-view.html?post_id=${post.post_id}" class="btn-view-details">View Details</a>
            </div>
        `;
    }).join('');
}

function displayMyOffers(offers) {
    const container = document.getElementById('offersContainer');

    if (!offers || offers.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px; color: rgba(255,255,255,0.6);">No offers made yet</p>';
        return;
    }

    container.innerHTML = offers.map(offer => {
        const category = offer.custom_category || offer.category;
        const date = new Date(offer.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

        return `
            <div class="card">
                <div class="card-row">
                    <span class="card-label">Borrower</span>
                    <span class="card-value">${offer.borrower_name}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Category</span>
                    <span class="badge badge-${category.toLowerCase().replace(' ', '-')}">${category}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Loan Amount:</span>
                    <span class="card-value">${parseFloat(offer.loan_amount).toLocaleString()} taka</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Your Offer:</span>
                    <span class="card-value">${parseFloat(offer.offer_amount).toLocaleString()} taka</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Interest Rate:</span>
                    <span class="card-value">${offer.interest_rate}%</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Date:</span>
                    <span class="card-value">${date}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Status</span>
                    <span class="badge badge-${offer.offer_status}">${offer.offer_status.charAt(0).toUpperCase() + offer.offer_status.slice(1)}</span>
                </div>
                <button class="btn-view-details" onclick="window.location='loan.html'">View Loan</button>
            </div>
        `;
    }).join('');
}

function setupEventListeners() {
    // Edit button
    const editBtn = document.querySelector('.btn-edit');
    const editModal = document.getElementById('editModal');
    const cancelBtn = document.querySelector('.btn-cancel');

    editBtn.addEventListener('click', () => {
        editModal.style.display = 'flex';
    });

    cancelBtn.addEventListener('click', () => {
        editModal.style.display = 'none';
    });

    // Close modal when clicking outside
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) {
            editModal.style.display = 'none';
        }
    });

    // Verify button - Upload university ID card
    const verifyBtn = document.getElementById('btnVerify');
    const fileInput = document.getElementById('verificationUpload');

    verifyBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
        }

        // Upload the file
        const formData = new FormData();
        formData.append('verification_document', file);

        try {
            verifyBtn.disabled = true;
            verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

            const response = await fetch('api/api-upload-verification.php', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                alert('University ID card uploaded successfully! Your verification is pending admin approval.');
                loadUserProfile(); // Reload profile
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to upload verification document');
        } finally {
            verifyBtn.disabled = false;
            verifyBtn.innerHTML = '<i class="fas fa-check-circle"></i> Verify';
            fileInput.value = ''; // Reset file input
        }
    });

    // Edit form submission
    const editForm = document.getElementById('editProfileForm');
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(editForm);

        try {
            const response = await fetch('api/api-update-user-profile.php', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                alert('Profile updated successfully!');
                editModal.style.display = 'none';
                loadUserProfile(); // Reload profile

                // Update localStorage
                const fullName = formData.get('full_name');
                localStorage.setItem('userName', fullName);
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to update profile');
        }
    });
}

function viewLoanDetails(loanId) {
    window.location = `loan.html#loan-${loanId}`;
}