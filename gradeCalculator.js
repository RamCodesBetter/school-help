function initializeCategoryManagement() {
    const categoryList = document.getElementById('categoryList');
    const addCategoryBtn = document.getElementById('addCategory');

    function updateCategoryList() {
        const categories = Array.from(new Set(assignments.map(a => a.category)));
        categoryList.innerHTML = categories.map(category => `
            <div class="category-item" draggable="true" data-category="${category}">
                <span>${category}</span>
                <span>(${assignments.find(a => a.category === category)?.weight}%)</span>
                <button class="edit-category-btn">Edit</button>
            </div>
        `).join('');

        // Add drag-drop listeners
        document.querySelectorAll('.category-item').forEach(item => {
            item.addEventListener('dragstart', handleDragStart);
            item.addEventListener('dragend', handleDragEnd);
        });
    }

    // Drag and Drop functionality
    function handleDragStart(e) {
        // Prevent text selection during drag
        e.stopPropagation();
        
        // Add visual feedback
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', e.target.dataset.category);
        
        // Add a drag image (optional)
        const dragImage = e.target.cloneNode(true);
        dragImage.style.opacity = '0.5';
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, 0, 0);
        setTimeout(() => document.body.removeChild(dragImage), 0);
    }

    function handleDragEnd(e) {
        e.target.classList.remove('dragging');
    }

    // Add drag-drop listeners to assignments
    document.querySelectorAll('.assignment-detail').forEach(assignment => {
        assignment.setAttribute('draggable', true);
        assignment.addEventListener('dragstart', handleAssignmentDragStart);
        assignment.addEventListener('dragover', handleDragOver);
        assignment.addEventListener('drop', handleDrop);
    });

    function handleAssignmentDragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.name);
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.target.classList.add('drag-over');
    }

    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const draggedCategory = e.dataTransfer.getData('text/plain');
        const targetCategory = e.currentTarget.dataset.category;
        
        if (draggedCategory && targetCategory && draggedCategory !== targetCategory) {
            // Update the assignment category
            const assignment = assignments.find(a => a.name === e.currentTarget.dataset.name);
            if (assignment) {
                assignment.category = draggedCategory;
                assignment.weight = assignments.find(a => a.category === draggedCategory)?.weight || 0;
                calculateTotal();
                updateCategorySummaries();
            }
        }
        
        e.currentTarget.classList.remove('drag-over');
    }

    // Add category button functionality
    addCategoryBtn.addEventListener('click', () => {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Add New Category</h2>
                <input type="text" id="categoryName" placeholder="Category Name">
                <input type="number" id="categoryWeight" placeholder="Weight (%)" min="0" max="100">
                <div class="modal-buttons">
                    <button id="cancelAddCategory">Cancel</button>
                    <button id="confirmAddCategory">Add Category</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('#confirmAddCategory').onclick = () => {
            const name = modal.querySelector('#categoryName').value;
            const weight = parseFloat(modal.querySelector('#categoryWeight').value);
            if (name && !isNaN(weight)) {
                // Create a new empty category by adding a placeholder assignment
                assignments.push({
                    name: `${name} (placeholder)`,
                    score: 0,
                    total: 0,
                    category: name,
                    weight: weight,
                    isPlaceholder: true  // Add this flag to identify placeholder assignments
                });
                
                // Update the UI
                updateCategoryList();
                updateCategorySummaries();
                calculateTotal();
                modal.remove();
            } else {
                alert('Please fill in all fields correctly');
            }
        };

        modal.querySelector('#cancelAddCategory').onclick = () => modal.remove();
    });

    // Initialize category list
    updateCategoryList();
}

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

        // Add drag and drop listeners to all assignments
        document.querySelectorAll('.assignment-detail').forEach(assignment => {
            assignment.setAttribute('draggable', true);
            
            assignment.addEventListener('dragstart', (e) => {
                e.stopPropagation();
                e.target.classList.add('dragging');
                e.dataTransfer.setData('text/plain', e.target.dataset.name);
            });

            assignment.addEventListener('dragend', (e) => {
                e.target.classList.remove('dragging');
                // Remove any duplicate elements that might have been created
                const duplicates = document.querySelectorAll(`[data-name="${e.target.dataset.name}"]`);
                if (duplicates.length > 1) {
                    duplicates.forEach((dupe, index) => {
                        if (index > 0) dupe.remove();
                    });
                }
            });
        });

        // Add drop zones to all category sections
        document.querySelectorAll('.category-assignments').forEach(dropZone => {
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
            });

            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const assignmentName = e.dataTransfer.getData('text/plain');
                const newCategory = dropZone.dataset.category;
                
                // Find the assignment and update its category
                const assignment = assignments.find(a => a.name === assignmentName);
                if (assignment && assignment.category !== newCategory) {
                    // Update the category
                    assignment.category = newCategory;
                    
                    // Get the weight from an existing assignment in the target category
                    const categoryWeight = assignments.find(a => a.category === newCategory)?.weight || 0;
                    assignment.weight = categoryWeight;
                    
                    // Update the UI
                    calculateTotal();
                    updateCategorySummaries();
                }
            });
        });
    }

    // Helper function to determine drop position
    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.assignment-detail:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
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

    // Update the removeAssignment function
    window.removeAssignment = function(assignmentName) {
        const index = assignments.findIndex(a => a.name === assignmentName);
        if (index > -1) {
            if (confirm(`Are you sure you want to delete "${assignmentName}"?`)) {
                assignments.splice(index, 1);
                calculateTotal();
                updateCategorySummaries();
            }
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

    initializeCategoryManagement();
});