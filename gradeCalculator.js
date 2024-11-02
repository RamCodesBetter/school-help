$(document).ready(function() {
    const weights = [];

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
    $('#manualButton').on('click', function() {
        showTab('manual');
    });

    $('#canvasButton').on('click', function() {
        showTab('canvas');
    });

    // Process Canvas Grades
    $('#processCanvas').on('click', function() {
        const content = $('#canvasInput').val();
        const categories = {};
        const categoryPattern = /(Assignments|Formative|Summative|Homework)\s+(?:\d+(?:\.\d+)?%\s+)?(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/g;
        let match;
        
        while ((match = categoryPattern.exec(content)) !== null) {
            const categoryName = match[1];
            const earned = parseFloat(match[2]);
            const total = parseFloat(match[3]);
            
            if (total > 0) {
                categories[categoryName] = {
                    earned,
                    total,
                    percentage: (earned / total * 100).toFixed(2)
                };
            }
        }
        
        const totalMatch = /Total:\s*(\d+(?:\.\d+)?%)/i.exec(content);
        const totalPercentage = totalMatch ? totalMatch[1] : "N/A";
        
        let output = '';
        $.each(categories, function(name, data) {
            if (name !== 'Assignments') {
                output += `${name}:\n`;
                output += `${data.percentage}%\n`;
                output += `${data.earned.toFixed(2)} / ${data.total.toFixed(2)}\n\n`;
            }
        });
        
        output += `Total: ${totalPercentage}`;
        $('#result').text(output);
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

    // Grade Calculation
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
                    weight: weights.find(w => w.name === weightName)?.percent || 0,
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
            const categoryPercentage = (data.totalEarned / data.totalPossible) * 100;
            const contribution = categoryPercentage * (data.weight / 100);
            
            summary += `${name}:\n`;
            summary += `${categoryPercentage.toFixed(2)}%\n`;
            summary += `${data.totalEarned.toFixed(2)} / ${data.totalPossible.toFixed(2)}\n\n`;
            
            finalGrade += contribution;
        });

        finalGrade = Number(finalGrade.toFixed(2));
        
        summary += `Total: ${finalGrade}%`;
        
        $('#result').html(summary.replace(/\n/g, '<br>'));
    });
});