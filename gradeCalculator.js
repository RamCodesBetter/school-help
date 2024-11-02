$(document).ready(function() {
    const weights = [];

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

        // Validate and collect all grades
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

        // Build summary in the requested format
        Object.entries(categories).forEach(([name, data]) => {
            const categoryPercentage = (data.totalEarned / data.totalPossible) * 100;
            const contribution = categoryPercentage * (data.weight / 100);
            
            summary += `**${name}** **${categoryPercentage.toFixed(2)}%** **${data.totalEarned.toFixed(2)} / ${data.totalPossible.toFixed(2)}**  `;
            
            finalGrade += contribution;
        });

        finalGrade = Number(finalGrade.toFixed(2));
        
        summary += `**Total** **${finalGrade}%**`;
        
        $('#result').html(summary.replace(/\*\*/g, '').replace(/  /g, '<br>'));
    });
});