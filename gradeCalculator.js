$(document).ready(function() {
    $('#manualButton').on('click', function() {
        $('#manualSection').css('display', 'block');
        $('#canvasSection').css('display', 'none');
        $('#manualButton').addClass('active');
        $('#canvasButton').removeClass('active');
    });

    $('#canvasButton').on('click', function() {
        $('#canvasSection').css('display', 'block');
        $('#manualSection').css('display', 'none');
        $('#canvasButton').addClass('active');
        $('#manualButton').removeClass('active');
    });
    
    const weights = [];
    const gradingScales = {
        allGrades: [
            { letter: 'A', min: 93, max: 100 },
            { letter: 'A-', min: 90, max: 92.99 },
            { letter: 'B+', min: 87, max: 89.99 },
            { letter: 'B', min: 83, max: 86.99 },
            { letter: 'B-', min: 80, max: 82.99 },
            { letter: 'C+', min: 77, max: 79.99 },
            { letter: 'C', min: 73, max: 76.99 },
            { letter: 'C-', min: 70, max: 72.99 },
            { letter: 'D+', min: 67, max: 69.99 },
            { letter: 'D', min: 60, max: 66.99 },
            { letter: 'F', min: 0, max: 59.99 }
        ]
    };
    
    let selectedGradingScale = gradingScales.allGrades;

    $('#gradingScaleSelect').on('change', function() {
        const scale = $(this).val();
        selectedGradingScale = gradingScales[scale] || gradingScales.allGrades;
    });

    function getLetterGrade(percentage) {
        for (const grade of selectedGradingScale) {
            if (percentage >= grade.min && percentage <= grade.max) {
                return grade.letter;
            }
        }
        return 'N/A';
    }

    $('#addWeight').on('click', function() {
        const weightName = $('#weightName').val().trim();
        const weightPercent = parseFloat($('#weightPercent').val());

        if (weightName && !isNaN(weightPercent)) {
            weights.push({ name: weightName, percent: weightPercent });
            $('#weightList').append(`<li>${weightName} (${weightPercent}%)</li>`);
            updateWeightDropdown();
        }
    });

    function updateWeightDropdown() {
        const options = weights.map(w => `<option value="${w.name}">${w.name}</option>`).join('');
        $('.weightSelect').each(function() {
            $(this).html(`<option value="">Select Weight</option>${options}`);
        });
    }

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
            if (!score) {
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

            summary += `${name} (${data.weight}%):\n`;
            data.grades.forEach((grade) => {
                const percentage = ((grade.score.earned / grade.score.total) * 100).toFixed(2);
                const letterGrade = getLetterGrade(percentage);
                summary += `&nbsp;&nbsp;${grade.name}: ${letterGrade} ${percentage}% (${grade.score.earned}/${grade.score.total})\n`;
            });
            summary += `&nbsp;&nbsp;Category Grade: ${categoryPercentage.toFixed(2)}%\n\n`;
            
            finalGrade += contribution;
        });

        finalGrade = Number(finalGrade.toFixed(2));
        const finalLetterGrade = getLetterGrade(finalGrade);

        summary += `Total Grade: ${finalGrade}% ${finalLetterGrade}`;
        
        $('#result').html(summary.replace(/\n/g, '<br>'));
    });

    function parseFraction(input) {
        const parts = input.split('/');
        if (parts.length === 2) {
            const numerator = parseFloat(parts[0].trim());
            const denominator = parseFloat(parts[1].trim());
            return denominator !== 0 ? { earned: numerator, total: denominator } : null;
        }
        return null;
    }
});