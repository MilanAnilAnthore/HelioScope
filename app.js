const body = document.querySelector('body');
const themeMode = document.querySelector('.themeMode');
const pickerContainer = document.querySelector('.pickerContainer');
const fromDate = document.querySelector('#fromDate');
const endDate = document.querySelector('#endDate');
const pickerSearch = document.querySelector('.pickerSearch');


// Variables
const api = "2RptH3VHc9l03KbmaL2iY9sws37rdlfNyburl0u2";
let retrievedFromDate;
let retrievedEndDate;
let data;


function initializeDate() {

    const today = new Date();
    const thirtyDaysAgo = new Date();

    thirtyDaysAgo.setUTCDate(today.getUTCDate() - 30);

    function formatDate(date) {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`
    }

    const defaultEndDate = formatDate(today);
    const defaultStartDate = formatDate(thirtyDaysAgo);

    fromDate.value = defaultStartDate;
    endDate.value = defaultEndDate;

}

initializeDate();



pickerSearch.addEventListener('click', () => {

    if (endDate.value > fromDate.value) {

        retrievedFromDate = fromDate.value;
        retrievedEndDate = endDate.value;

        getData(retrievedFromDate, retrievedEndDate);
    } else {
        alert('The from date should always be less than end date')
    }

})




async function getData(startDate, toDate) {
    try {
        const response = await fetch(`https://api.nasa.gov/DONKI/FLR?startDate=${startDate}&endDate=${toDate}&api_key=${api}`)
        if (response.ok) {
            data = await response.json();
            allData(data);
        } else {
            throw new Error('Failed to fetch data');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}


function allData() {
    let length = data.length;

}


// // This is for the toggling of theme
// themeMode.addEventListener('click', () => {
//     body.classList.toggle('white')
// })





