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

    function updateCategorySummaries() {
        // Get unique categories from existing assignments
        const existingCategories = [...new Set(assignments.map(a => a.category))];
        
        categorySummariesDiv.innerHTML = existingCategories.map(category => `
            <div class="category-summary">
                <summary>
                    ${category} (${assignments.find(a => a.category === category)?.weight || 0}%) - 
                    ${calculateCategoryGrade(category).toFixed(2)}%
                </summary>
                <div class="category-assignments" data-category="${category}">
                    ${assignments
                        .filter(a => a.category === category)
                        .map(assignment => `
                            <div class="assignment-detail" 
                                 draggable="true" 
                                 data-name="${assignment.name}"
                                 data-category="${category}">
                                <span class="assignment-name">${assignment.name}</span>
                                <div class="assignment-scores">
                                    <span>${assignment.score}/${assignment.total}</span>
                                    <span>(${((assignment.score/assignment.total)*100).toFixed(1)}%)</span>
                                    <button class="edit-btn" onclick="editAssignment('${assignment.name}')">Edit</button>
                                    <button class="delete-btn" onclick="removeAssignment('${assignment.name}')">Delete</button>
                                </div>
                            </div>
                        `).join('')}
                </div>
            </div>
        `).join('');

        // Add drag and drop listeners
        document.querySelectorAll('.assignment-detail').forEach(assignment => {
            assignment.addEventListener('dragstart', (e) => {
                e.stopPropagation();
                e.target.classList.add('dragging');
                e.dataTransfer.setData('text/plain', e.target.dataset.name);
            });

            assignment.addEventListener('dragend', (e) => {
                e.target.classList.remove('dragging');
            });
        });

        // Add drop zones to existing category sections
        document.querySelectorAll('.category-assignments').forEach(dropZone => {
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('drag-over');
            });

            dropZone.addEventListener('dragleave', (e) => {
                dropZone.classList.remove('drag-over');
            });

            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('drag-over');
                
                const assignmentName = e.dataTransfer.getData('text/plain');
                const newCategory = dropZone.dataset.category;
                
                // Find the assignment and update its category
                const assignment = assignments.find(a => a.name === assignmentName);
                if (assignment && assignment.category !== newCategory) {
                    // Update only the category, keep other properties unchanged
                    assignment.category = newCategory;
                    
                    // Update the UI without creating new categories
                    calculateTotal();
                    updateCategorySummaries();
                }
            });
        });
    }

    // Helper function to calculate category grade
    function calculateCategoryGrade(category) {
        const categoryAssignments = assignments.filter(a => a.category === category);
        if (categoryAssignments.length === 0) return 0;
        
        const totalScore = categoryAssignments.reduce((sum, a) => sum + a.score, 0);
        const totalPoints = categoryAssignments.reduce((sum, a) => sum + a.total, 0);
        
        return (totalScore / totalPoints) * 100;
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

    // Add this function to handle category management
    function showCategoryManager() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        // Get unique categories and their weights
        const categories = Array.from(new Set(assignments.map(a => a.category)))
            .map(category => ({
                name: category,
                weight: assignments.find(a => a.category === category)?.weight || 0
            }));

        modal.innerHTML = `
            <div class="modal-content">
                <h2>Manage Categories</h2>
                <div class="category-list">
                    ${categories.map(cat => `
                        <div class="category-item-manage" data-category="${cat.name}">
                            <span>${cat.name}</span>
                            <div class="category-actions">
                                <input type="number" class="category-weight-input" value="${cat.weight}" min="0" max="100">
                                <button class="delete-category-btn delete-btn">Delete</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="add-category-section">
                    <input type="text" id="newCategoryName" placeholder="New Category Name">
                    <input type="number" id="newCategoryWeight" placeholder="Weight %" min="0" max="100">
                    <button id="addNewCategory">Add Category</button>
                </div>
                <div class="modal-buttons">
                    <button id="cancelCategories">Cancel</button>
                    <button id="saveCategories">Save Changes</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);

        // Add event listeners
        modal.querySelector('#addNewCategory').onclick = () => {
            const name = modal.querySelector('#newCategoryName').value;
            const weight = parseFloat(modal.querySelector('#newCategoryWeight').value);
            
            if (name && !isNaN(weight)) {
                const categoryList = modal.querySelector('.category-list');
                const newCategoryHtml = `
                    <div class="category-item-manage" data-category="${name}">
                        <span>${name}</span>
                        <div class="category-actions">
                            <input type="number" class="category-weight-input" value="${weight}" min="0" max="100">
                            <button class="delete-category-btn delete-btn">Delete</button>
                        </div>
                    </div>
                `;
                categoryList.insertAdjacentHTML('beforeend', newCategoryHtml);
                
                // Clear inputs
                modal.querySelector('#newCategoryName').value = '';
                modal.querySelector('#newCategoryWeight').value = '';
            }
        };

        // Handle category deletion
        modal.querySelectorAll('.delete-category-btn').forEach(btn => {
            btn.onclick = (e) => {
                const categoryItem = e.target.closest('.category-item-manage');
                const categoryName = categoryItem.dataset.category;
                
                if (confirm(`Delete category "${categoryName}"? This will delete all assignments in this category.`)) {
                    // Remove assignments in this category
                    assignments = assignments.filter(a => a.category !== categoryName);
                    categoryItem.remove();
                    calculateTotal();
                    updateCategorySummaries();
                }
            };
        });

        // Save changes
        modal.querySelector('#saveCategories').onclick = () => {
            const categoryItems = modal.querySelectorAll('.category-item-manage');
            categoryItems.forEach(item => {
                const categoryName = item.dataset.category;
                const newWeight = parseFloat(item.querySelector('.category-weight-input').value);
                
                // Update weights for all assignments in this category
                assignments.forEach(assignment => {
                    if (assignment.category === categoryName) {
                        assignment.weight = newWeight;
                    }
                });
            });
            
            calculateTotal();
            updateCategorySummaries();
            modal.remove();
        };

        modal.querySelector('#cancelCategories').onclick = () => modal.remove();
    }

    // Add the event listener for the manage categories button
    document.getElementById('manageCategories').addEventListener('click', showCategoryManager);

    initializeCategoryManagement();
});