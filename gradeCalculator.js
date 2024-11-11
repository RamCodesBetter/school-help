document.addEventListener('DOMContentLoaded', () => {
    const addAssignmentBtn = document.getElementById('addAssignment');
    const totalGradeSpan = document.getElementById('totalGrade');
    let assignments = []; // Store assignments in memory

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
        assignments = parseCanvasGrades(pasteContent); // Store parsed assignments
        calculateTotal();
        updateCategorySummaries(); // Update summaries after parsing
    });

    function createAssignmentRow(assignment) {
        const row = document.createElement('div');
        row.className = 'assignment-row';
        
        row.innerHTML = `
            <input type="text" value="${assignment.name}" class="assignment-name" readonly>
            <input type="number" value="${assignment.score}" class="score" min="0" max="100">
            <input type="number" value="${assignment.total}" class="total-points" min="0">
            <input type="number" value="${assignment.weight}" class="weight" min="0" max="100">
            <button class="edit-btn">Edit</button>
            <button class="delete-btn">×</button>
        `;

        row.querySelector('.delete-btn').addEventListener('click', () => {
            const index = assignments.indexOf(assignment);
            if (index > -1) {
                assignments.splice(index, 1); // Remove from assignments array
            }
            row.remove();
            calculateTotal();
        });

        row.querySelector('.edit-btn').addEventListener('click', () => {
            openEditModal(assignment, row);
        });

        return row;
    }

    function openEditModal(assignment, row) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Edit Assignment</h2>
                <input type="text" id="editName" value="${assignment.name}">
                <input type="number" id="editScore" value="${assignment.score}" min="0" max="100">
                <input type="number" id="editTotal" value="${assignment.total}" min="0">
                <input type="number" id="editWeight" value="${assignment.weight}" min="0" max="100">
                <div class="modal-buttons">
                    <button id="cancelEdit">Cancel</button>
                    <button id="confirmEdit">Save</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('#cancelEdit').onclick = () => modal.remove();
        modal.querySelector('#confirmEdit').onclick = () => {
            assignment.name = modal.querySelector('#editName').value;
            assignment.score = parseFloat(modal.querySelector('#editScore').value);
            assignment.total = parseFloat(modal.querySelector('#editTotal').value);
            assignment.weight = parseFloat(modal.querySelector('#editWeight').value);
            row.querySelector('.assignment-name').value = assignment.name; // Update row
            row.querySelector('.score').value = assignment.score; // Update row
            row.querySelector('.total-points').value = assignment.total; // Update row
            row.querySelector('.weight').value = assignment.weight; // Update row
            calculateTotal();
            modal.remove();
        };
    }

    function calculateTotal() {
        const categories = {};
        let finalGrade = 0;

        // First, group assignments by category and calculate category grades
        assignments.forEach(assignment => {
            const category = assignment.category;
            if (!categories[category]) {
                categories[category] = {
                    totalScore: 0,
                    totalPoints: 0,
                    weight: assignment.weight
                };
            }
            categories[category].totalScore += assignment.score;
            categories[category].totalPoints += assignment.total;
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

    function updateCategorySummaries(categories = {}) {
        let summariesContainer = document.getElementById('categorySummaries');
        if (!summariesContainer) {
            summariesContainer = document.createElement('div');
            summariesContainer.id = 'categorySummaries';
            document.querySelector('.calculator').insertBefore(
                summariesContainer,
                document.querySelector('.results')
            );
        }
        summariesContainer.innerHTML = '';

        // Initialize category totals based on existing assignments
        const categoryTotals = {};
        
        // First pass: collect unique categories and their weights
        assignments.forEach(assignment => {
            if (!categoryTotals[assignment.category]) {
                categoryTotals[assignment.category] = {
                    weight: assignment.weight,
                    totalScore: 0,
                    totalPoints: 0
                };
            }
        });

        // Second pass: calculate totals for each category
        assignments.forEach(assignment => {
            const category = assignment.category;
            categoryTotals[category].totalScore += assignment.score;
            categoryTotals[category].totalPoints += assignment.total;
        });

        // Create category summaries
        for (const category in categoryTotals) {
            const categoryData = categoryTotals[category];
            const percentage = categoryData.totalPoints > 0 
                ? (categoryData.totalScore / categoryData.totalPoints) * 100 
                : 0;
            const letterGrade = getLetterGrade(percentage);

            const categoryAssignments = assignments.filter(a => a.category === category);
            const assignmentsHTML = categoryAssignments.map((assignment, index) => {
                const assignmentPercentage = (assignment.score / assignment.total) * 100;
                const assignmentLetterGrade = getLetterGrade(assignmentPercentage);
                return `
                    <div class="assignment-detail">
                        <span class="assignment-name">${assignment.name}</span>
                        <div class="assignment-scores">
                            <span>${assignment.score}/${assignment.total}</span>
                            <span>(${assignmentPercentage.toFixed(2)}%)</span>
                            <span>${assignmentLetterGrade}</span>
                            <button class="edit-btn" onclick="editAssignment(${index})">Edit</button>
                            <button class="delete-btn" onclick="removeAssignment(${index})">×</button>
                        </div>
                    </div>
                `;
            }).join('');

            const categoryDiv = document.createElement('details');
            categoryDiv.className = 'category-summary';
            categoryDiv.open = true;
            
            categoryDiv.innerHTML = `
                <summary>
                    <span class="category-name">${category}</span>
                    <span class="category-grade">${percentage.toFixed(2)}% (${letterGrade})</span>
                </summary>
                <div class="category-details">
                    <p>Weight: ${categoryData.weight}%</p>
                    <p>Points: ${categoryData.totalScore}/${categoryData.totalPoints}</p>
                    <div class="category-assignments">
                        ${assignmentsHTML}
                    </div>
                </div>
            `;
            
            summariesContainer.appendChild(categoryDiv);
        }
    }

    addAssignmentBtn.addEventListener('click', () => {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Add New Assignment</h2>
                <select id="categorySelect">
                    <option value="Summative">Summative</option>
                    <option value="Formative">Formative</option>
                    <option value="Lab Practices">Lab Practices</option>
                </select>
                <input type="text" id="assignmentName" placeholder="Assignment Name">
                <input type="number" id="assignmentScore" placeholder="Score" min="0">
                <input type="number" id="assignmentTotal" placeholder="Total Points" min="0">
                <div class="modal-buttons">
                    <button id="cancelAdd">Cancel</button>
                    <button id="confirmAdd">Add Assignment</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('#cancelAdd').onclick = () => modal.remove();
        modal.querySelector('#confirmAdd').onclick = () => {
            const category = modal.querySelector('#categorySelect').value;
            const name = modal.querySelector('#assignmentName').value;
            const score = parseFloat(modal.querySelector('#assignmentScore').value);
            const total = parseFloat(modal.querySelector('#assignmentTotal').value);
            
            // Get weight based on category
            let weight;
            switch(category) {
                case 'Summative': weight = 70; break;
                case 'Formative': weight = 25; break;
                case 'Lab Practices': weight = 5; break;
                default: weight = 0;
            }

            if (name && !isNaN(score) && !isNaN(total)) {
                const assignment = {
                    name: name,
                    score: score,
                    total: total,
                    weight: weight,
                    category: category
                };
                assignments.push(assignment);
                calculateTotal();
                updateCategorySummaries();
                modal.remove();
            } else {
                alert('Please fill in all fields correctly');
            }
        };
    });

    // Add this function to handle assignment deletion
    window.removeAssignment = function(index) {
        assignments.splice(index, 1);
        calculateTotal();
    };

    // Add this function to handle assignment editing
    window.editAssignment = function(index) {
        const assignment = assignments[index];
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Edit Assignment</h2>
                <input type="text" id="editName" value="${assignment.name}" placeholder="Assignment Name">
                <input type="number" id="editScore" value="${assignment.score}" min="0" step="any" placeholder="Score">
                <input type="number" id="editTotal" value="${assignment.total}" min="0" step="any" placeholder="Total Points">
                <div class="modal-buttons">
                    <button id="cancelEdit">Cancel</button>
                    <button id="confirmEdit">Save</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('#cancelEdit').onclick = () => modal.remove();
        modal.querySelector('#confirmEdit').onclick = () => {
            const newName = modal.querySelector('#editName').value;
            const newScore = parseFloat(modal.querySelector('#editScore').value);
            const newTotal = parseFloat(modal.querySelector('#editTotal').value);

            if (newName && !isNaN(newScore) && !isNaN(newTotal)) {
                assignment.name = newName;
                assignment.score = newScore;
                assignment.total = newTotal;
                calculateTotal();
                updateCategorySummaries();
                modal.remove();
            } else {
                alert('Please fill in all fields correctly');
            }
        };
    };
});