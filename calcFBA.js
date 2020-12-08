document.addEventListener('DOMContentLoaded', function() {
    var calcButton = document.getElementById("calcButton");
    calcButton.addEventListener("click", function() {
        var length = document.getElementById('length').value;
        var width = document.getElementById('width').value;
        var height = document.getElementById('height').value;
        var radGrp1 = document.getElementsByName('lengthMeasure');
        for (let i = 0; i < radGrp1.length; i++) {
            if (radGrp1[i].checked) var lenMeasure = radGrp1[i].value;
        }
        var weight = document.getElementById('weight').value;
        var radGrp2 = document.getElementsByName('weightMeasure');
        for (let i = 0; i < radGrp2.length; i++) {
            if (radGrp2[i].checked) var weightMeasure = radGrp2[i].value;
        }
        var data = determineFBA(length, width, height, lenMeasure, weight, weightMeasure);
        document.getElementById("tieroutput").innerHTML = data["tier"];
        document.getElementById("fbaoutput").innerHTML = usdformatter(data["fba"]);
    });
});

function getCost(category, unitWeight) {
    let costData = [];
    let fba = 0;
    let addn = 0;
    let ozToLB = [0, .0625, .125, .1875, .25, .3125, .375, .4375, .5, .5625, .625, .6875, .75, .8125, .875, .9375, 1];
    unitWeight = parseFloat(unitWeight);
    switch(category) {
        case 0: // small standard
            unitWeight += .25; // in this category Amazon adds 4 oz for packaging.
            // if under a pound, round up to next oz - Amazon does that
            if (unitWeight < 1) unitWeight = ozToLB[determineCategory(unitWeight, ozToLB)];
            if (unitWeight <= .625) {
                fba = 2.50;
            } else {
                fba = 2.63;
            }
            break;
        case 1: // large standard
            unitWeight += .25; // in this category Amazon adds 4 oz for packaging.
            if (unitWeight < 1) unitWeight = ozToLB[determineCategory(unitWeight, ozToLB)];
            if (unitWeight > 1) unitWeight = Math.ceil(unitWeight);
            if (unitWeight <= .625) {
                fba = 3.31;
            } else if (unitWeight <= 1) {
                fba = 3.48;
            } else if (unitWeight <= 2) {
                fba = 4.90;
            } else if (unitWeight <= 3) {
                fba = 5.42;
            } else if (unitWeight <= 21) {
                fba = ((unitWeight - 3) * .38) + 5.42;
                fba.toFixed(2);
            }
            break;
        case 2: // small oversize
            unitWeight += 1; // in this category Amazon adds 1 lb (16 oz) for packaging.
            unitWeight = Math.ceil(unitWeight);
            addn = ((unitWeight - 2) * .38);
            addn > 0 ? addn = addn : addn = 0;
            fba = 8.26 + addn;
            fba.toFixed(2);
            break;
        case 3: // medium oversize
            unitWeight += 1; // in this category Amazon adds 1 lb (16 oz) for packaging.
            unitWeight = Math.ceil(unitWeight);
            addn = ((unitWeight - 2) * .39);
            addn > 0 ? addn = addn : addn = 0;
            fba = 11.37 + addn;
            fba.toFixed(2);
            break;
        case 4: // large oversize
            unitWeight += 1; // in this category Amazon adds 1 lb (16 oz) for packaging.
            unitWeight = Math.ceil(unitWeight);
            addn = ((unitWeight - 90) * .79);
            addn > 0 ? addn = addn : addn = 0;
            fba = 75.78 + addn;
            fba.toFixed(2);
            break;
        case 5: // special oversize
            unitWeight += 1; // in this category Amazon adds 1 lb (16 oz) for packaging.
            unitWeight = Math.ceil(unitWeight);
            addn = ((unitWeight - 90) * .91);
            addn > 0 ? addn = addn : addn = 0;
            fba = 137.32 + addn;
            fba.toFixed(2);
            break;
    }
    costData["fba"] = fba;
    costData["unitWeight"] = unitWeight;
    return costData;
}

function determineFBA(side1, side2, side3, sideMeasure, weight, weightMeasure) {
    // clear out and define variables
    let costData = [];
    let fba = 0;
    let tier = "";
    let unitWeight = 0;
    let dimWeight = 0;
    let girth = 0;
    let results = [];
    let weightCategories = [0.75, 20, 70, 150, 150, 151];
    let longSideCategories = [15, 18, 60, 108, 108, 109];
    let medSideCategories = [12, 14, 30, 999, 999, 999];
    let shortSideCategories = [0.75, 8, 999, 999, 999, 999];
    let girthCategories = [129, 129, 130, 130, 165, 165];
    let addWeight = [.25, .25, 1, 1, 1, 1];
    let catNames = ["Small Standard", "Large Standard", "Small Oversize", "Medium Oversize", "Large Oversize", "Special Oversize"];

    // create and sort dimentions array - desc
    let dimensions = [side1, side2, side3];
    dimensions.sort(function(a, b){return b-a});

    // convert so we're only dealing with inches and pounds
    if (sideMeasure === "cm") dimensions = cmToIn(dimensions);
    if (weightMeasure === "g") weight = gToLb(weight);
    if (weightMeasure === "oz") weight = ozToLb(weight);

    // fill in girth and dimWeight
    dimWeight = (parseFloat(dimensions[0]) * parseFloat(dimensions[1]) * parseFloat(dimensions[2])) / 139;
    girth = parseFloat(dimensions[0]) + (2 * (parseFloat(dimensions[1]) + parseFloat(dimensions[2])));

    // get categories by type - sees where each measurement fits into which tier - or if using girth
    let weightCat = determineCategory(weight, weightCategories);
    let longCat = determineCategory(dimensions[0], longSideCategories);
    let medCat = determineCategory(dimensions[1], medSideCategories);
    let shortCat = determineCategory(dimensions[2], shortSideCategories);
    let girthCat = determineCategory(girth, girthCategories);
    let tierCategories = [weightCat, longCat, medCat, shortCat, girthCat];
    let overallCategory = Math.max(...tierCategories); // max of these is the tier that it fits into

    // determine if we're going to use dimensional weight or not
    weight = parseFloat(weight);
    if (weight < .75 || overallCategory === 5) {
        unitWeight = weight;
    } else {
        weight > dimWeight ? unitWeight = weight : unitWeight = dimWeight;
    }

    tier = catNames[overallCategory];
    costData = getCost(overallCategory, unitWeight);
    fba = costData["fba"];
    results["finalweight"] = costData["unitWeight"];
    results["tier"] = tier;
    results["fba"] = fba;
    unitWeight > weight ? results["weighedby"] = "Used dimentional weight" : results["weighedby"] = "Used actual weight";
    if (overallCategory > 0) {
        results["lowercat"] = [weightCategories[overallCategory-1], longSideCategories[overallCategory-1], medSideCategories[overallCategory-1], shortSideCategories[overallCategory-1]];
    } else {
        results["lowercat"] = [0,0,0,0];
    }
    console.log(results);
    return results;

}