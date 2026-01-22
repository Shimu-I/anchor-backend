document.addEventListener('DOMContentLoaded', function () {
    loadLoanRequests();
});

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
        const response = await fetch('api-admin-loans.php');
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
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    return `
        <div class="request-item">
            <div class="request-header">
                <div class="request-id">#${loan.loan_id}</div>
                <div class="user-avatar" style="display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; color: white;">${initials}</div>
                <div class="request-info">
                    <div class="user-name">${loan.full_name || 'Unknown User'}</div>
                    <div class="user-email">${loan.email || 'No email'}</div>
                </div>
            </div>
            
            <div class="request-details">
                <span class="detail-item"><strong>Category:</strong> ${loan.category || 'N/A'}</span>
                <span class="detail-item"><strong>Amount:</strong> ৳${parseFloat(loan.amount).toLocaleString()}</span>
                <span class="detail-item"><strong>Date:</strong> ${dateCreated}</span>
                <span class="detail-item"><strong>Documents:</strong> ${loan.document_count || 0} files</span>
            </div>

            <div class="request-actions">
                <a href="admin-views-loan-users-uploads.html?loan_id=${loan.loan_id}" class="btn btn-view">
                    <i class="fas fa-file-alt"></i> View Documents (${loan.document_count || 0})
                </a>
                
                ${loan.status === 'pending' ? `
                    <button class="btn btn-approve" data-id="${loan.loan_id}" data-action="approve">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="btn btn-decline" data-id="${loan.loan_id}" data-action="reject">
                        <i class="fas fa-times"></i> Decline
                    </button>
                ` : `
                    <span class="status-badge status-${loan.status}">
                        ${loan.status.toUpperCase()}
                    </span>
                `}
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
            if (confirm('Are you sure you want to decline this loan request?')) {
                handleApproval(loanId, 'reject');
            }
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
            alert(`Loan request ${action === 'approve' ? 'approved' : 'declined'} successfully!`);
            loadLoanRequests(); // Reload the list
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

function viewDocuments(loanId) {
    window.open(`admin-views-loan-users-uploads.html?loan_id=${loanId}`, '_blank');
}