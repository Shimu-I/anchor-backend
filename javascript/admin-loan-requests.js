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
                
                ${loan.status === 'pending' ? `
                    <button class="btn btn-approve" data-id="${loan.loan_id}" data-action="approve">
                        Approve
                    </button>
                    <button class="btn btn-decline" data-id="${loan.loan_id}" data-action="reject">
                        Decline
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