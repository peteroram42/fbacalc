function cmToIn(inArray) {
    let newArr = [];
    for (let x = 0; x < inArray.length; x++) {
        newArr[x] = inArray[x] * .393701;
    }
    return newArr;
}

function gToLb(weight) {
    return weight * .00220462;
}

function ozToLb(weight) {
    return weight * .0625;
}

function determineCategory(value, array) {
    if (value > array[array.length-1]) return array.length-1; 
    for (let x = 0; x < array.length; x++) {
        if (value <= array[x]) return x;
    }
}

function usdformatter(value) {
    var USDFormat = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    });
    return USDFormat.format(value)
}
