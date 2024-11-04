$(document).ready(function() {
    const weights = [];
    console.log("Document is ready.");

    // Show Tab Function
    function showTab(tabName) {
        $('.tab-button').removeClass('active');
        $(`#${tabName}Button`).addClass('active');
        
        if (tabName === 'manual') {
            $('#manualSection').show();
            $('#canvasSection').hide();
        } else {
            $('#manualSection').hide();
            $('#canvasSection').show();
        }
    }

    // Event Listeners for Tabs
    $('#manualButton').on('click', () => showTab('manual'));
    $('#canvasButton').on('click', () => showTab('canvas'));

    // Process Canvas results
    $('#processCanvas').on('click', function() {
        const content = $('#canvasInput').val();
        
        const categories = {};
        
        // Regex pattern to match categories and grades
        const categoryPattern = /([A-Za-z\s]+)\s+(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/g;
        let match;
        
        while ((match = categoryPattern.exec(content)) !== null) {
            const categoryName = match[1].trim();
            const earned = parseFloat(match[2]);
            const total = parseFloat(match[3]);
    
            if (total > 0) {
                if (!categories[categoryName]) {
                    categories[categoryName] = {
                        assignments: [],
                        totalEarned: 0,
                        totalPossible: 0
                    };
                }
                
                categories[categoryName].assignments.push({
                    earned,
                    total,
                    percentage: (earned / total * 100).toFixed(2)
                });

                categories[categoryName].totalEarned += earned;
                categories[categoryName].totalPossible += total;
            }
        }
        
        // Process total percentage, if available
        const totalMatch = /Total:\s*(\d+(?:\.\d+)?%)/i.exec(content);
        const totalPercentage = totalMatch ? totalMatch[1] : "N/A";
        
        let output = '';

        // Display each category with its assignments
        Object.entries(categories).forEach(([name, data]) => {
            output += `<strong>${name}:</strong><br>`;
            data.assignments.forEach(assignment => {
                output += `&nbsp;&nbsp;- ${assignment.earned} / ${assignment.total} (${assignment.percentage}%)<br>`;
            });
            output += `Total Earned: ${data.totalEarned.toFixed(2)} / ${data.totalPossible.toFixed(2)}<br>`;
            output += `Category Percentage: ${(data.totalEarned / data.totalPossible * 100).toFixed(2)}%<br><br>`;
        });

        // Append overall total
        output += `<strong>Total: ${totalPercentage}</strong>`;
        
        $('#result').html(output);
    });

    // Add Weight
    $('#addWeight').on('click', function() {
        const weightName = $('#weightName').val();
        const weightPercent = parseFloat($('#weightPercent').val());

        if (weightName && !isNaN(weightPercent) && weightPercent > 0) {
            weights.push({ name: weightName, percent: weightPercent });
            $('#weightList').append(`<li>${weightName} - ${weightPercent}%</li>`);
            $('.weightSelect').each(function() {
                $(this).append(`<option value="${weightName}">${weightName}</option>`);
            });
            $('#weightName').val('');
            $('#weightPercent').val('');
        } else {
            alert('Please enter a valid weight name and percent.');
        }
    });

    // Add Grade
    $('#addGrade').on('click', function() {
        $('#gradesContainer').append(`
            <div class="grade-input">
                <input type="text" class="gradeNameField" placeholder="Assignment Name">
                <input type="text" class="gradeField" placeholder="Score (e.g. 29/30)">
                <select class="weightSelect">
                    <option value="">Select Weight</option>
                    ${weights.map(w => `<option value="${w.name}">${w.name}</option>`).join('')}
                </select>
            </div>
        `);
    });

    function parseFraction(input) {
        if (!input || input.trim() === '') return NaN;
        if (!isNaN(input)) return parseFloat(input);

        const parts = input.split('/');
        if (parts.length === 2) {
            const numerator = parseFloat(parts[0].trim());
            const denominator = parseFloat(parts[1].trim());
            
            if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
                return {
                    percentage: (numerator / denominator) * 100,
                    earned: numerator,
                    total: denominator
                };
            }
        }
        return NaN;
    }

    $('#gradeForm').on('submit', function(event) {
        event.preventDefault();
    
        const categories = {};
        let finalGrade = 0;
        let summary = '';
        let allValid = true;
    
        $('.gradeField').each(function(index) {
            const assignmentName = $('.gradeNameField').eq(index).val().trim();
            const gradeInput = $(this).val().trim();
            const weightName = $('.weightSelect').eq(index).val();
    
            if (!gradeInput || !weightName) {
                alert('Please fill out the grade and weight for each entry.');
                allValid = false;
                return false;
            }
    
            const score = parseFraction(gradeInput);
            if (!score || typeof score !== 'object') {
                alert(`Invalid grade format: "${gradeInput}". Please use a fraction (e.g. 29/30)`);
                allValid = false;
                return false;
            }
    
            if (!categories[weightName]) {
                categories[weightName] = {
                    grades: [],
                    totalEarned: 0,
                    totalPossible: 0
                };
            }
    
            categories[weightName].grades.push({
                name: assignmentName,
                score: score
            });
            categories[weightName].totalEarned += score.earned;
            categories[weightName].totalPossible += score.total;
        });
    
        if (!allValid) return;
    
        Object.entries(categories).forEach(([name, data]) => {
            if (data.totalPossible > 0) {
                const categoryPercentage = (data.totalEarned / data.totalPossible) * 100;
                summary += `<strong>${name}:</strong><br>Assignments:<br>`;
    
                data.grades.forEach(grade => {
                    summary += `&nbsp;&nbsp;- ${grade.name}: ${grade.score.earned}/${grade.score.total} (${((grade.score.earned / grade.score.total) * 100).toFixed(2)}%)<br>`;
                });
    
                summary += `Total Earned: ${data.totalEarned.toFixed(2)} / ${data.totalPossible.toFixed(2)}<br>`;
                summary += `Category Percentage: ${categoryPercentage.toFixed(2)}%<br><br>`;
                finalGrade += categoryPercentage;
            }
        });
    
        $('#result').html(summary);
    });    
});