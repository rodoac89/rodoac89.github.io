$(document).ready(function() {
    getYear();
    getYearsOldExperience();
});

function getYear() {
    var year = (new Date()).getFullYear();
    $('#yearSpan').text(year);
}

function getYearsOldExperience() {
    var fromYear = 2012;
    var today = parseInt((new Date()).getFullYear());
    var diffYears = today - fromYear;
    $('#yearsOld').text(diffYears);
}