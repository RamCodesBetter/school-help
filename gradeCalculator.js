let assignments = [];
let scenarios = [];
let gradeHistory = [];
let gradeChart = null;

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
    const scale = document.getElementById('gradingScale')?.value || 'all';
    return gradingScales[scale](percentage);
}

function calculateTotalForAssignments(assignmentList) {
    let weightedSum = 0;
    let totalWeight = 0;
    
    // Group assignments by category
    const categories = {};
    assignmentList.forEach(assignment => {
        if (!categories[assignment.category]) {
            categories[assignment.category] = {
                assignments: [],
                weight: assignment.weight || 0
            };
        }
        categories[assignment.category].assignments.push(assignment);
    });
    
    // Calculate weighted average for each category
    for (const category in categories) {
        const categoryData = categories[category];
        const categoryAssignments = categoryData.assignments;
        
        if (categoryAssignments.length === 0) continue;
        
        const categoryScore = categoryAssignments.reduce((sum, a) => sum + (a.score || 0), 0);
        const categoryTotal = categoryAssignments.reduce((sum, a) => sum + (a.total || 0), 0);
        const categoryWeight = categoryData.weight;
        
        if (categoryTotal > 0) {
            weightedSum += (categoryScore / categoryTotal) * categoryWeight;
            totalWeight += categoryWeight;
        }
    }
    
    return totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;
}

function calculateTotal(returnOnly = false) {
    const finalGrade = calculateTotalForAssignments(assignments);
    
    if (returnOnly) return finalGrade;
    
    const letterGrade = getLetterGrade(finalGrade);
    const totalGradeSpan = document.getElementById('totalGrade');
    if (totalGradeSpan) {
        totalGradeSpan.textContent = `${finalGrade.toFixed(2)}% (${letterGrade})`;
        updateGradeColor(finalGrade);
    }
}

function updateAnalytics() {
    if (!assignments || assignments.length === 0) {
        console.log('No assignments to analyze');
        return;
    }

    // Filter out assignments without scores
    const completedAssignments = assignments.filter(a => 
        a.score !== undefined && 
        a.score !== null && 
        a.total !== undefined && 
        a.total !== null &&
        a.total > 0
    );

    if (completedAssignments.length === 0) {
        console.log('No completed assignments to analyze');
        return;
    }

    // Calculate assignment grades
    const grades = completedAssignments.map(a => (a.score / a.total) * 100);
    
    const average = grades.reduce((a, b) => a + b) / grades.length;
    const highest = Math.max(...grades);
    const lowest = Math.min(...grades);
    
    // Calculate trend
    const trend = calculateTrend();
    
    console.log('Updating analytics:', {
        average,
        highest,
        lowest,
        trend,
        gradesCount: grades.length
    });

    // Update UI
    document.getElementById('averageGrade').textContent = 
        `${average.toFixed(2)}% (${getLetterGrade(average)})`;
    document.getElementById('highestGrade').textContent = 
        `${highest.toFixed(2)}% (${getLetterGrade(highest)})`;
    document.getElementById('lowestGrade').textContent = 
        `${lowest.toFixed(2)}% (${getLetterGrade(lowest)})`;
    document.getElementById('gradeTrend').innerHTML = getTrendHTML(trend);
    
    updateHistoryDisplay();

    // Update the chart
    if (gradeChart) {
        const completedAssignments = assignments.filter(a => 
            a.score !== undefined && 
            a.total !== undefined &&
            a.total > 0
        ).sort((a, b) => {
            const indexA = gradeHistory.findIndex(h => h.assignment === a.name);
            const indexB = gradeHistory.findIndex(h => h.assignment === b.name);
            return indexA - indexB;
        });

        // Calculate grades and format labels
        const assignmentGrades = completedAssignments.map(a => (a.score / a.total) * 100);
        const assignmentLabels = completedAssignments.map(a => {
            const name = a.name;
            // Truncate and clean up the name
            const maxLength = 12;
            if (name.length > maxLength) {
                return name.substring(0, maxLength) + '...';
            }
            return name;
        });

        // Calculate running overall grade
        const overallGrades = [];
        let runningGrade = 0;
        completedAssignments.forEach((_, index) => {
            const currentAssignments = completedAssignments.slice(0, index + 1);
            runningGrade = calculateTotalForAssignments(currentAssignments);
            overallGrades.push(runningGrade);
        });

        gradeChart.data.labels = assignmentLabels;
        gradeChart.data.datasets[0].data = assignmentGrades;
        gradeChart.data.datasets[1].data = overallGrades;
        
        // Update chart options for better formatting
        gradeChart.options.scales.y.min = 0;
        gradeChart.options.scales.y.max = 100;
        gradeChart.options.scales.x.ticks.maxRotation = 0;
        gradeChart.options.scales.x.ticks.autoSkip = false;
        
        gradeChart.update();
    }
}

function calculateTrend() {
    if (gradeHistory.length < 2) return 'stable';
    
    const recent = gradeHistory.slice(-3);
    const grades = recent.map(h => h.totalGrade);
    
    if (grades.every((g, i) => i === 0 || g >= grades[i - 1])) return 'up';
    if (grades.every((g, i) => i === 0 || g <= grades[i - 1])) return 'down';
    return 'stable';
}

function getTrendHTML(trend) {
    const arrows = {
        up: '<span class="trend-up">↑ Improving</span>',
        down: '<span class="trend-down">↓ Declining</span>',
        stable: '<span class="trend-stable">→ Stable</span>'
    };
    return arrows[trend] || arrows.stable;
}

function initializeCategoryManagement() {
    const categorySummaries = document.getElementById('categorySummaries');
    const sidebar = document.getElementById('categorySidebar');
    
    // Add manage categories button
    const manageCategoriesBtn = document.createElement('button');
    manageCategoriesBtn.textContent = 'Manage Categories';
    manageCategoriesBtn.className = 'manage-categories-btn';
    categorySummaries.parentElement.insertBefore(manageCategoriesBtn, categorySummaries);
    
    // Sidebar controls
    manageCategoriesBtn.addEventListener('click', () => {
        sidebar.classList.add('open');
        updateCategoryList();
    });
    
    document.getElementById('closeSidebar').addEventListener('click', () => {
        sidebar.classList.remove('open');
    });
    
    // Category CRUD operations
    document.getElementById('addCategory').addEventListener('click', createCategory);
}

function updateCategoryList() {
    const categoryList = document.getElementById('categoryList');
    categoryList.innerHTML = '';
    
    const categories = Array.from(new Set(assignments.map(a => a.category)));
    
    categories.forEach(category => {
        const categoryWeight = assignments.find(a => a.category === category)?.weight || 0;
        const categoryItem = document.createElement('div');
        categoryItem.className = 'category-item';
        categoryItem.innerHTML = `
            <div class="category-item-header">
                <span>${category}</span>
                <div class="category-actions">
                    <button class="edit-btn" data-category="${category}">Edit</button>
                    <button class="delete-btn" data-category="${category}">Delete</button>
                </div>
            </div>
            <div class="category-weight">Weight: ${categoryWeight}%</div>
        `;
        
        // Add event listeners for edit and delete
        categoryItem.querySelector('.edit-btn').addEventListener('click', () => editCategory(category));
        categoryItem.querySelector('.delete-btn').addEventListener('click', () => deleteCategory(category));
        
        categoryList.appendChild(categoryItem);
    });
}

function editCategory(categoryName) {
    const category = assignments.find(a => a.category === categoryName);
    if (!category) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Edit Category</h2>
            <div class="category-form">
                <input type="text" id="categoryName" value="${categoryName}" placeholder="Category Name" required>
                <input type="number" id="categoryWeight" value="${category.weight}" placeholder="Weight (%)" min="0" max="100" required>
            </div>
            <div class="modal-buttons">
                <button id="cancelEdit">Cancel</button>
                <button id="confirmEdit">Save Changes</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('#cancelEdit').onclick = () => modal.remove();
    modal.querySelector('#confirmEdit').onclick = () => {
        const newName = modal.querySelector('#categoryName').value.trim();
        const newWeight = parseFloat(modal.querySelector('#categoryWeight').value);
        
        if (!newName || isNaN(newWeight) || newWeight < 0 || newWeight > 100) {
            alert('Please enter valid values');
            return;
        }
        
        // Update all assignments in this category
        assignments.forEach(a => {
            if (a.category === categoryName) {
                a.category = newName;
                a.weight = newWeight;
            }
        });
        
        updateCategorySummaries(true);
        updateCategoryList();
        modal.remove();
    };
}

function deleteCategory(categoryName) {
    if (!confirm(`Are you sure you want to delete the category "${categoryName}" and all its assignments?`)) {
        return;
    }
    
    assignments = assignments.filter(a => a.category !== categoryName);
    updateCategorySummaries(true);
    updateCategoryList();
}

function createCategory() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Create New Category</h2>
            <div class="category-form">
                <input type="text" id="categoryName" placeholder="Category Name" required>
                <input type="number" id="categoryWeight" placeholder="Weight (%)" min="0" max="100" required>
            </div>
            <div class="modal-buttons">
                <button id="cancelCategory">Cancel</button>
                <button id="saveCategory">Create Category</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const cancelBtn = modal.querySelector('#cancelCategory');
    const saveBtn = modal.querySelector('#saveCategory');
    const nameInput = modal.querySelector('#categoryName');
    const weightInput = modal.querySelector('#categoryWeight');
    
    cancelBtn.onclick = () => modal.remove();
    
    saveBtn.onclick = () => {
        const name = nameInput.value.trim();
        const weight = parseFloat(weightInput.value);
        
        if (!name || isNaN(weight) || weight < 0 || weight > 100) {
            alert('Please enter a valid category name and weight (0-100)');
            return;
        }
        
        // Create a new empty category
        const newAssignment = {
            name: 'New Assignment',
            score: 0,
            total: 100,
            category: name,
            weight: weight
        };
        
        assignments.push(newAssignment);
        updateCategorySummaries(true);
        modal.remove();
    };
    
    nameInput.focus();
}

// Add this function to global scope (before calculateTotal)
function updateGradeColor(percentage) {
    const totalGradeSpan = document.getElementById('totalGrade');
    if (!totalGradeSpan) return;
    
    // Create a color gradient from red to green
    const red = percentage < 60 ? 255 : Math.round(255 * (100 - percentage) / 40);
    const green = percentage < 60 ? Math.round(255 * percentage / 60) : 255;
    totalGradeSpan.style.color = `rgb(${red}, ${green}, 0)`;
}

// Add this function before updateCategorySummaries
function initializeDragAndDrop() {
    const categories = document.querySelectorAll('.category-summary');
    
    categories.forEach(category => {
        category.setAttribute('draggable', 'true');
        
        category.addEventListener('dragstart', (e) => {
            e.stopPropagation();
            category.classList.add('dragging');
            e.dataTransfer.setData('text/plain', category.dataset.category);
        });
        
        category.addEventListener('dragend', () => {
            category.classList.remove('dragging');
        });
        
        category.addEventListener('dragover', (e) => {
            e.preventDefault();
            const draggingCategory = document.querySelector('.dragging');
            if (!draggingCategory || draggingCategory === category) return;
            
            const categories = [...document.querySelectorAll('.category-summary')];
            const currentPos = categories.indexOf(draggingCategory);
            const newPos = categories.indexOf(category);
            
            if (currentPos < newPos) {
                category.parentNode.insertBefore(draggingCategory, category.nextSibling);
            } else {
                category.parentNode.insertBefore(draggingCategory, category);
            }
        });
    });
    
    // Add drag and drop for assignments within categories
    const assignmentDetails = document.querySelectorAll('.assignment-detail');
    const dropZones = document.querySelectorAll('.category-assignments');
    
    assignmentDetails.forEach(assignment => {
        assignment.setAttribute('draggable', 'true');
        
        assignment.addEventListener('dragstart', (e) => {
            e.stopPropagation();
            assignment.classList.add('dragging');
            e.dataTransfer.setData('text/plain', assignment.dataset.name);
        });
        
        assignment.addEventListener('dragend', () => {
            assignment.classList.remove('dragging');
            dropZones.forEach(zone => zone.classList.remove('drag-over'));
        });
    });
    
    dropZones.forEach(zone => {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('drag-over');
        });
        
        zone.addEventListener('dragleave', () => {
            zone.classList.remove('drag-over');
        });
        
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('drag-over');
            
            const assignmentName = e.dataTransfer.getData('text/plain');
            const newCategory = zone.closest('.category-summary').dataset.category;
            const assignment = assignments.find(a => a.name === assignmentName);
            
            if (assignment && assignment.category !== newCategory) {
                assignment.category = newCategory;
                calculateTotal();
                updateCategorySummaries(true);
            }
        });
    });
}

function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

function updateHistoryDisplay() {
    const container = document.getElementById('historyContainer');
    if (!container) return;
    
    const recentHistory = gradeHistory.slice(-5).reverse();
    
    container.innerHTML = recentHistory.map(h => `
        <div class="history-item">
            <div>
                <strong>${h.assignment}</strong>
                <span>${h.oldScore} → ${h.newScore} points</span>
            </div>
            <span class="date">${formatDate(h.date)}</span>
        </div>
    `).join('');
}

function trackGradeChange(assignment, oldScore, newScore) {
    gradeHistory.push({
        date: new Date(),
        assignment: assignment.name,
        oldScore: oldScore,
        newScore: newScore,
        totalGrade: calculateTotal(true)
    });
    updateAnalytics();
}

document.addEventListener('DOMContentLoaded', () => {
    const addAssignmentBtn = document.getElementById('addAssignment');
    const totalGradeSpan = document.getElementById('totalGrade');
    const newScenarioBtn = document.getElementById('newScenario');

    initializeCategoryManagement();

    function createScenario() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Create New Scenario</h2>
                <div class="scenario-form">
                    <input type="text" id="scenarioName" placeholder="Scenario Name">
                    <div class="remaining-assignments">
                        ${getRemainingAssignmentsHTML()}
                    </div>
                </div>
                <div class="modal-buttons">
                    <button id="cancelScenario">Cancel</button>
                    <button id="saveScenario">Save Scenario</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setupScenarioListeners(modal);
    }

    newScenarioBtn.addEventListener('click', createScenario);

    const themeToggle = document.getElementById('themeToggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

    // Set initial theme
    document.documentElement.setAttribute('data-theme', 
        localStorage.getItem('theme') || 'light'
    );

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Update icon
        themeToggle.querySelector('.theme-icon').textContent = 
        document.documentElement.getAttribute('data-theme') === 'light' ? '🌙' : '☀️';
    });

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

    document.getElementById('processPaste').addEventListener('click', async () => {
        const button = document.getElementById('processPaste');
        const textarea = document.getElementById('canvasPaste');

        if (!textarea.value) {
            alert('Please paste your Canvas grades first!');
            return;
        }

        // Add loading state
        button.classList.add('loading');
        button.disabled = true;
        button.textContent = 'Processing...';
        
        // Add progress bar
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        button.parentElement.appendChild(progressBar);
        
        try {
            progressBar.style.transform = 'scaleX(0.3)';
            await new Promise(resolve => setTimeout(resolve, 100));
            
            assignments = parseCanvasGrades(textarea.value);
            console.log('Parsed assignments:', assignments);
            
            progressBar.style.transform = 'scaleX(0.6)';
            await new Promise(resolve => setTimeout(resolve, 100));
            
            calculateTotal();
            updateCategorySummaries();
            updateAnalytics();
            
            progressBar.style.transform = 'scaleX(1)';
            button.classList.remove('loading');
            button.classList.add('highlight-success');
            button.textContent = 'Success!';
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error('Error processing grades:', error);
            button.classList.remove('loading');
            button.classList.add('highlight-error');
            button.textContent = 'Error processing grades';
        } finally {
            setTimeout(() => {
                button.disabled = false;
                button.classList.remove('highlight-success', 'highlight-error');
                button.textContent = 'Process Canvas Grades';
                progressBar.remove();
            }, 1500);
        }
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

    function updateCategorySummaries(maintainState = false) {
        const container = document.getElementById('categorySummaries');
        const expandedCategories = maintainState ? 
            Array.from(container.querySelectorAll('details[open]')).map(el => el.dataset.category) : [];
        
        container.innerHTML = '';

        const uniqueCategories = [...new Set(assignments.map(a => a.category))];

        uniqueCategories.forEach(category => {
            const categoryAssignments = assignments.filter(a => a.category === category);
            const categoryData = {
                totalScore: categoryAssignments.reduce((sum, a) => sum + a.score, 0),
                totalPoints: categoryAssignments.reduce((sum, a) => sum + a.total, 0),
                weight: categoryAssignments[0]?.weight || 0
            };

            const percentage = (categoryData.totalScore / categoryData.totalPoints) * 100;
            const letterGrade = getLetterGrade(percentage);

            const categoryDiv = document.createElement('details');
            categoryDiv.className = 'category-summary';
            categoryDiv.dataset.category = category;
            
            if (maintainState && expandedCategories.includes(category)) {
                categoryDiv.open = true;
            }
            
            categoryDiv.innerHTML = `
                <summary class="category-header">
                    <div class="category-info">
                        <span class="category-name">${category}</span>
                        <span class="category-grade">${percentage.toFixed(2)}% (${letterGrade})</span>
                    </div>
                </summary>
                <div class="category-details">
                    <p>Weight: ${categoryData.weight}%</p>
                    <p>Points: ${categoryData.totalScore}/${categoryData.totalPoints}</p>
                    <div class="category-assignments" data-category="${category}">
                        ${categoryAssignments.map(assignment => {
                            const assignmentPercentage = (assignment.score / assignment.total) * 100;
                            const assignmentLetterGrade = getLetterGrade(assignmentPercentage);
                            return `
                                <div class="assignment-detail" draggable="true" data-name="${assignment.name}" data-category="${category}">
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
                        }).join('')}
                    </div>
                </div>
            `;
            
            container.appendChild(categoryDiv);
        });

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

        initializeDragAndDrop();

        // Restore expanded state
        if (maintainState) {
            expandedCategories.forEach(category => {
                const details = container.querySelector(`details[data-category="${category}"]`);
                if (details) details.open = true;
            });
        }
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
            const name = modal.querySelector('#assignmentName').value;
            const score = parseFloat(modal.querySelector('#assignmentScore').value);
            const total = parseFloat(modal.querySelector('#assignmentTotal').value);
            const category = modal.querySelector('#categorySelect').value;
            
            if (name && !isNaN(score) && !isNaN(total)) {
                const assignment = {
                    name: name,
                    score: score,
                    total: total,
                    category: category
                };
                assignments.push(assignment);
                trackGradeChange(assignment, 0, score);
                calculateTotal();
                updateCategorySummaries(true);
                modal.remove();
            } else {
                alert('Please fill in all fields correctly');
            }
        };
    });

    // Update the removeAssignment function
    window.removeAssignment = function(name) {
        const assignment = assignments.find(a => a.name === name);
        if (!assignment) return;
        
        assignments = assignments.filter(a => a.name !== name);
        calculateTotal();
        updateCategorySummaries(true);
        updateAnalytics();
    };

    // Update the editAssignment function to use the assignment name instead of index
    window.editAssignment = function(assignmentName) {
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
                <input type="text" id="editName" value="${assignment.name}" placeholder="Assignment Name">
                <div class="score-inputs">
                    <input type="number" id="editScore" value="${assignment.score}" min="0" step="any" placeholder="Score">
                    <span>/</span>
                    <input type="number" id="editTotal" value="${assignment.total}" min="0" step="any" placeholder="Total Points">
                </div>
                <div class="current-details">
                    <p>Current Grade: ${((assignment.score/assignment.total)*100).toFixed(2)}% (${getLetterGrade((assignment.score/assignment.total)*100)})</p>
                </div>
                <div class="modal-buttons">
                    <button id="cancelEdit">Cancel</button>
                    <button id="confirmEdit">Save</button>
                </div>
            </div>
        `;
    
        document.body.appendChild(modal);
    
        modal.querySelector('#cancelEdit').onclick = () => modal.remove();
        modal.querySelector('#confirmEdit').onclick = async () => {
            const oldScore = assignment.score;
            const newScore = parseFloat(modal.querySelector('#editScore').value);
            
            if (isNaN(newScore)) {
                alert('Please enter a valid score');
                return;
            }
            
            assignment.score = newScore;
            trackGradeChange(assignment, oldScore, newScore);
            calculateTotal();
            updateCategorySummaries();
            modal.remove();
        };
    };

    // Keep the grading scale change event listener
    document.getElementById('gradingScale').addEventListener('change', () => {
        calculateTotal();
    });

    function getRemainingAssignmentsHTML() {
        // Get assignments with no scores
        const remaining = assignments.filter(a => !a.score || a.score === 0);
        return remaining.map(a => `
            <div class="scenario-assignment">
                <span>${a.name}</span>
                <input type="number" 
                       data-assignment="${a.name}"
                       min="0" 
                       max="${a.total}"
                       placeholder="Expected score">
                <span>/ ${a.total}</span>
            </div>
        `).join('');
    }

    function calculateProjectedGrade(scenarioScores) {
        // Create a deep copy of current assignments
        const projectedAssignments = assignments.map(a => ({...a}));
        
        // Apply scenario scores
        scenarioScores.forEach(score => {
            const assignment = projectedAssignments.find(a => a.name === score.name);
            if (assignment) {
                assignment.score = score.value;
            }
        });

        // Calculate using existing total calculation logic
        return calculateTotalForAssignments(projectedAssignments);
    }

    function calculateMinimumNeeded(targetGrade = 90) {
        const remaining = assignments.filter(a => !a.score || a.score === 0);
        if (remaining.length === 0) return 0;
        
        const totalRemainingPoints = remaining.reduce((sum, a) => sum + a.total, 0);
        const currentTotal = calculateTotal(true);
        
        if (totalRemainingPoints === 0) return 0;
        
        const pointsNeeded = (targetGrade - currentTotal) * totalRemainingPoints / 100;
        const percentageNeeded = (pointsNeeded / totalRemainingPoints) * 100;
        
        return isNaN(percentageNeeded) ? 0 : Math.max(0, percentageNeeded);
    }
    
    // Event Listeners
    document.getElementById('newScenario').addEventListener('click', createScenario);

    document.getElementById('scenarioSelect').addEventListener('change', (e) => {
        const scenario = scenarios.find(s => s.id === e.target.value);
        if (scenario) {
            const projected = calculateProjectedGrade(scenario.scores);
            document.getElementById('projectedGrade').textContent = 
                `${projected.toFixed(2)}% (${getLetterGrade(projected)})`;
        }
    });

    function saveScenario(modal) {
        const name = modal.querySelector('#scenarioName').value;
        const scores = [];
        
        modal.querySelectorAll('.scenario-assignment input').forEach(input => {
            const value = parseFloat(input.value);
            if (!isNaN(value)) {
                scores.push({
                    name: input.dataset.assignment,
                    value: value
                });
            }
        });
        
        const scenario = {
            id: Date.now().toString(),
            name: name,
            scores: scores,
            created: new Date()
        };
        
        scenarios.push(scenario);
        updateScenarioSelect();
        updatePredictions();
        
        modal.remove();
    }

    function updatePredictions() {
        const minNeeded = calculateMinimumNeeded();
        document.getElementById('minGradeNeeded').textContent = 
            minNeeded === 0 ? 'Target achieved!' : `${minNeeded.toFixed(2)}%`;
        
        if (scenarios.length > 0) {
            const latestScenario = scenarios[scenarios.length - 1];
            const projected = calculateProjectedGrade(latestScenario.scores);
            document.getElementById('projectedGrade').textContent = 
                `${projected.toFixed(2)}% (${getLetterGrade(projected)})`;
        }
    }

    function updateScenarioSelect() {
        const select = document.getElementById('scenarioSelect');
        select.innerHTML = '<option value="">Select Scenario</option>' +
            scenarios.map(s => `
                <option value="${s.id}">${s.name}</option>
            `).join('');
    }

    function setupScenarioListeners(modal) {
        // Cancel button listener
        modal.querySelector('#cancelScenario').addEventListener('click', () => {
            modal.remove();
        });

        // Save button listener
        modal.querySelector('#saveScenario').addEventListener('click', () => {
            const name = modal.querySelector('#scenarioName').value;
            if (!name) {
                alert('Please enter a scenario name');
                return;
            }

            const saveBtn = modal.querySelector('#saveScenario');
            saveBtn.classList.add('loading');
            saveBtn.disabled = true;

            try {
                saveScenario(modal);
            } finally {
                saveBtn.classList.remove('loading');
                saveBtn.disabled = false;
            }
        });

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Focus on name input when modal opens
        modal.querySelector('#scenarioName').focus();
    }

    function calculateTotalForAssignments(assignmentList) {
        let weightedSum = 0;
        let totalWeight = 0;
        
        // Group assignments by category
        const categories = {};
        assignmentList.forEach(assignment => {
            if (!categories[assignment.category]) {
                categories[assignment.category] = [];
            }
            categories[assignment.category].push(assignment);
        });
        
        // Calculate weighted average for each category
        for (const category in categories) {
            const categoryAssignments = categories[category];
            if (categoryAssignments.length === 0) continue;
            
            const categoryScore = categoryAssignments.reduce((sum, a) => sum + a.score, 0);
            const categoryTotal = categoryAssignments.reduce((sum, a) => sum + a.total, 0);
            const categoryWeight = categoryAssignments[0].weight;
            
            if (categoryTotal > 0) {
                weightedSum += (categoryScore / categoryTotal) * categoryWeight;
                totalWeight += categoryWeight;
            }
        }
        
        return totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;
    }

    // Add this function to initialize the chart
    function initializeGradeChart() {
        const ctx = document.getElementById('gradeChart').getContext('2d');
        
        gradeChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Assignment Grades',
                    borderColor: '#1976d2',
                    backgroundColor: 'rgba(25, 118, 210, 0.1)',
                    data: [],
                    fill: true,
                    tension: 0.1,
                    pointRadius: 4,                    // Make points larger
                    pointHoverRadius: 6,               // Larger on hover
                    pointBackgroundColor: '#1976d2',   // Match line color
                    pointBorderColor: '#fff',          // White border
                    pointBorderWidth: 2                // Visible border
                }, {
                    label: 'Overall Grade',
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    data: [],
                    fill: true,
                    tension: 0.1,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#28a745',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            callback: value => `${value}%`,
                            stepSize: 20,
                            font: {
                                size: 11
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            autoSkip: true,
                            maxRotation: 45,
                            minRotation: 45,
                            font: {
                                size: 11
                            },
                            padding: 11    // Add more padding between labels
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.dataset.label;
                                const value = context.parsed.y;
                                const letterGrade = getLetterGrade(value);
                                return `${label}: ${value.toFixed(2)}% (${letterGrade})`;
                            }
                        }
                    },
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: {
                                size: 12
                            }
                        }
                    }
                },
                layout: {
                    padding: {
                        left: 10,
                        right: 10,
                        top: 10,
                        bottom: 20    // Extra padding at bottom for labels
                    }
                }
            }
        });
    }

    // Add this to your DOMContentLoaded event listener
    initializeGradeChart();
});