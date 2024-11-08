$(document).ready(function() {
    $('#canvasButton').on('click', function() {
        $('#canvasSection').css('display', 'block');
        $('#manualSection').css('display', 'none');
    });

    $('#manualButton').on('click', function() {
        $('#manualSection').css('display', 'block');
        $('#canvasSection').css('display', 'none');
    });

    $('#processCanvas').on('click', function() {
        const content = $('#canvasInput').val();
        const categories = {};
        const categoryPattern = /(\w+)\s*\*\*\d+% of Total\*\*/g;
        const assignmentPattern = /\*\s*(.+?)\s+.*?(\d+)\/(\d+)\s+pts/g;

        let match;

        // Detect categories and weights
        while ((match = categoryPattern.exec(content)) !== null) {
            const category = match[1];
            const weight = parseInt(match[2], 10);
            categories[category] = { weight, assignments: [] };
        }

        // Detect assignments and their scores
        while ((match = assignmentPattern.exec(content)) !== null) {
            const assignmentName = match[1].trim();
            const scoreEarned = parseInt(match[2], 10);
            const scoreTotal = parseInt(match[3], 10);

            // Find the category it belongs to
            const lastCategoryMatch = Object.keys(categories).reverse().find(category => 
                content.indexOf(category) < match.index
            );

            if (lastCategoryMatch) {
                categories[lastCategoryMatch].assignments.push({
                    name: assignmentName,
                    scoreEarned,
                    scoreTotal
                });
            }
        }

        // Calculate grades and display results
        let resultText = "";
        let weightedSum = 0;
        let weightTotal = 0;

        for (const [category, data] of Object.entries(categories)) {
            const { weight, assignments } = data;
            let categoryEarned = 0;
            let categoryPossible = 0;

            resultText += `Category: ${category} (${weight}%)\n`;

            assignments.forEach(assignment => {
                const { name, scoreEarned, scoreTotal } = assignment;
                resultText += `  - ${name}: ${scoreEarned}/${scoreTotal} (${((scoreEarned / scoreTotal) * 100).toFixed(2)}%)\n`;
                categoryEarned += scoreEarned;
                categoryPossible += scoreTotal;
            });

            const categoryAverage = (categoryEarned / categoryPossible) * 100;
            weightedSum += categoryAverage * (weight / 100);
            weightTotal += weight;
            resultText += `Category Average: ${categoryAverage.toFixed(2)}%\n\n`;
        }

        const finalGrade = (weightTotal === 100) ? weightedSum : (weightedSum / weightTotal) * 100;
        resultText += `Final Grade: ${finalGrade.toFixed(2)}%`;

        $('#result').text(resultText);
    });
});