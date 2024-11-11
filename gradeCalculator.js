document.addEventListener('DOMContentLoaded', () => {
    const addAssignmentBtn = document.getElementById('addAssignment');
    const totalGradeSpan = document.getElementById('totalGrade');
    let assignments = []; // Store assignments in memory

    function parseCanvasGrades(text) {
        const rows = text.trim().split('\n');
        const assignments = [];
        let currentCategory = '';
        let currentWeight = 0;
        let currentAssignmentName = '';
        
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i].trim();
            
            // Check for category headers and their weights
            if (row.match(/^\s*[A-Za-z\s]+$/)) {
                const nextRow = rows[i + 1]?.trim() || '';
                const weightMatch = nextRow.match(/(\d+)%\s+of\s+Total/);
                if (weightMatch) {
                    currentCategory = row.trim();
                    currentWeight = parseFloat(weightMatch[1]);
                    continue;
                }
            }

            // Look for assignment names
            if (row.startsWith('Assignment')) {
                currentAssignmentName = rows[i + 1]?.trim() || '';
                continue;
            }

            // Match score patterns
            const scoreMatch = row.match(/(\d+(?:\.\d+)?)\/(\d+)\s+pts/) || 
                              row.match(/Score:\s*(\d+(?:\.\d+)?)\s+out of\s*(\d+)\s+points/);
            
            if (scoreMatch && currentAssignmentName) {
                // Only add if we have a valid name and it's not a duplicate
                if (currentAssignmentName && 
                    !currentAssignmentName.includes('Search') && 
                    !currentAssignmentName.includes('Skip To Content') &&
                    !assignments.some(a => a.name === currentAssignmentName)) {
                    
                    assignments.push({
                        name: currentAssignmentName,
                        score: parseFloat(scoreMatch[1]),
                        total: parseFloat(scoreMatch[2]),
                        weight: currentWeight,
                        category: currentCategory
                    });
                }
                currentAssignmentName = ''; // Reset the name after using it
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
        let finalGrade = 0;
        const categories = {};
        
        // Group assignments by category
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

        // Update the total grade display with both percentage and letter grade
        const letterGrade = getLetterGrade(finalGrade);
        totalGradeSpan.textContent = `${finalGrade.toFixed(2)}% (${letterGrade})`;
        updateGradeColor(finalGrade);

        // Update category summaries
        updateCategorySummaries(categories);
    }

    const gradingScales = {
        all: (percentage) => {
            if (percentage >= 93) return 'A';
            if (percentage >= 90) return 'A-';
            if (percentage >= 87) return 'B+';
            if (percentage >= 83) return 'B';
            if (percentage >= 80) return 'B-';
            if (percentage >= 77) return 'C+';
            if (percentage >= 73) return 'C';
            if (percentage >= 70) return 'C-';
            if (percentage >= 67) return 'D+';
            if (percentage >= 60) return 'D';
            return 'F';
        },
        noMinus: (percentage) => {
            if (percentage >= 90) return 'A';
            if (percentage >= 87) return 'B+';
            if (percentage >= 80) return 'B';
            if (percentage >= 77) return 'C+';
            if (percentage >= 70) return 'C';
            if (percentage >= 67) return 'D+';
            if (percentage >= 60) return 'D';
            return 'F';
        },
        simple: (percentage) => {
            if (percentage >= 90) return 'A';
            if (percentage >= 80) return 'B';
            if (percentage >= 70) return 'C';
            if (percentage >= 60) return 'D';
            return 'F';
        }
    };

    function getLetterGrade(percentage) {
        const scale = document.getElementById('gradingScale').value;
        return gradingScales[scale](percentage);
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
            const assignmentsHTML = categoryAssignments.map((assignment) => {
                const assignmentPercentage = (assignment.score / assignment.total) * 100;
                const assignmentLetterGrade = getLetterGrade(assignmentPercentage);
                return `
                    <div class="assignment-detail" data-name="${assignment.name}">
                        <span class="assignment-name">${assignment.name}</span>
                        <div class="assignment-scores">
                            <span>${assignment.score}/${assignment.total}</span>
                            <span>(${assignmentPercentage.toFixed(2)}%)</span>
                            <span>${assignmentLetterGrade}</span>
                            <button class="edit-btn" onclick="editAssignment('${assignment.name}')">Edit</button>
                            <button class="delete-btn" onclick="removeAssignment('${assignment.name}')">×</button>
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
                    ${Array.from(new Set(assignments.map(a => a.category))).map(category => `<option value="${category}">${category}</option>`).join('')}
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
            const categoryData = assignments.find(a => a.category === category);
            let weight = categoryData ? categoryData.weight : 0;

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
    window.removeAssignment = function(assignmentName) {
        const index = assignments.findIndex(a => a.name === assignmentName);
        if (index > -1) {
            assignments.splice(index, 1);
            calculateTotal();
        }
    };

    // Update the editAssignment function to use the assignment name instead of index
    window.editAssignment = function(assignmentName) {
        // Find the assignment by name
        const assignment = assignments.find(a => a.name === assignmentName);
        if (!assignment) {
            console.error('Assignment not found:', assignmentName);
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Edit Assignment</h2>
                <select id="editCategory" value="${assignment.category}">
                    ${Object.keys(assignments.reduce((acc, a) => {
                        acc[a.category] = true;
                        return acc;
                    }, {})).map(category => `
                        <option value="${category}" ${assignment.category === category ? 'selected' : ''}>${category}</option>
                    `).join('')}
                </select>
                <input type="text" id="editName" value="${assignment.name}" placeholder="Assignment Name">
                <div class="score-inputs">
                    <input type="number" id="editScore" value="${assignment.score}" min="0" step="any" placeholder="Score">
                    <span>/</span>
                    <input type="number" id="editTotal" value="${assignment.total}" min="0" step="any" placeholder="Total Points">
                </div>
                <div class="current-details">
                    <p>Current Grade: ${((assignment.score/assignment.total)*100).toFixed(2)}% (${getLetterGrade((assignment.score/assignment.total)*100)})</p>
                    <p>Category Weight: ${assignment.weight}%</p>
                </div>
                <div class="modal-buttons">
                    <button id="cancelEdit">Cancel</button>
                    <button id="confirmEdit">Save</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('#cancelEdit').onclick = () => modal.remove();
        modal.querySelector('#confirmEdit').onclick = () => {
            const newCategory = modal.querySelector('#editCategory').value;
            const newName = modal.querySelector('#editName').value;
            const newScore = parseFloat(modal.querySelector('#editScore').value);
            const newTotal = parseFloat(modal.querySelector('#editTotal').value);

            if (newName && !isNaN(newScore) && !isNaN(newTotal)) {
                assignment.category = newCategory;
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

    function updateGradeColor(percentage) {
        // Create a color gradient from red to green
        const red = percentage < 60 ? 255 : Math.round(255 * (100 - percentage) / 40);
        const green = percentage < 60 ? Math.round(255 * percentage / 60) : 255;
        totalGradeSpan.style.color = `rgb(${red}, ${green}, 0)`;
    }

    // Add event listener for grading scale changes
    document.getElementById('gradingScale').addEventListener('change', () => {
        calculateTotal();
    });
});