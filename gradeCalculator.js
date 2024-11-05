$(document).ready(function() {
    const weights = [];

    function showTab(tabName) {
        $('.tab-button').removeClass('active');
        $(`#${tabName}Button`).addClass('active');
        $('#manualSection').toggle(tabName === 'manual');
        $('#canvasSection').toggle(tabName !== 'manual');
    }

    $('#manualButton').on('click', function() {
        showTab('manual');
    });

    $('#canvasButton').on('click', function() {
        showTab('canvas');
    });

    $('#processCanvas').on('click', function() {
        const content = $('#canvasInput').val();
        const categories = {};
        const categoryPattern = /([A-Za-z\s]+)\s+(?:\d+(?:\.\d+)?%\s+)?(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/g;
        let match;

        while ((match = categoryPattern.exec(content)) !== null) {
            const categoryName = match[1].trim();
            const earned = parseFloat(match[2]);
            const total = parseFloat(match[3]);

            if (total > 0) {
                if (!categories[categoryName]) {
                    categories[categoryName] = { assignments: [], totalEarned: 0, totalPossible: 0 };
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

        const totalMatch = /Total:\s*(\d+(?:\.\d+)?%)/i.exec(content);
        const totalPercentage = totalMatch ? totalMatch[1] : "N/A";

        let output = '';
        Object.entries(categories).forEach(([name, data]) => {
            output += `${name}:\nAssignments:\n`;
            data.assignments.forEach(assignment => {
                output += `  - Earned: ${assignment.earned} / ${assignment.total} (${assignment.percentage}%)\n`;
            });
            output += `Total Earned: ${data.totalEarned.toFixed(2)} / ${data.totalPossible.toFixed(2)}\n`;
            output += `Category Percentage: ${((data.totalEarned / data.totalPossible) * 100).toFixed(2)}%\n\n`;
        });
        output += `Total: ${totalPercentage}`;
        $('#result').html(output.replace(/\n/g, '<br>'));
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
            return denominator !== 0 ? {
                percentage: (numerator / denominator) * 100,
                earned: numerator,
                total: denominator
            } : NaN;
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
                categories[weightName] = { grades: [], totalEarned: 0, totalPossible: 0 };
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
                summary += `${name}:\nAssignments:\n`;
                data.grades.forEach(grade => {
                    summary += `  - ${grade.name}: ${grade.score.earned}/${grade.score.total} (${((grade.score.earned / grade.score.total) * 100).toFixed(2)}%)\n`;
                });
                summary += `Total Earned: ${data.totalEarned.toFixed(2)} / ${data.totalPossible.toFixed(2)}\n`;
                summary += `Category Percentage: ${categoryPercentage.toFixed(2)}%\n\n`;
                finalGrade += categoryPercentage;
            }
        });

        $('#result').html(summary.replace(/\n/g, '<br>'));
    });
});
