document.addEventListener('DOMContentLoaded', () => {
    const totalGradeSpan = document.getElementById('totalGrade');
    let assignments = []; // Store assignments in memory

    function addAssignment(assignment) {
        assignments.push(assignment);
        calculateTotal();
    }

    function removeAssignment(index) {
        assignments.splice(index, 1);
        calculateTotal();
    }

    function calculateTotal() {
        const categories = {};
        
        // Group assignments by category
        assignments.forEach(assignment => {
            const category = assignment.name.split(' - ')[0];
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

        // Calculate final grade
        let finalGrade = 0;
        for (const category in categories) {
            const categoryData = categories[category];
            const categoryPercentage = (categoryData.totalScore / categoryData.totalPoints) * 100;
            finalGrade += categoryPercentage * (categoryData.weight / 100);
        }

        totalGradeSpan.textContent = `${finalGrade.toFixed(2)}%`;
        updateCategorySummaries(categories);
    }

    function updateCategorySummaries(categories) {
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

        for (const category in categories) {
            const categoryData = categories[category];
            const percentage = (categoryData.totalScore / categoryData.totalPoints) * 100;
            const letterGrade = getLetterGrade(percentage);

            const categoryDiv = document.createElement('details');
            categoryDiv.className = 'category-summary';
            categoryDiv.open = true;
            
            const categoryAssignments = assignments.filter(a => a.name.startsWith(category));
            const assignmentsHTML = categoryAssignments.map((assignment, index) => `
                <div class="assignment-detail">
                    <span>${assignment.name.split(' - ')[1]}</span>
                    <span>${assignment.score}/${assignment.total} (${((assignment.score/assignment.total)*100).toFixed(2)}%)</span>
                    <button class="delete-btn" onclick="removeAssignment(${index})">×</button>
                </div>
            `).join('');

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

    // Process paste button click
    document.getElementById('processPaste').addEventListener('click', () => {
        const pasteContent = document.getElementById('canvasPaste').value;
        const parsedAssignments = parseCanvasGrades(pasteContent);
        
        if (parsedAssignments.length > 0) {
            assignments = parsedAssignments; // Replace existing assignments
            calculateTotal();
        }
    });

    // Add assignment button click
    document.getElementById('addAssignment').addEventListener('click', () => {
        addAssignmentModal();
    });

    // Make removeAssignment function available globally
    window.removeAssignment = removeAssignment;
});


