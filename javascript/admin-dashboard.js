// Admin Dashboard - Load Statistics
document.addEventListener('DOMContentLoaded', function () {
    loadDashboardStats();
});

async function loadDashboardStats() {
    try {
        const response = await fetch('api/api-admin-stats.php');
        const data = await response.json();

        console.log('Dashboard stats:', data);

        if (data.success) {
            const stats = data.stats;

            // Top stats
            document.getElementById('totalUsers').textContent = stats.total_users.toLocaleString();
            document.getElementById('totalLoans').textContent = stats.total_loans.toLocaleString();
            document.getElementById('totalFunding').textContent = stats.total_funding.toLocaleString();
            document.getElementById('totalAmount').textContent = '৳' + (stats.total_disbursed || 0).toLocaleString();

            // Pending requests
            document.getElementById('pendingLoans').textContent = stats.pending_loans.toLocaleString();
            document.getElementById('pendingFunding').textContent = stats.pending_funding.toLocaleString();

            // Activity stats
            document.getElementById('approvedLoans').textContent = stats.approved_loans.toLocaleString();
            document.getElementById('activeFunding').textContent = stats.active_funding.toLocaleString();
            document.getElementById('totalContributions').textContent = (stats.total_contributions || 0).toLocaleString();
            document.getElementById('verifiedUsers').textContent = (stats.verified_users || 0).toLocaleString();
        } else {
            console.error('Failed to load stats:', data.error);
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}