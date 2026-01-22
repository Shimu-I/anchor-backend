document.addEventListener('DOMContentLoaded', function () {
    loadLoanDocuments();
});

async function loadLoanDocuments() {
    const container = document.getElementById('documentsContainer');
    const urlParams = new URLSearchParams(window.location.search);
    const loanId = urlParams.get('loan_id');

    if (!loanId) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Invalid Request</h3>
                <p>No loan ID specified.</p>
                <a href="admin-loan-requests.html" class="btn btn-approve">Go Back</a>
            </div>
        `;
        return;
    }

    // Update page title
    const pageTitle = document.querySelector('.page-title');
    if (pageTitle) {
        pageTitle.textContent = `Loan #${loanId} - Documents`;
    }

    // Show loading state
    container.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading documents...</p>
        </div>
    `;

    try {
        const response = await fetch(`api-get-loan-documents.php?loan_id=${loanId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        console.log('Documents Response:', data); // Debug log

        if (data.success && data.documents && data.documents.length > 0) {
            container.innerHTML = '';
            data.documents.forEach((doc, index) => {
                container.innerHTML += createDocumentCard(doc, index + 1);
            });
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <h3>No documents uploaded</h3>
                    <p>This loan request has no documents yet.</p>
                    <a href="admin-loan-requests.html" class="btn btn-approve">Go Back</a>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading documents:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error loading documents</h3>
                <p>${error.message}</p>
                <button class="btn btn-approve" onclick="loadLoanDocuments()">Retry</button>
            </div>
        `;
    }
}

function createDocumentCard(doc, index) {
    const fileIcon = getFileIcon(doc.mime_type || doc.file_name);
    const uploadDate = new Date(doc.uploaded_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    return `
        <div class="request-item">
            <div class="request-info">
                <div class="request-id">#${index}</div>
                <div class="username">
                    <i class="${fileIcon}"></i> 
                    ${doc.file_name || 'Document ' + index}
                </div>
            </div>
            <div class="request-details">
                <span class="detail-item"><strong>Type:</strong> ${doc.doc_type}</span>
                <span class="detail-item"><strong>Uploaded:</strong> ${uploadDate}</span>
                ${doc.file_size ? `<span class="detail-item"><strong>Size:</strong> ${formatFileSize(doc.file_size)}</span>` : ''}
            </div>
            <div class="request-actions">
                <a href="${doc.file_path}" target="_blank" class="btn btn-approve">
                    <i class="fas fa-eye"></i> View
                </a>
                <a href="${doc.file_path}" download class="btn btn-view">
                    <i class="fas fa-download"></i> Download
                </a>
            </div>
        </div>
    `;
}

function getFileIcon(mimeOrFileName) {
    if (!mimeOrFileName) return 'fas fa-file';

    const lower = mimeOrFileName.toLowerCase();

    if (lower.includes('pdf')) return 'fas fa-file-pdf';
    if (lower.includes('image') || lower.includes('jpg') || lower.includes('jpeg') || lower.includes('png')) return 'fas fa-file-image';
    if (lower.includes('word') || lower.includes('doc')) return 'fas fa-file-word';
    if (lower.includes('excel') || lower.includes('xls') || lower.includes('csv')) return 'fas fa-file-excel';

    return 'fas fa-file';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
