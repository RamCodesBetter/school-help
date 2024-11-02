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
                <input type="text" class="gradeField" placeholder="Enter Grade">
                <select class="weightSelect">
                    <option value="">Select Weight</option>
                    ${weights.map(w => `<option value="${w.name}">${w.name}</option>`).join('')}
                </select>
            </div>
        `);
    });

    $('#gradeForm').on('submit', function(event) {
        event.preventDefault();
        
        // Debug logging
        console.log("Starting grade calculations...");
        
        const categories = {};
        let finalGrade = 0;
        
        // First pass: Group grades by category and log them
        $('.gradeField').each(function(index) {
            const grade = parseFloat($(this).val()) || 0;
            const weightName = $('.weightSelect').eq(index).val();
            const weight = weights.find(w => w.name === weightName)?.percent || 0;
            
            console.log(`Grade entry: ${grade} in category ${weightName} (weight: ${weight}%)`);
            
            if (!categories[weightName]) {
                categories[weightName] = {
                    grades: [],
                    weight: weight
                };
            }
            categories[weightName].grades.push(grade);
        });
        
        // Second pass: Calculate each category's contribution
        Object.entries(categories).forEach(([name, data]) => {
            const categoryAverage = data.grades.reduce((sum, grade) => sum + grade, 0) / data.grades.length;
            const contribution = (categoryAverage * data.weight) / 100;
            console.log(`Category ${name}:`);
            console.log(`- Grades: ${data.grades.join(', ')}`);
            console.log(`- Weight: ${data.weight}%`);
            console.log(`- Average: ${categoryAverage}`);
            console.log(`- Contribution: ${contribution}`);
            finalGrade += contribution;
        });
        
        console.log(`Final grade: ${finalGrade}`);
        
        finalGrade = Math.round(finalGrade * 100) / 100;
        const letterGrade = getNormalGrade(finalGrade);
        
        $('#result').text(`Weighted Average: ${finalGrade}, Letter Grade: ${letterGrade}`);
    });

    function letterToNumber(letter) {
        const letterMapping = {
            'A': 95, 'A-': 90, 'B+': 87, 'B': 85, 'B-': 80,
            'C+': 77, 'C': 75, 'C-': 70, 'D+': 67, 'D': 65, 'F': 50
        };
        return letterMapping[letter] || NaN;
    }

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

    function getNoMinusesGrade(average) {
        if (average >= 90) return 'A';
        else if (average >= 87) return 'B+';
        else if (average >= 80) return 'B';
        else if (average >= 77) return 'C+';
        else if (average >= 70) return 'C';
        else if (average >= 67) return 'D+';
        else if (average >= 60) return 'D';
        else return 'F';
    }

    function getNoPlusesMinusesGrade(average) {
        if (average >= 90) return 'A';
        else if (average >= 80) return 'B';
        else if (average >= 70) return 'C';
        else if (average >= 60) return 'D';
        else return 'F';
    }
});