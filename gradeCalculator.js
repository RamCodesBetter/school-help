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

        let allFieldsFilled = true;
        $('.gradeField').each(function(index) {
            const gradeValue = $(this).val();
            const weightValue = $('.weightSelect').eq(index).val();

            if (!gradeValue || !weightValue) {
                alert('Please fill out both the grade and weight for each entry.');
                allFieldsFilled = false;
                return false;
            }
        });

        if (!allFieldsFilled) return;

        const gradingScale = $('#gradingScale').val();
        let totalWeightedScore = 0;
        let totalWeight = 0;

        $('.gradeField').each(function(index) {
            const gradeInput = $(this).val().toUpperCase();
            const weightName = $('.weightSelect').eq(index).val();
            const weightPercent = weights.find(w => w.name === weightName)?.percent || 0;
            const gradeValue = isNaN(gradeInput) ? letterToNumber(gradeInput) : Number(gradeInput);

            if (!isNaN(gradeValue) && weightPercent > 0) {
                totalWeightedScore += gradeValue * (weightPercent / 100);
                totalWeight += weightPercent;
            }
        });

        const average = totalWeight ? totalWeightedScore / (totalWeight / 100) : 0;
        let letterGrade = '';
        
        if (gradingScale === 'normal') {
            letterGrade = getNormalGrade(average);
        } else if (gradingScale === 'noMinuses') {
            letterGrade = getNoMinusesGrade(average);
        } else if (gradingScale === 'noPlusesMinuses') {
            letterGrade = getNoPlusesMinusesGrade(average);
        }

        $('#result').text(`Weighted Average: ${average.toFixed(2)}, Letter Grade: ${letterGrade}`);
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