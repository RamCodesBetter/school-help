document.addEventListener('DOMContentLoaded', () => {
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
            // Add parsed assignments
            assignments.forEach(assignment => {
                const row = createAssignmentRow();
                const inputs = row.querySelectorAll('input');
                inputs[0].value = `${assignment.category} - ${assignment.name}`;
                inputs[1].value = assignment.score;
                inputs[2].value = assignment.total;
                inputs[3].value = assignment.weight;
                document.body.appendChild(row);
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
        const categories = {};
        let finalGrade = 0;

        // First, group assignments by category and calculate category grades
        assignments.forEach(assignment => {
            const name = assignment.querySelector('.assignment-name').value;
            const score = parseFloat(assignment.querySelector('.score').value) || 0;
            const totalPoints = parseFloat(assignment.querySelector('.total-points').value) || 0;
            const weight = parseFloat(assignment.querySelector('.weight').value) || 0;
            
            const category = name.split(' - ')[0];
            
            if (!categories[category]) {
                categories[category] = {
                    totalScore: 0,
                    totalPoints: 0,
                    weight: weight
                };
            }
            
            categories[category].totalScore += score;
            categories[category].totalPoints += totalPoints;
        });

        // Calculate final grade using category weights
        for (const category in categories) {
            const categoryData = categories[category];
            const categoryPercentage = (categoryData.totalScore / categoryData.totalPoints) * 100;
            finalGrade += categoryPercentage * (categoryData.weight / 100);
        }

        // Update the total grade display
        totalGradeSpan.textContent = `${finalGrade.toFixed(2)}%`;

        // Update category summaries
        updateCategorySummaries(categories);
    }

    function getLetterGrade(percentage) {
        if (percentage >= 92.99) return 'A';
        if (percentage >= 89.99) return 'A-';
        if (percentage >= 86.99) return 'B+';
        if (percentage >= 82.99) return 'B';
        if (percentage >= 79.99) return 'B-';
        if (percentage >= 76.99) return 'C+';
        if (percentage >= 72.99) return 'C';
        if (percentage >= 69.99) return 'C-';
        if (percentage >= 66.99) return 'D+';
        if (percentage >= 62.99) return 'D';
        if (percentage >= 59.99) return 'D-';
        return 'F';
    }

    function updateCategorySummaries(categories) {
        // Create or update the category summaries container
        let summariesContainer = document.getElementById('categorySummaries');
        if (!summariesContainer) {
            summariesContainer = document.createElement('div');
            summariesContainer.id = 'categorySummaries';
            document.querySelector('.calculator').insertBefore(summariesContainer, document.getElementById('addAssignment'));
        }
        summariesContainer.innerHTML = '';

        // Create category dropdowns
        for (const category in categories) {
            const categoryData = categories[category];
            const percentage = (categoryData.totalScore / categoryData.totalPoints) * 100;
            const letterGrade = getLetterGrade(percentage);

            const categoryDiv = document.createElement('details');
            categoryDiv.className = 'category-summary';
            
            categoryDiv.innerHTML = `
                <summary>
                    <span class="category-name">${category}</span>
                    <span class="category-grade">${percentage.toFixed(2)}% (${letterGrade})</span>
                </summary>
                <div class="category-details">
                    <p>Weight: ${categoryData.weight}%</p>
                    <p>Points: ${categoryData.totalScore}/${categoryData.totalPoints}</p>
                    <div class="category-assignments">
                        ${getAssignmentsHTML(category)}
                    </div>
                </div>
            `;
            
            summariesContainer.appendChild(categoryDiv);
        }
    }

    function getAssignmentsHTML(category) {
        const assignments = Array.from(document.querySelectorAll('.assignment-row'))
            .filter(row => row.querySelector('.assignment-name').value.startsWith(category));
        
        return assignments.map(assignment => {
            const name = assignment.querySelector('.assignment-name').value.split(' - ')[1];
            const score = assignment.querySelector('.score').value;
            const total = assignment.querySelector('.total-points').value;
            const percentage = ((score / total) * 100).toFixed(2);
            
            return `
                <div class="assignment-detail">
                    <span>${name}</span>
                    <span>${score}/${total} (${percentage}%)</span>
                    <button class="delete-btn">×</button>
                </div>
            `;
        }).join('');
    }

    addAssignmentBtn.addEventListener('click', () => {
        const newAssignment = prompt("Enter new assignment details in the format: Category - Name, Score, Total Points, Weight");
        if (newAssignment) {
            const [categoryName, score, totalPoints, weight] = newAssignment.split(',').map(item => item.trim());
            const row = createAssignmentRow();
            const inputs = row.querySelectorAll('input');
            inputs[0].value = categoryName;
            inputs[1].value = score;
            inputs[2].value = totalPoints;
            inputs[3].value = weight;
            document.body.appendChild(row);
            calculateTotal();
        }
    });
});