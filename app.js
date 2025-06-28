const body = document.querySelector('body');
const themeMode = document.querySelector('.themeMode');
const pickerContainer = document.querySelector('.pickerContainer');
const fromDate = document.querySelector('#fromDate');
const endDate = document.querySelector('#endDate');
const pickerSearch = document.querySelector('.pickerSearch');


// Variables
const api = "2RptH3VHc9l03KbmaL2iY9sws37rdlfNyburl0u2";
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

        let retrievedFromDate = fromDate.value;
        let retrievedEndDate = endDate.value;

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





function allData(data) {
    let result = [];
    let highestPeakTimeMinutes = null;
    let highestPeakTime;
    let totalFlares = data.length;
    for (let d of data) {
        let duration;
        if (d.peakTime) {
            const p = new Date(d.peakTime);
            let minutes = p.getTime();
            if (minutes > highestPeakTimeMinutes) {
                highestPeakTimeMinutes = minutes;
                highestPeakTime = d.peakTime.slice(11, 16);
            }
        }

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

        let beginTime = d.beginTime ? d.beginTime.slice(11, 16) : null;
        let peakTime = d.peakTime ? d.peakTime.slice(11, 16) : null;
        let endTime = d.endTime ? d.endTime.slice(11, 16) : null;
        let intensity = d.classType ? d.classType.slice(0, 1) : null;
        let magnitude = d.classType ? parseFloat(d.classType.slice(1)) || 0 : 0;
        let instrumentUsed = d.instruments && d.instruments[0] ? d.instruments[0].displayName : "N/A";
        let location = d.sourceLocation || "Unknown";
        let occuranceTime = d.flrID ? d.flrID.slice(0, 10) : "Unknown";
        let activeRegion = d.activeRegionNum || null;
        let linkedEvents = Array.isArray(d.linkedEvents)
            ? d.linkedEvents.map(event => event.activityID)
            : null;

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
    const commonResult = {
        highestPeakTime,
        totalFlares
    };

    let topActiveRegionResult = topActiveRegion(result);
    let highestIntensity = findMaxIntensity(result);
}

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


function topActiveRegion(rsAR) {
    let regionCount = {};
    let maxCount = 0;
    let highestRecordedAR = null;

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
    for (let int of rsINT) {
        let intensity = int.intensity;
        let magnitude = int.magnitude;

        let score = powerLevels[intensity] * 10 + magnitude;

        if (score > highestPower) {
            highestPower = score;
            highestINT = intensity;
            highestMAG = magnitude
        }
    }
    return { highestINT, highestMAG };
}
// Total Flares = Total number of flares in the given period of time.
// Max Intensity Flare = The Flare with the maximum intensity in the given set of data.
// Top Active Region = The region with the top number of flare activity in the given set of data.
// Highest Peak Time = The Highest peak time of a flare from the set of flares.


// Intensity = Intensity of the flare.
// Instrument = Instrument used the track the flare.
// Solar location = The exact location where the flare was recorded.
// Start Time = The time when the flare began
// Active Region = The region where the solar location is situated
// Duration = The entire duration of the Flare.
// Flare peak = The top most peak the flare was recorded
// Linked events = The number of linked events.


