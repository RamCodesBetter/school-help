$(document).ready(function() {
    const weights = [];
    const categories = {}; // Moved categories outside to be accessible globally
    console.log("Document is ready.");

    function showTab(tabName) {
        console.log(`Switching to tab: ${tabName}`);
        $('.tab-button').removeClass('active');
        $(`#${tabName}Button`).addClass('active');

        if (tabName === 'manual') {
            $('#manualSection').show();
            $('#canvasSection').hide();
            console.log("Showing manual section.");
        } else {
            $('#manualSection').hide();
            $('#canvasSection').show();
            console.log("Showing canvas section.");
        }
    }

    $('#manualButton').on('click', function() {
        console.log("Manual button clicked.");
        showTab('manual');
    });

    $('#canvasButton').on('click', function() {
        console.log("Canvas button clicked.");
        showTab('canvas');
    });

    $('#processCanvas').on('click', function() {
        const content = $('#canvasInput').val(); 
        console.log("Processing canvas grades with content:", content);

        // Regex to match categories
        const categoryPattern = /([A-Za-z\s]+)\s+(?:\d+(?:\.\d+)?%\s+)?(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/g;
        let match;

        while ((match = categoryPattern.exec(content)) !== null) {
            const categoryName = match[1].trim();
            const earned = parseFloat(match[2]);
            const total = parseFloat(match[3]);
            console.log(`Found category: ${categoryName}, Earned: ${earned}, Total: ${total}`);

            if (total > 0) {
                categories[categoryName] = {
                    earned,
                    total,
                    percentage: (earned / total * 100).toFixed(2),
                    assignments: []
                };
                console.log(`Added category data:`, categories[categoryName]);
            } else {
                console.warn(`Total for category "${categoryName}" is not greater than 0.`);
            }
        }

        // Overall total percentage extraction
        const totalMatch = /Total:\s*(\d+(?:\.\d+)?%)/i.exec(content);
        const totalPercentage = totalMatch ? totalMatch[1] : "N/A";
        console.log(`Overall total percentage found: ${totalPercentage}`);

        displayCategoryResults();

        $('#result').append(`<br>Total: ${totalPercentage}`);
        console.log("Output generated for canvas grades:\n", output);
    });

    // Add Weight
    $('#addWeight').on('click', function() {
        const weightName = $('#weightName').val();
        const weightPercent = parseFloat($('#weightPercent').val());
        console.log("Adding weight:", weightName, weightPercent);

        if (weightName && !isNaN(weightPercent) && weightPercent > 0) {
            weights.push({ name: weightName, percent: weightPercent });
            $('#weightList').append(`<li>${weightName} - ${weightPercent}%</li>`);
            $('.weightSelect').each(function() {
                $(this).append(`<option value="${weightName}">${weightName}</option>`);
            });
            $('#weightName').val('');
            $('#weightPercent').val('');
            console.log(`Weight added successfully: ${weightName} - ${weightPercent}%`);
        } else {
            console.error('Invalid weight input.');
            alert('Please enter a valid weight name and percent.');
        }
    });

    // Add Grade
    $('#addGrade').on('click', function() {
        console.log("Adding a new grade input.");
        $('#gradesContainer').append(`
            <div class="grade-input">
                <input type="text" class="gradeNameField" placeholder="Assignment Name">
                <input type="text" class="gradeField" placeholder="Score (e.g. 29/30)">
                <select class="weightSelect">
                    <option value="">Select Weight</option>
                    ${weights.map(w => `<option value="${w.name}">${w.name}</option>`).join('')}
                </select>
                <button type="button" class="addAssignment">Add Assignment</button>
            </div>
        `);
    });

    // Add assignment to category
    $(document).on('click', '.addAssignment', function() {
        const parentDiv = $(this).closest('.grade-input');
        const assignmentName = parentDiv.find('.gradeNameField').val().trim();
        const gradeInput = parentDiv.find('.gradeField').val().trim();
        const weightName = parentDiv.find('.weightSelect').val();

        if (!assignmentName || !gradeInput || !weightName) {
            alert('Please fill out assignment name, grade, and select weight.');
            return;
        }

        const score = parseFraction(gradeInput);
        if (!score || typeof score !== 'object') {
            alert(`Invalid grade format: "${gradeInput}". Please use a fraction (e.g. 29/30)`);
            return;
        }

        if (!categories[weightName]) {
            categories[weightName] = { assignments: [], totalEarned: 0, totalPossible: 0 };
        }

        categories[weightName].assignments.push({
            name: assignmentName,
            earned: score.earned,
            total: score.total,
            percentage: score.percentage.toFixed(2)
        });

        categories[weightName].totalEarned += score.earned;
        categories[weightName].totalPossible += score.total;

        displayCategoryResults();
    });

    function displayCategoryResults() {
        let output = '';
        Object.entries(categories).forEach(([name, data]) => {
            output += `${name}:\n`;
            data.assignments.forEach(assignment => {
                output += `- ${assignment.name}: ${assignment.percentage}% (${assignment.earned} / ${assignment.total})\n`;
            });
            const categoryPercentage = (data.totalEarned / data.totalPossible) * 100;
            output += `Total: ${categoryPercentage.toFixed(2)}%\n\n`;
        });
        $('#result').html(output.replace(/\n/g, '<br>'));
    }

    function parseFraction(input) {
        console.log(`Parsing fraction from input: "${input}"`);
        if (!input || input.trim() === '') return NaN;
        if (!isNaN(input)) return parseFloat(input);

        const parts = input.split('/');
        if (parts.length === 2) {
            const numerator = parseFloat(parts[0].trim());
            const denominator = parseFloat(parts[1].trim());

            if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
                console.log(`Parsed fraction: ${numerator}/${denominator}`);
                return {
                    percentage: (numerator / denominator) * 100,
                    earned: numerator,
                    total: denominator
                };
            }
        }
        console.warn(`Failed to parse fraction for input: "${input}"`);
        return NaN;
    }

    // Grade Calculation
    $('#gradeForm').on('submit', function(event) {
        event.preventDefault();
        console.log("Calculating grades...");

        let finalGrade = 0;
        let summary = '';

        Object.entries(categories).forEach(([name, data]) => {
            const categoryPercentage = (data.totalEarned / data.totalPossible) * 100;
            const contribution = categoryPercentage * (weights.find(w => w.name === name)?.percent / 100 || 0);

            summary += `${name}:\n`;
            summary += `${categoryPercentage.toFixed(2)}%\n`;
            summary += `${data.totalEarned.toFixed(2)} / ${data.totalPossible.toFixed(2)}\n\n`;

            finalGrade += contribution;
            console.log(`Category "${name}" contributes ${contribution.toFixed(2)}% to final grade.`);
        });

        finalGrade = Number(finalGrade.toFixed(2));
        summary += `Total: ${finalGrade}%`;
        console.log("Final grade calculated:", finalGrade);
        
        $('#result').html(summary.replace(/\n/g, '<br>'));
    });
});