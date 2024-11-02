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
                <input type="text" class="gradeField" placeholder="Score (e.g. 26/30 or 95)">
                <select class="weightSelect">
                    <option value="">Select Weight</option>
                    ${weights.map(w => `<option value="${w.name}">${w.name}</option>`).join('')}
                </select>
            </div>
        `);
    });

    function parseFraction(input) {
        // Handle empty input
        if (!input || input.trim() === '') return NaN;

        // If it's already a number, return it
        if (!isNaN(input)) return parseFloat(input);

        // Try to parse as a fraction
        const parts = input.split('/');
        if (parts.length === 2) {
            const numerator = parseFloat(parts[0].trim());
            const denominator = parseFloat(parts[1].trim());
            
            // Check for valid numbers
            if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
                return (numerator / denominator) * 100;
            }
        }

        return NaN;
    }

    $('#gradeForm').on('submit', function(event) {
        event.preventDefault();

        const categories = {};
        let finalGrade = 0;

        // Validate and collect all grades
        let allValid = true;
        $('.gradeField').each(function(index) {
            const gradeInput = $(this).val().trim();
            const weightName = $('.weightSelect').eq(index).val();

            if (!gradeInput || !weightName) {
                alert('Please fill out both the grade and weight for each entry.');
                allValid = false;
                return false;
            }

            const percentage = parseFraction(gradeInput);
            if (isNaN(percentage)) {
                alert(`Invalid grade format: "${gradeInput}". Please use either a number (e.g. 95) or a fraction (e.g. 26/30)`);
                allValid = false;
                return false;
            }

            // Group grades by category
            if (!categories[weightName]) {
                categories[weightName] = {
                    grades: [],
                    weight: weights.find(w => w.name === weightName)?.percent || 0
                };
            }
            categories[weightName].grades.push(percentage);
        });

        if (!allValid) return;

        // Calculate final grade
        Object.entries(categories).forEach(([name, data]) => {
            const sum = data.grades.reduce((acc, grade) => acc + grade, 0);
            const average = Number((sum / data.grades.length).toFixed(4));
            const contribution = Number((average * data.weight / 100).toFixed(4));
            
            console.log(`Category ${name}:`);
            console.log(`- Grades: ${data.grades.join(', ')}`);
            console.log(`- Weight: ${data.weight}%`);
            console.log(`- Average: ${average}`);
            console.log(`- Contribution: ${contribution}`);
            
            finalGrade += contribution;
        });

        finalGrade = Number(finalGrade.toFixed(2));
        const letterGrade = getNormalGrade(finalGrade);
        
        $('#result').text(`Weighted Average: ${finalGrade}, Letter Grade: ${letterGrade}`);
    });

    function getNormalGrade(average) {
        if (average >= 93) return 'A';
        else if (average >= 90) return 'A-';
        else if (average >= 87) return 'B+';
        else if (average >= 83) return 'B';
        else if (average >= 80) return 'B-';
        else if (average >= 77) return 'C+';
        else if (average >= 73) return 'C';
        else if (average >= 70) return 'C-';
        else if (average >= 67) return 'D+';
        else if (average >= 60) return 'D';
        else return 'F';
    }
});