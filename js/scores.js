function displayScores() {
    const scoresList = document.getElementById('scores-list');
    const scores = JSON.parse(localStorage.getItem('tetris.scores') || '[]');
    
    if (scores.length === 0) {
        scoresList.innerHTML = '<p class="no-scores">There is no scores yet</p>';
        return;
    }
    
    const scoresHTML = `
        <table class="scores-table">
            <thead>
                <tr>
                    <th>Place</th>
                    <th>Player</th>
                    <th>Score</th>
                    <th>Level</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
                ${scores.map((score, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${score.name}</td>
                        <td>${score.score.toLocaleString()}</td>
                        <td>${score.level}</td>
                        <td>${score.date}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    scoresList.innerHTML = scoresHTML;
}

function clearScores() {
    if (confirm('Are you sure about clear the history?')) {
        localStorage.removeItem('tetris.scores');
        displayScores();
    }
}

// Display scores when page loads
document.addEventListener('DOMContentLoaded', displayScores);