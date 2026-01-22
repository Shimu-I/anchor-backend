// Admin Dashboard - Load Statistics
document.addEventListener('DOMContentLoaded', function () {
    loadDashboardStats();
});

async function loadDashboardStats() {
    try {
        const response = await fetch('api-admin-stats.php');
        const data = await response.json();

        if (data.success) {
            // Update stat cards
            const statCards = document.querySelectorAll('.stat-card');
            if (statCards[0]) {
                statCards[0].querySelector('.stat-value').textContent = data.stats.total_users.toLocaleString();
            }
            if (statCards[1]) {
                statCards[1].querySelector('.stat-value').textContent = data.stats.active_loans.toLocaleString();
            }
            if (statCards[2]) {
                statCards[2].querySelector('.stat-value').textContent = data.stats.active_funding.toLocaleString();
            }
        } else {
            console.error('Failed to load stats:', data.error);
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}