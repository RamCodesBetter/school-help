document.addEventListener('DOMContentLoaded', () => {
    const assignmentList = document.getElementById('assignmentList');
    const addAssignmentBtn = document.getElementById('addAssignment');
    const totalGradeSpan = document.getElementById('totalGrade');

    // Add paste area to HTML
    const pasteArea = document.createElement('div');
    pasteArea.className = 'paste-area';
    pasteArea.innerHTML = `
        <textarea id="canvasPaste" placeholder="Paste your Canvas grades here..."></textarea>
        <button id="processPaste">Process Canvas Grades</button>
    `;
    document.querySelector('.calculator').insertBefore(pasteArea, assignmentList);

    function parseCanvasGrades(text) {
        const rows = text.trim().split('\n');
        const assignments = [];
        
        rows.forEach(row => {
            // Match patterns like "Assignment Name Score: X out of Y points"
            const match = row.match(/(.+?)\s+Score:\s*([\d.]+)\s*out of\s*([\d.]+)\s*points/i);
            if (match) {
                // Extract category weight from section headers (e.g., "Summative 70% of Total")
                const categoryMatch = text.match(/(\w+)\s+(\d+)%\s+of\s+Total/i);
                const weight = categoryMatch ? parseFloat(categoryMatch[2]) : 0;
                
                assignments.push({
                    name: match[1].trim(),
                    score: parseFloat(match[2]),
                    total: parseFloat(match[3]),
                    weight: weight
                });
            }
        });
        
        return assignments;
    }

    document.getElementById('processPaste').addEventListener('click', () => {
        const pasteContent = document.getElementById('canvasPaste').value;
        const assignments = parseCanvasGrades(pasteContent);
        
        // Clear existing assignments
        assignmentList.innerHTML = '';
        
        // Add parsed assignments
        assignments.forEach(assignment => {
            const row = createAssignmentRow();
            const inputs = row.querySelectorAll('input');
            inputs[0].value = assignment.name;
            inputs[1].value = assignment.score;
            inputs[2].value = assignment.total;
            inputs[3].value = assignment.weight;
            assignmentList.appendChild(row);
        });
        
        calculateTotal();
    });

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


