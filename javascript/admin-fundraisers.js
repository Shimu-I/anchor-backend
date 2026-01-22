document.addEventListener('DOMContentLoaded', function () {
    loadFundraisers();
});

async function loadFundraisers() {
    const container = document.querySelector('.requests-list');

    if (!container) {
        console.error('Requests list container not found');
        return;
    }

    container.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading fundraisers...</p>
        </div>
    `;

    try {
        const response = await fetch('api-admin-funding.php');
        const data = await response.json();

        if (data.success && data.posts.length > 0) {
            container.innerHTML = '';
            data.posts.forEach(post => {
                container.innerHTML += createFundraiserCard(post);
            });
            attachEventListeners();
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <h3>No fundraisers found</h3>
                    <p>There are currently no fundraisers to review.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading fundraisers:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error loading data</h3>
                <p>Please try refreshing the page. Error: ${error.message}</p>
            </div>
        `;
    }
}

function createFundraiserCard(post) {
    const initials = post.full_name ? post.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'NA';
    const dateCreated = new Date(post.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    const progress = (post.amount_raised / post.amount_needed * 100).toFixed(1);
    const category = post.custom_category || post.category || 'N/A';

    return `
        <div class="request-item">
            <div class="request-header">
                <div class="request-id">#${post.post_id}</div>
                <div class="user-avatar">${initials}</div>
                <div class="request-info">
                    <div class="user-name">${post.title || 'Untitled'}</div>
                    <div class="user-email">By: ${post.full_name} (${post.email})</div>
                </div>
            </div>
            
            <div class="request-details">
                <span class="detail-item"><strong>Category:</strong> ${category}</span>
                <span class="detail-item"><strong>Goal:</strong> ৳${parseFloat(post.amount_needed).toLocaleString()}</span>
                <span class="detail-item"><strong>Raised:</strong> ৳${parseFloat(post.amount_raised).toLocaleString()}</span>
                <span class="detail-item"><strong>Date:</strong> ${dateCreated}</span>
                <span class="detail-item"><strong>Documents:</strong> ${post.document_count || 0} files</span>
            </div>

            <div class="progress-container">
                <div class="progress-label">
                    <span>Progress</span>
                    <span>${progress}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${Math.min(progress, 100)}%"></div>
                </div>
            </div>

            <div class="request-actions">
                <a href="admin-views-funding-users-uploads.html?post_id=${post.post_id}" class="btn btn-view">
                    <i class="fas fa-file-alt"></i> View Documents (${post.document_count || 0})
                </a>
                
                ${post.status === 'pending' ? `
                    <button class="btn btn-approve" data-id="${post.post_id}" data-action="approve">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="btn btn-decline" data-id="${post.post_id}" data-action="reject">
                        <i class="fas fa-times"></i> Decline
                    </button>
                ` : `
                    <span class="status-badge status-${post.status}">
                        ${post.status.toUpperCase()}
                    </span>
                `}
            </div>
        </div>
    `;
}

function attachEventListeners() {
    document.querySelectorAll('.btn-approve').forEach(btn => {
        btn.addEventListener('click', function () {
            const postId = this.getAttribute('data-id');
            handleApproval(postId, 'approve');
        });
    });

    document.querySelectorAll('.btn-decline').forEach(btn => {
        btn.addEventListener('click', function () {
            const postId = this.getAttribute('data-id');
            if (confirm('Are you sure you want to decline this fundraiser?')) {
                handleApproval(postId, 'reject');
            }
        });
    });
}

async function handleApproval(postId, action) {
    const buttons = document.querySelectorAll(`[data-id="${postId}"]`);
    buttons.forEach(btn => btn.disabled = true);

    try {
        const formData = new FormData();
        formData.append('type', 'funding');
        formData.append('id', postId);
        formData.append('action', action);

        console.log('Sending approval request:', { type: 'funding', id: postId, action: action });

        const response = await fetch('api-admin-approve.php', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Approval response:', data);

        if (data.success) {
            alert(`Fundraiser ${action === 'approve' ? 'approved' : 'declined'} successfully!`);
            loadFundraisers();
        } else {
            alert('Error: ' + (data.error || 'Unknown error occurred'));
            buttons.forEach(btn => btn.disabled = false);
        }
    } catch (error) {
        console.error('Error during approval:', error);
        alert('An error occurred: ' + error.message);
        buttons.forEach(btn => btn.disabled = false);
    }
}

function viewFundingDocuments(postId) {
    window.open(`admin-views-funding-users-uploads.html?post_id=${postId}`, '_blank');
}