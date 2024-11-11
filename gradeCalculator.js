document.addEventListener('DOMContentLoaded', () => {
    const assignmentList = document.getElementById('assignmentList');
    const addAssignmentBtn = document.getElementById('addAssignment');
    const totalGradeSpan = document.getElementById('totalGrade');

    function parseCanvasGrades(text) {
        const rows = text.trim().split('\n');
        const assignments = [];
        let currentCategory = '';
        let currentWeight = 0;
        
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i].trim();
            
            // Check for category headers (e.g., " Summative", " Formative", " Lab Practices")
            if (row.match(/^\s*[A-Za-z\s]+$/)) {
                // Look ahead for weight in next line
                const nextRow = rows[i + 1]?.trim() || '';
                const weightMatch = nextRow.match(/(\d+)%\s+of\s+Total/);
                if (weightMatch) {
                    currentCategory = row.trim();
                    currentWeight = parseFloat(weightMatch[1]);
                    continue;
                }
            }

            // Match score patterns like "6/6 pts" or "Score: 6 out of 6 points"
            const scoreMatch = row.match(/(\d+)\/(\d+)\s+pts/) || 
                              row.match(/Score:\s*(\d+)\s+out of\s*(\d+)\s+points/);
            
            if (scoreMatch) {
                // Look back for assignment name
                let j = i - 1;
                let name = '';
                while (j >= 0) {
                    const prevLine = rows[j].trim();
                    if (prevLine.startsWith('Assignment') || prevLine.startsWith('Quiz')) {
                        name = rows[j + 1].trim();
                        break;
                    }
                    j--;
                }
                
                // Only add if we have a valid name and scores
                if (name && !name.includes('Search') && !name.includes('Skip To Content')) {
                    assignments.push({
                        name: name,
                        score: parseFloat(scoreMatch[1]),
                        total: parseFloat(scoreMatch[2]),
                        weight: currentWeight,
                        category: currentCategory
                    });
                }
            }
        }
        
        return assignments;
    }

    document.getElementById('processPaste').addEventListener('click', () => {
        const pasteContent = document.getElementById('canvasPaste').value;
        const assignments = parseCanvasGrades(pasteContent);
        
        // Only clear if we successfully parsed some assignments
        if (assignments.length > 0) {
            assignmentList.innerHTML = '';
            
            // Add parsed assignments
            assignments.forEach(assignment => {
                const row = createAssignmentRow();
                const inputs = row.querySelectorAll('input');
                inputs[0].value = `${assignment.category} - ${assignment.name}`;
                inputs[1].value = assignment.score;
                inputs[2].value = assignment.total;
                inputs[3].value = assignment.weight;
                assignmentList.appendChild(row);
            });
            
            calculateTotal();
        }
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


