document.addEventListener('DOMContentLoaded', function () {
    loadLoanRequests();
    setupSearchFilter();
});

function setupSearchFilter() {
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearch');

    if (searchInput) {
        searchInput.addEventListener('input', function (e) {
            const searchTerm = e.target.value.toLowerCase();
            clearBtn.style.display = searchTerm ? 'block' : 'none';

            const items = document.querySelectorAll('.request-item');
            items.forEach(item => {
                const searchData = item.getAttribute('data-search') || '';
                if (searchData.includes(searchTerm)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', function () {
            searchInput.value = '';
            clearBtn.style.display = 'none';
            document.querySelectorAll('.request-item').forEach(item => {
                item.style.display = 'flex';
            });
        });
    }
}

async function loadLoanRequests() {
    const container = document.querySelector('.requests-list');

    if (!container) {
        console.error('Requests list container not found');
        return;
    }

    // Show loading state
    container.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading loan requests...</p>
        </div>
    `;

    try {
        const response = await fetch('api/api-admin-loans.php');
        const data = await response.json();

        if (data.success && data.loans.length > 0) {
            container.innerHTML = '';
            data.loans.forEach(loan => {
                container.innerHTML += createLoanCard(loan);
            });
            attachEventListeners();
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <h3>No loan requests found</h3>
                    <p>There are currently no loan requests to review.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading loans:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error loading data</h3>
                <p>Please try refreshing the page. Error: ${error.message}</p>
            </div>
        `;
    }
}

function createLoanCard(loan) {
    const initials = loan.full_name ? loan.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'NA';
    const dateCreated = new Date(loan.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    return `
        <div class="request-item" data-search="${loan.full_name?.toLowerCase()} ${loan.email?.toLowerCase()} ${loan.category?.toLowerCase()}">
            <div class="request-id">#${loan.loan_id}</div>
            <div class="user-avatar">${initials}</div>
            <div class="user-info">
                <div class="user-name">${loan.full_name || 'Unknown User'}</div>
                <div class="user-email">${loan.email || 'No email'}</div>
            </div>
            <div class="info-badge">${loan.category || 'N/A'}</div>
            <div class="info-badge">৳${parseFloat(loan.amount).toLocaleString()}</div>
            <div class="info-badge">${dateCreated}</div>
            <div class="info-badge">${loan.document_count || 0} docs</div>
            
            <div class="request-actions">
                <a href="admin-views-loan-users-uploads.html?loan_id=${loan.loan_id}" class="btn btn-view">
                    View (${loan.document_count || 0})
                </a>
                
                <button class="btn btn-approve" data-id="${loan.loan_id}" data-action="approve" ${loan.status === 'approved' ? 'disabled' : ''}>
                    Approve
                </button>
                <button class="btn btn-decline" data-id="${loan.loan_id}" data-action="reject" ${loan.status === 'rejected' ? 'disabled' : ''}>
                    Decline
                </button>
                
                <button class="btn btn-delete" data-id="${loan.loan_id}" title="Delete this loan request">
                    Delete
                </button>
            </div>
        </div>
    `;
}

function attachEventListeners() {
    // Approve buttons
    document.querySelectorAll('.btn-approve').forEach(btn => {
        btn.addEventListener('click', function () {
            const loanId = this.getAttribute('data-id');
            handleApproval(loanId, 'approve');
        });
    });

    // Decline buttons
    document.querySelectorAll('.btn-decline').forEach(btn => {
        btn.addEventListener('click', function () {
            const loanId = this.getAttribute('data-id');
            handleApproval(loanId, 'reject');
        });
    });

    // Delete buttons
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', function () {
            const loanId = this.getAttribute('data-id');
            handleDelete(loanId);
        });
    });
}

async function handleApproval(loanId, action) {
    // Disable buttons during processing
    const buttons = document.querySelectorAll(`[data-id="${loanId}"]`);
    buttons.forEach(btn => btn.disabled = true);

    try {
        const formData = new FormData();
        formData.append('type', 'loan');
        formData.append('id', loanId);
        formData.append('action', action);

        console.log('Sending approval request:', { type: 'loan', id: loanId, action: action });

        const response = await fetch('api/api-admin-approve.php', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Approval response:', data);

        if (data.success) {
            showNotification(
                `Loan request ${action === 'approve' ? 'approved' : 'declined'} successfully!`,
                'success'
            );
            loadLoanRequests(); // Reload the list
        } else {
            showNotification('Error: ' + (data.error || 'Unknown error occurred'), 'error');
            buttons.forEach(btn => btn.disabled = false);
        }
    } catch (error) {
        console.error('Error during approval:', error);
        showNotification('An error occurred: ' + error.message, 'error');
        buttons.forEach(btn => btn.disabled = false);
    }
}

async function handleDelete(loanId) {
    showDeleteConfirmation(loanId, 'loan');
}

function showDeleteConfirmation(id, type) {
    // Create modal backdrop
    const modal = document.createElement('div');
    modal.className = 'delete-modal-overlay';
    modal.innerHTML = `
        <div class="delete-modal">
            <button class="delete-modal-close">&times;</button>
            <div class="delete-modal-header">
                <div class="delete-modal-icon">
                    <i class="fas fa-trash-alt"></i>
                </div>
                <h2 class="delete-modal-title">Delete ${type === 'loan' ? 'Loan Request' : 'Fundraiser'}</h2>
            </div>
            <div class="delete-modal-body">
                <p class="delete-modal-message">Are you sure you want to permanently delete this ${type === 'loan' ? 'loan request' : 'fundraiser'}?</p>
                <div class="delete-modal-warning">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>This action cannot be undone. All associated data will be permanently removed from the system.</span>
                </div>
            </div>
            <div class="delete-modal-footer">
                <button class="delete-modal-btn btn-cancel">
                    <i class="fas fa-times"></i>
                    Cancel
                </button>
                <button class="delete-modal-btn btn-delete-confirm">
                    <i class="fas fa-trash-alt"></i>
                    Delete Permanently
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Animate in
    setTimeout(() => modal.classList.add('active'), 10);
    
    // Handle close button
    modal.querySelector('.delete-modal-close').addEventListener('click', () => {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    });
    
    // Handle cancel
    modal.querySelector('.btn-cancel').addEventListener('click', () => {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    });
    
    // Handle confirm
    modal.querySelector('.btn-delete-confirm').addEventListener('click', async () => {
        const deleteBtn = modal.querySelector('.btn-delete-confirm');
        deleteBtn.disabled = true;
        deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
        
        try {
            const response = await fetch('api/api-admin-loans.php', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `loan_id=${id}`
            });

            const data = await response.json();

            if (data.success) {
                showNotification('Loan request deleted successfully!', 'success');
                modal.classList.remove('active');
                setTimeout(() => modal.remove(), 300);
                loadLoanRequests(); // Reload the list
            } else {
                showNotification('Error: ' + (data.error || 'Unknown error occurred'), 'error');
                modal.classList.remove('active');
                setTimeout(() => modal.remove(), 300);
            }
        } catch (error) {
            console.error('Error during deletion:', error);
            showNotification('An error occurred: ' + error.message, 'error');
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        }
    });
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        }
    });
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function viewDocuments(loanId) {
    window.open(`admin-views-loan-users-uploads.html?loan_id=${loanId}`, '_blank');
}