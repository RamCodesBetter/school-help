document.addEventListener('DOMContentLoaded', () => {
    const assignmentList = document.getElementById('assignmentList');
    const addAssignmentBtn = document.getElementById('addAssignment');
    const totalGradeSpan = document.getElementById('totalGrade');

    function createAssignmentRow() {
        const row = document.createElement('div');
        row.className = 'assignment-row';
        
        row.innerHTML = `
            <input type="text" placeholder="Assignment Name" class="assignment-name">
            <input type="number" placeholder="Score" class="score" min="0" max="100">
            <input type="number" placeholder="Total Points" class="total-points" min="0">
            <input type="number" placeholder="Weight %" class="weight" min="0" max="100">
            <button class="delete-btn">×</button>
        `;

        row.querySelector('.delete-btn').addEventListener('click', () => {
            row.remove();
            calculateTotal();
        });

        row.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', calculateTotal);
        });

        return row;
    }

    function calculateTotal() {
        const assignments = document.querySelectorAll('.assignment-row');
        let totalWeightedScore = 0;
        let totalWeight = 0;

        assignments.forEach(assignment => {
            const score = parseFloat(assignment.querySelector('.score').value) || 0;
            const totalPoints = parseFloat(assignment.querySelector('.total-points').value) || 0;
            const weight = parseFloat(assignment.querySelector('.weight').value) || 0;

            if (totalPoints > 0 && weight > 0) {
                const percentage = (score / totalPoints) * 100;
                totalWeightedScore += percentage * (weight / 100);
                totalWeight += weight;
            }
        });

        const finalGrade = totalWeight > 0 ? (totalWeightedScore * 100 / totalWeight) / 100 : 0;
        totalGradeSpan.textContent = `${finalGrade.toFixed(2)}%`;
    }

    addAssignmentBtn.addEventListener('click', () => {
        assignmentList.appendChild(createAssignmentRow());
    });

    // Add initial row
    assignmentList.appendChild(createAssignmentRow());
});


