$(document).ready(function() {
    const weights = [];
    const categories = {};

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

    $('#manualButton').on('click', function() {
        showTab('manual');
    });

    $('#canvasButton').on('click', function() {
        showTab('canvas');
    });

    $('#processCanvas').on('click', function() {
        const content = $('#canvasInput').val();
        const categoryPattern = /([A-Za-z\s]+)\s+(\d+(?:\.\d+)?%)\s+(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/g;
        let match;
        
        while ((match = categoryPattern.exec(content)) !== null) {
            const categoryName = match[1].trim();
            const earned = parseFloat(match[2]);
            const total = parseFloat(match[3]);
            categories[categoryName] = { earned, total, percentage: (earned / total * 100).toFixed(2) };
        }
    });

    $('#addWeight').on('click', function() {
        const weightName = $('#weightName').val();
        const weightPercent = parseFloat($('#weightPercent').val());
        if (weightName && !isNaN(weightPercent) && weightPercent > 0) {
            weights.push({ name: weightName, percent: weightPercent });
            $('#weightList').append(`<li>${weightName} - ${weightPercent}%</li>`);
            $('#categorySelect').append(`<option value="${weightName}">${weightName}</option>`);
            $('#weightName').val('');
            $('#weightPercent').val('');
        }
    });

    $('#addGrade').on('click', function() {
        const assignmentName = $('.gradeNameField').val();
        const gradeInput = $('.gradeField').val();
        const weightName = $('.weightSelect').val();
        if (!categories[weightName]) categories[weightName] = [];
        categories[weightName].push({ name: assignmentName, score: gradeInput });
        renderCategories();
    });

    function renderCategories() {
        $('#categoryContainer').empty();
        for (const [weightName, assignments] of Object.entries(categories)) {
            const assignmentList = assignments.map(a => `<div class="assignment">${a.name} - ${a.score}</div>`).join('');
            $('#categoryContainer').append(`<div class="category"><div class="category-header">${weightName}</div><div class="assignment-list">${assignmentList}</div></div>`);
        }
    }

    $('#gradeForm').on('submit', function(event) {
        event.preventDefault();
        let finalGrade = 0;
        Object.entries(categories).forEach(([name, data]) => {
            const categoryPercentage = (data.earned / data.total) * 100;
            const contribution = categoryPercentage * (data.weight / 100);
            finalGrade += contribution;
        });
        $('#finalGrade').text(`Total: ${finalGrade.toFixed(2)}%`);
    });
});