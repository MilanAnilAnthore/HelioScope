// General DOM Elements
const body = document.querySelector('body');
const themeMode = document.querySelector('.themeMode');
const loader = document.querySelector('.loader')

// Date DOM Elements
const fromDate = document.querySelector('#fromDate');
const endDate = document.querySelector('#endDate');
const pickerSearch = document.querySelector('.pickerSearch');


// Summary DOM Elements
const totalFlares = document.querySelector('.totalFlares');
const maxIntensityFlare = document.querySelector('.maxIntensityFlare');
const topActiveRegionClass = document.querySelector('.topActiveRegion')
const maxFlarePeakTime = document.querySelector('.maxFlarePeakTime')


// Individual Table Flare Data DOM Elements
const tableBody = document.querySelector('.tableBody');



// API key for fetching data from the NASA DONKI API
const api = "2RptH3VHc9l03KbmaL2iY9sws37rdlfNyburl0u2";

// Variable to store the fetched data
let data;



/**
 * Initializes the date pickers with default values:
 * - `endDate`: today's date
 * - `fromDate`: 30 days prior to today
 */
function initializeDate() {

    const today = new Date();
    const thirtyDaysAgo = new Date();

    // Set the date to 30 days ago
    thirtyDaysAgo.setUTCDate(today.getUTCDate() - 30);

    /**
     * Function to fetch the current utc date.
     * @param date Variable which is passed to fetch the current UTC date
     * @returns the formatted date in YYYY/MM/DD format
     */
    function formatDate(date) {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`
    }

    const defaultEndDate = formatDate(today);
    const defaultFromDate = formatDate(thirtyDaysAgo);

    fromDate.value = defaultFromDate;
    endDate.value = defaultEndDate;

}

// Run the initialization
initializeDate();


// Add click event listener to the search button
pickerSearch.addEventListener('click', () => {

    // Validate that the end date is after the start date
    if (endDate.value > fromDate.value) {

        // Assigning the dates to respective variable for further fetching of data.
        let retrievedFromDate = fromDate.value;
        let retrievedEndDate = endDate.value;

        // Fetch data for the specified date range
        getData(retrievedFromDate, retrievedEndDate);
    } else {
        // alert if the validation fails.
        alert('The from date should always be less than end date')
    }

})



/**
 * Fetches solar flare data from NASA's DONKI API for a given date range
 * @param fromDate The from date selected by the user
 * @param endDate The To date selected by the user
 * @returns data fetched from the DONKI API
 */
async function getData(fromDate, endDate) {
    // try catch to execute fetching and to catch any errors.
    loader.style.display = 'block';
    try {
        const response = await fetch(`https://api.nasa.gov/DONKI/FLR?startDate=${fromDate}&endDate=${endDate}&api_key=${api}`)
        if (response.ok) {
            // if the response is ok the response is turned to a json file.
            data = await response.json();
            let processedFlareData = processFlareData(data);
            summaryInjector(processedFlareData);
            tableInjector(processedFlareData);
            return data;
        } else {
            throw new Error('Failed to fetch data');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        loader.style.display = 'none';
    }
}




/**
 * The function which changes the raw data in a format that would enable users to understand.
 * @param data The json data fetched from the api.
 */
function processFlareData(data) {
    let result = [];
    // let highestPeakTimeMinutes = null;
    // let highestPeakTime;
    let totalFlares = data.length;

    for (let d of data) {


        // Helps to find the highestPeakTime of flare from the set of flares in the data
        // if (d.peakTime) {
        //     const p = new Date(d.peakTime);
        //     let minutes = p.getTime();
        //     if (minutes > highestPeakTimeMinutes) {
        //         highestPeakTimeMinutes = minutes;
        //         highestPeakTime = d.peakTime.slice(11, 16);
        //     }
        // }

        /**
         * Helps to find the duration of each flares
         * If the endTime is null the difference between peakTime and beginTime is taken for duration
         * If the endTime is not null then the difference between endTime and beginTime is used to measure duration.
         */
        let duration;
        if (d.endTime == null) {
            let bt = new Date(d.beginTime);
            let pt = new Date(d.peakTime);
            let btMin = bt.getTime();
            let ptMin = pt.getTime();
            if (ptMin > btMin) {
                let difference = ptMin - btMin;
                duration = milliSecConverter(difference);
            } else {
                duration = "Unknown";
            }
        } else if (d.endTime) {
            let bt = new Date(d.beginTime);
            let et = new Date(d.endTime);
            let btMin = bt.getTime();
            let etMin = et.getTime();
            if (etMin > btMin) {
                let difference = etMin - btMin;
                duration = milliSecConverter(difference);
            } else {
                duration = "Unknown";
            }
        }

        // Extracts the beginTime for flare and if its not available then its assigned null
        let beginTime = d.beginTime ? d.beginTime.slice(11, 16) : null;

        // Extracts the peakTime for flare and if its not available then its assigned null
        let peakTime = d.peakTime ? d.peakTime.slice(11, 16) : null;

        // Extracts the endTime for flare and if its not available then its assigned null
        let endTime = d.endTime ? d.endTime.slice(11, 16) : null;

        // Extracts the intensity for flare and if its not available then its assigned null
        let intensity = d.classType ? d.classType.slice(0, 1) : null;

        /**
         * Extracts the magnitude for flare and parse it from string to float for calculation.
         * If magnitude is not available then its assigned with 0.0 a fall back value.
         */
        let magnitude = d.classType ? parseFloat(d.classType.slice(1)) || 0 : 0;

        // Extracts the instrumentUsed to track the flare.
        let instrumentUsed = d.instruments && d.instruments[0] ? d.instruments[0].displayName : "N/A";

        // Extracts the location of flare and if not available set to unKnown
        let location = d.sourceLocation || "Unknown";

        // Extracts the occuranceTime of flare and if not available set to unKnown
        let occuranceTime = d.flrID ? d.flrID.slice(0, 10) : "Unknown";

        // Extracts the activeRegion of flare and if not available set to null
        let activeRegion = d.activeRegionNum || null;

        // Safely extract an array of activity IDs from linkedEvents if it exists and is an array; otherwise, set to null
        let linkedEvents = Array.isArray(d.linkedEvents)
            ? d.linkedEvents.map(event => event.activityID)
            : null;

        // push the values of flare into an array called result
        result.push({
            beginTime,
            peakTime,
            endTime,
            intensity,
            magnitude,
            instrumentUsed,
            location,
            occuranceTime,
            activeRegion,
            linkedEvents,
            duration
        });


    }

    // SummaryResult of data like peakTime and total flares.
    const summaryResult = {
        totalFlares
    };

    let topActiveRegionResult = topActiveRegion(result);
    let highestIntensityDuration = findMaxIntensity(result);

    return { result, summaryResult, topActiveRegionResult, highestIntensityDuration }
}


/**
 * Function to convert milliseconds to different time formats.
 * @param mls The parameter used to pass the milliseconds to be calculated.
 * @returns The converted millisecond 
 */
function milliSecConverter(mls) {
    let totalSeconds = (mls / 1000).toFixed(1);
    let totalMinutes = (mls / (1000 * 60)).toFixed(1);
    let totalHours = (mls / (1000 * 60 * 60)).toFixed(1);
    let totalDays = (mls / (1000 * 60 * 60 * 24)).toFixed(1);

    if (mls < 60000) {
        return totalSeconds + ' Sec';
    } else if (mls < 3600000) {
        return totalMinutes + ' Min';
    } else if (mls < 216000000) {
        return totalHours + ' Hrs'
    } else {
        return totalDays + ' days'
    }
}

/**
 * function to find the most active region consisting of highest number of flares.
 * @param rsAR Parameter used to receive the data consisting of active regions
 * @returns The highestRecorded region after comparing all the regions in data
 */
function topActiveRegion(rsAR) {
    let regionCount = {};
    let maxCount = 0;
    let highestRecordedAR = null;

    // Using hashmapping for easy comparison between regions.
    for (let count of rsAR) {
        let region = count.activeRegion;
        if (region != undefined) {
            regionCount[region] = (regionCount[region] || 0) + 1;
            if (regionCount[region] > maxCount) {
                maxCount = regionCount[region];
                highestRecordedAR = region;
            }
        }
    }
    return highestRecordedAR;
}


/**
 * function to find the max intensity of flare from retrieved set of data
 * @param rsINT Parameter used to receive the data consisting of intensity and magnitude
 * @returns mergedIntensity - The highest intensity from the data
 * @returns highINTFlareDuration - Duration of flare with the highest intensity
 */
function findMaxIntensity(rsINT) {
    const powerLevels = {
        A: 0,
        B: 1,
        C: 2,
        M: 3,
        X: 4
    }
    let highestINT;
    let highestMAG;
    let highestPower = 0;
    let highINTFlareDuration;
    for (let int of rsINT) {
        let intensity = int.intensity;
        let magnitude = int.magnitude;

        let score = powerLevels[intensity] * 10 + magnitude;

        if (score > highestPower) {
            highestPower = score;
            highestINT = intensity;
            highestMAG = magnitude
            highINTFlareDuration = int.duration;
        }
    }
    let mergedIntensity = `${highestINT} ${highestMAG}`

    return { mergedIntensity, highINTFlareDuration }
}


function summaryInjector(processedFlareData) {
    totalFlares.innerText = processedFlareData.summaryResult.totalFlares;
    maxIntensityFlare.innerText = processedFlareData.highestIntensityDuration.mergedIntensity;
    maxFlarePeakTime.innerText = processedFlareData.highestIntensityDuration.highINTFlareDuration;
    topActiveRegionClass.innerText = processedFlareData.topActiveRegionResult;
}

function clearTable() {
    tableBody.innerHTML = '';
}


function tableInjector(processedFlareData) {

    clearTable();

    for (const res of processedFlareData.result) {
        var row = tableBody.insertRow(0);

        var intensityCell = row.insertCell(0);
        var instrumentCell = row.insertCell(1);
        var solarLocationCell = row.insertCell(2);
        var startTimeCell = row.insertCell(3);
        var activeRegionCell = row.insertCell(4);
        var durationCell = row.insertCell(5);
        var flarePeakCell = row.insertCell(6);
        var linkedEventsCell = row.insertCell(7);

        intensityCell.innerHTML = res.intensity + res.magnitude;
        instrumentCell.innerHTML = res.instrumentUsed;
        solarLocationCell.innerHTML = res.location;
        startTimeCell.innerHTML = res.beginTime;
        activeRegionCell.innerHTML = res.activeRegion;
        durationCell.innerHTML = res.duration;
        flarePeakCell.innerHTML = res.peakTime;
        if (res.linkedEvents == null) {
            linkedEventsCell.innerHTML = 0;
        } else {
            linkedEventsCell.innerHTML = `${res.linkedEvents.length}`;
        }
    }
}
// Key Metrics:
// - Total Flares
// - Max Flare Peak Time
// - Highest Peak Time
// - Top Active Region

// Flare Details:
// - Intensity
// - Instrument
// - Solar Location
// - Start Time
// - Active Region
// - Duration
// - Flare Peak
// - Linked Events




