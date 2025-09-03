function test(){
    console.log("testing")
}

const columnNames = {
    mrn: "MRN"
}

const employmentMap = new Map()
employmentMap["Unemployed"] = 0
employmentMap["0-9"] = 0.5
employmentMap["10-19"] = 1.5
employmentMap["20-29"] = 2.5
employmentMap["30-39"] = 3.5
employmentMap["40+"] = 5

const educationMap = new Map()
educationMap["No Education"] = 0
educationMap["0-9"] = 0.5
educationMap["10-19"] = 1.5
educationMap["20-29"] = 2.5
educationMap["30-39"] = 3.5
educationMap["40+"] = 5

let insightsActive = new Set()

document.addEventListener("DOMContentLoaded", function(){
    // document.getElementById("test").addEventListener("click", test)
    document.getElementById('xlsxFileInput').addEventListener('change', function(e) {
        const file = e.target.files[0];
    
        if (!file) return;
    
        const reader = new FileReader();
    
        reader.onload = function(event) {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array', cellText: true});
    
            // Get first sheet name
            const sheetName = workbook.SheetNames[0];
    
            // Convert sheet data to JSON
            let sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, raw: false});
    
            processSheetData(sheetData)
            processSheetDataWithFilters(sheetDataObjs)
        };
    
        reader.readAsArrayBuffer(file);
    });

    document.getElementById('checkouts_only').addEventListener('click', () => {
        if(sheetDataObjs.length > 0){
            processSheetDataWithFilters(sheetDataObjs)
        }

        updateCheckoutsInDateRangeBox()
    })

    const dateFields = ["start_year", "end_year", "start_month", "end_month"]
    
    dateFields.forEach(function(element){
        console.log(element)
        document.getElementById(element).addEventListener("change", function(){
            if(sheetDataObjs.length > 0){
                processSheetDataWithFilters(sheetDataObjs)
            }
        })
    })

    document.getElementById('filter_by_date').addEventListener('click', updateDateRangeFilter)

    document.getElementById('search_bar').addEventListener('change', function(){
        parseSearchBar()
        if(sheetDataObjs.length > 0){
            processSheetDataWithFilters(sheetDataObjs)
        }
    })

    document.getElementById('search_button').addEventListener('click', function(){
        parseSearchBar()
        if(sheetDataObjs.length > 0){
            processSheetDataWithFilters(sheetDataObjs)
        }
    })

    updateCheckoutsInDateRangeBox()
    updateDateRangeFilter()
    parseSearchBar()
})

function updateCheckoutsInDateRangeBox(){
    console.log(document.getElementById('checkouts_only').checked)
    if(document.getElementById('checkouts_only').checked){
        document.getElementById('filter_by_date_div').style.display = "inherit"
    }else{
        document.getElementById('filter_by_date_div').style.display = "none"
    }
}

let sheetDataObjsCopy

function processSheetDataWithFilters(sheetDataObjs){
    sheetDataObjsCopy = []

    let mrnsToInclude = new Set()
    let filters = false

    const checkoutsOnlyFilter = document.getElementById('checkouts_only').checked

    if(checkoutsOnlyFilter && !document.getElementById('filter_by_date').checked){
        console.log("checkouts only, no date range specified")

        filters = true

        let i=1
        while(i < sheetDataObjs.length){
            if(sheetDataObjs[i]["Moved Out"] == "Yes"){
                mrnsToInclude.add(sheetDataObjs[i]["MRN"])
            }
            i++
        }

        console.log(mrnsToInclude)
    }

    else if(document.getElementById('filter_by_date').checked){
        console.log("checkouts only, date range specified")

        filters = true

        // let temp = new Set()
        console.log(document.getElementById("start_month").value, document.getElementById('start_year').value)
        console.log(document.getElementById("end_month").value, document.getElementById('end_year').value)

        const startDate = new Date(
            //year
            document.getElementById('start_year').value,

            //month index
            document.getElementById("start_month").value,

            //date
            1,

            //hours
            0
        )

        // console.log(parseInt(document.getElementById("end_month").value) + 1)

        // console.log((parseInt(document.getElementById("end_month").value) + 1) % 12)

        const endDate = new Date(
            //year
            document.getElementById('end_year').value + (document.getElementById("end_month").value == 12 ? 1 : 0),

            //month index
            (parseInt(document.getElementById("end_month").value) + 1) % 12,

            //date
            1,

            //hours
            0
        )

        console.log(startDate, endDate)

        let i=1
        while(i < sheetDataObjs.length){
            // const moveoutDate = parseDate(sheetDataObjs[i]["Moveout Date"])


            if(sheetDataObjs[i]["Moved Out"] == "Yes"){
                const moveoutDate = parseDate(sheetDataObjs[i]["Moveout Date"])
                if(dateInRange(startDate, endDate, moveoutDate)){
                    mrnsToInclude.add(sheetDataObjs[i]["MRN"])
                }
            }
            i++
        }

        console.log(mrnsToInclude)
    }

    else{
        console.log("Errrm")
    }

    for(const item of sheetDataObjs){
        if(!filters || mrnsToInclude.has(item["MRN"])){
            sheetDataObjsCopy.push(structuredClone(item))
        }
    }

    processSheetDataObjs(sheetDataObjsCopy)
}

function dateInRange(lower, upper, test){
    return (upper-test >= 0 && test-lower >= 0)
}

function parseDate(dateString){
    const dateParts = dateString.split("/")
    return new Date(dateParts[2], parseInt(dateParts[0])-1, dateParts[1])
}

function parseSearchBar(){
    const searchBarText = document.getElementById("search_bar").value

    searchBar = searchBarText.split(" ")

    searchBar.forEach(element => {
        element = element.toLowerCase()
    });

    // console.log(searchBar)
}

function nameInSearch(name){
    for(let i=0; i<searchBar.length; i++){
        const element = searchBar[i]

        if(!name.toLowerCase().includes(element)){
            // console.log(name, "does not include", element)
            return false
        }
    }

    return true
}

let sheetDataObjs = []

let searchBar = []

document.getElementById("search")

function processSheetData(sheetData){
    sheetDataObjs = []
    headers = sheetData[0]
    for(i=1; i<sheetData.length; i++){
        //maps the first row of names of entries to the keys for the objects in the array
        const mappedObject = Object.fromEntries(headers.map((key, index) => [key, sheetData[i][index]]));

        const sheetAssessmentDate = mappedObject["Date of Assessment:"]

        if(sheetAssessmentDate){
            mappedObject["dateOfAssessment"] = parseDate(sheetAssessmentDate)

            // console.log(sheetAssessmentDate)
        }

        const sheetMoveinDate = mappedObject["Date of Entry"]

        if(sheetMoveinDate){
            mappedObject["dateOfEntry"] = parseDate(sheetMoveinDate)
        }

        //add to sheetDataObjs array
        if(parseInt(mappedObject["MRN"]) != 2){
            if(typeof mappedObject["MRN"] == "string")
                mappedObject["MRN"] = parseInt(mappedObject["MRN"])
            sheetDataObjs.push(mappedObject)
        }else{
            console.log(mappedObject["Patient Name"] + " deleted because MRN matches that of 'Tammy Test'")
        }
    }

    processSheetDataObjs(sheetDataObjs)
}

function processSheetDataObjs(sheetDataObjs){
    let mrns = new Set()
    sheetDataObjs.forEach(function(element){
        mrns.add(element["MRN"])
    })
    console.log(mrns)

    //TOOD: update this using checkin date if that becomes a thing?
    let firstCheck = new Map()
    let lastCheck = new Map()
    mrns.forEach(function(element){
        firstCheck[element] = null
        lastCheck[element] = null
    })

    sheetDataObjs.forEach(function(element){
        currFirst = firstCheck[element["MRN"]]

        //if current first doesn't exist or if the element's date of assessment is before the current first
        if(!currFirst || element["dateOfAssessment"] < currFirst["dateOfAssessment"]){
            firstCheck[element["MRN"]] = element
        }

        currLast = lastCheck[element["MRN"]]

        //if current last doesn't exist or if the element's date of assessment is after the current last
        if(!currLast || element["dateOfAssessment"] > currLast["dateOfAssessment"]){
            lastCheck[element["MRN"]] = element
        }
    })

    //do the processing and get the insights
    resetInsights()

    // Maintain or Increase Income
    checkIncome(firstCheck, lastCheck)

    // Maintain or Increase Employment/Education
    checkEmploymentEducation(firstCheck, lastCheck)

    // Maintain or Increase Non-Cash Benefits
    checkBenefits(firstCheck, lastCheck)

    // Have Health Insurance (Adults and Child)
    haveHealthInsurance(lastCheck)

    // Exits to Permanent Housing Destinations
    exitToPermanentHousing(lastCheck)

    // Utilization

    // Length of Time in Program (Average Days)
    window.daysStayed = checkTimeStayed(lastCheck)

    // Length of Time in Program (Median Days)
}

function resetInsights(){
    document.getElementById("insights").innerHTML = ``
}

function printInsight(marker, percentage, notes){
    printInsightWithTitle(generatePercentage(marker, percentage), notes)
}

function printInsightWithTitle(title, notes){
    const insightDiv = document.createElement('div')
    const insightTitle = document.createElement('h2')
    insightTitle.innerHTML = title

    const notesContainer = document.createElement('div')
    notesContainer.style.display = "none"

    insightTitle.classList.add("insight_title")

    const coll = insightTitle;
    const content = notesContainer;

    coll.addEventListener("click", function() {
        // console.log('clicked')
        this.classList.toggle("active");
        if(insightsActive.has(title)){
            insightsActive.delete(title)
        }else{
            insightsActive.add(title)
        }

        content.style.display = insightsActive.has(title) ? "block" : "none";
    });

    content.style.display = insightsActive.has(title) ? "block" : "none";


    // console.log(notes)

    notes.forEach(element => {
        const noteDiv = document.createElement('div')
        noteDiv.innerHTML = element
        notesContainer.appendChild(noteDiv)
    });

    insightDiv.appendChild(insightTitle)
    insightDiv.appendChild(notesContainer)

    document.getElementById('insights').appendChild(insightDiv)
}

function generatePercentage(marker, percentage){
    return `${marker} : ${Math.round((percentage*100))}%`
}

function haveHealthInsurance(lastCheck){
    let total = 0
    let haveHI = 0
    let notes = []
    for (const key in lastCheck){
        const val = lastCheck[key]

        let currNote
        
        if(val["Adult:"] == "Yes" && val["Child:"] == "Yes"){
            haveHI ++
            currNote = `${val["Patient Name"]} and children have health insurance.`
        }else{
            currNote = `${val["Patient Name"]} and children DO NOT have health insurance.`
        }

        if(nameInSearch(val["Patient Name"])){
            notes.push(currNote)
        }

        total ++
    }

    printInsight("Have health insurance", haveHI/total, notes)
}

//"Exits to Permanent Housing Destinations:"
function exitToPermanentHousing(lastCheck){
    let total = 0
    let exitToPerm = 0
    let notes = []
    for (const key in lastCheck){
        const val = lastCheck[key]

        let currNote
        
        // console.log(val["Exits to Permanent Housing Destinations:"])
        if(["Yes", "If Yes, Where:"].includes(val["Exits to Permanent Housing Destinations:"])){
            exitToPerm ++
            currNote = `${val["Patient Name"]} exits to permanent housing destination.`
        }else{
            currNote = `${val["Patient Name"]} DOES NOT exit to permanent housing destination.`
        }
        total ++

        if(nameInSearch(val["Patient Name"])){
            notes.push(currNote)
        }
    }

    printInsight("Exit to permanent housing destinations", exitToPerm/total, notes)
}

function checkBenefits(firstCheck, lastCheck){
    let total = 0
    let benefitsMaintainedOrIncreased = 0
    let notes = []
    for (const key in firstCheck){
        if(nameInSearch(firstCheck[key]["Patient Name"])){
            notes.push(`<strong>${firstCheck[key]["Patient Name"]}</strong> - ${firstCheck[key]["What maintain or Increase Non-Cash Benefits:"]} | ${lastCheck[key]["What maintain or Increase Non-Cash Benefits:"]}`)
        }
        
        let benefitsBefore
        if(!firstCheck[key]["What maintain or Increase Non-Cash Benefits:"])
            benefitsBefore = []
        else
            benefitsBefore = firstCheck[key]["What maintain or Increase Non-Cash Benefits:"].split(",").map(str => str.trim())

        let benefitsAfter
        if(!lastCheck[key]["What maintain or Increase Non-Cash Benefits:"])
            benefitsAfter = []
        else
            benefitsAfter = lastCheck[key]["What maintain or Increase Non-Cash Benefits:"].split(",").map(str => str.trim())

        // console.log(benefitsBefore, benefitsAfter)

        let addToCheckBenefits = 1
        benefitsBefore.forEach(element => {
            if(!benefitsAfter.includes(element)){
                addToCheckBenefits = 0
            }
        });

        benefitsMaintainedOrIncreased += addToCheckBenefits
        total ++
    }
    printInsight("Maintained or Increased Benefits", benefitsMaintainedOrIncreased/total, notes)
}

function checkTimeStayed(lastCheck){
    const daysStayed = []

    let totalDays = 0
    let numDaysCounted = 0

    const notes = []

    for (const key in lastCheck){
        const days = Math.round((lastCheck[key]["dateOfAssessment"] - lastCheck[key]["dateOfEntry"]) / 86400000)

        if(days >= 0){
            daysStayed.push(days)
            totalDays += days
            numDaysCounted ++
        }

        let currNote

        if(lastCheck[key]["Moved Out"] == "Yes"){
            currNote = `${lastCheck[key]["Patient Name"]} had stayed ${days} days as of moveout date.`
        }else{
            currNote = `${lastCheck[key]["Patient Name"]} had stayed ${days} days as of last check-in.`
        }

        if(nameInSearch(lastCheck[key]["Patient Name"])){
            notes.push(currNote)
        }
    }

    const sortedDays = daysStayed.sort((a,b) => a-b)

    const medianDays = (sortedDays[Math.floor((sortedDays.length-1) / 2)] + sortedDays[Math.ceil((sortedDays.length-1) / 2)]) / 2
    
    const meanDays = totalDays / numDaysCounted

    printInsightWithTitle(`Average Days Stayed: Median - ${medianDays}, Mean - ${meanDays} <span id="show_time_stayed_histogram">(click to show histogram)</span>`, notes)

    document.getElementById('show_time_stayed_histogram').addEventListener('click', (event) => {
        event.stopPropagation();
        createAverageDaysChart()
    })

    return daysStayed
}

function checkIncome(firstCheck, lastCheck){
    let total = 0
    let incomeMaintainedOrIncreased = 0
    let notes = []
    for (const key in firstCheck){
        let beforeCleaned = firstCheck[key]["Income ($):"].replace(/[,$\s]/g, '');
        const incomeBefore = parseFloat(beforeCleaned)
        let afterCleaned = lastCheck[key]["Income ($):"].replace(/[,$\s]/g, '');
        const incomeAfter = parseFloat(afterCleaned)
        const difference = incomeAfter-incomeBefore

        // console.log(incomeBefore)
        // console.log(incomeAfter)

        let incomeMessage = ``

        if(difference > 0){
            incomeMessage = `increase of $${difference}`

            incomeMaintainedOrIncreased++
        }else if(difference < 0){
            incomeMessage = `decrease of $${Math.abs(difference)}`
        }else if(difference == 0){
            incomeMessage = `maintained income`

            incomeMaintainedOrIncreased++
        }

        if(nameInSearch(firstCheck[key]["Patient Name"])){
            notes.push(`<strong class="clickable_name" onclick="drawIncomeChart(${key})" style="cursor: pointer">${firstCheck[key]["Patient Name"]}</strong> - ${incomeBefore} | ${incomeAfter}, ${incomeMessage}.`)
        }

        total++
    }
    printInsight("Maintained or Increased Income", incomeMaintainedOrIncreased/total, notes)
}

function checkEmploymentEducation(firstCheck, lastCheck){
    let total = 0
    let employmentMaintainedOrIncreased = 0
    let notes = []
    for (const key in firstCheck){
        const employmentBefore = firstCheck[key]["Hours Worked"]
        const employmentAfter = lastCheck[key]["Hours Worked"]

        const educationBefore = firstCheck[key]["Hours in Education"]
        const educationAfter = lastCheck[key]["Hours in Education"]

        const employmentEducationSumBefore = (employmentBefore ? employmentMap[employmentBefore] : 0) + (educationBefore ? educationMap[educationBefore] : 0)

        const employmentEducationSumAfter = (employmentAfter ? employmentMap[employmentAfter] : 0) + (educationAfter ? educationMap[educationAfter] : 0)

        const employmentEducationDifference = employmentEducationSumAfter - employmentEducationSumBefore

        let eemessage

        if(employmentEducationDifference > 0){
            eemessage = `Overall increase in Employment/Education ${employmentEducationDifference}`
        }else if(employmentEducationDifference == 0){
            eemessage = 'Overall maintain in Employment/Education'
        }else if(employmentEducationDifference < 0){
            if(employmentEducationSumAfter >= 4){
                eemessage = 'Overall decrease in Employment/Education, but is engaged to a satisfactory degree'
            }else{
                eemessage = 'Overall decrease in Employment/Education'
            }
        }

        if(nameInSearch(firstCheck[key]["Patient Name"])){
            notes.push(`<strong class="clickable_name" onclick="drawEmploymentEducationChart(${key})" style="cursor: pointer">${firstCheck[key]["Patient Name"]}</strong> - ${eemessage}`)
        }

        if(employmentEducationDifference >= 0 || employmentEducationSumAfter >= 4){
            employmentMaintainedOrIncreased++
        }

        total++
    }
    printInsight("Maintained or Increased Employment/Education", employmentMaintainedOrIncreased/total, notes)
}

function updateDateRangeFilter(){
    document.getElementById('filter_date_range').style.display = document.getElementById("filter_by_date").checked ? 'block' : 'none'
}

function getSortedFromMRN(MRN){
    const sortedDatapoints = []

    for(const item of sheetDataObjs){
        if(item.MRN == MRN){
            sortedDatapoints.push(item)
        }
    }

    sortedDatapoints.sort((a, b) => a.dateOfAssessment - b.dateOfAssessment)

    return sortedDatapoints
}

let currentChart

function hideChart(){
    document.getElementById('chart_display').style.display = "none"
}

function showChart(){
    document.getElementById('chart_display').style.display = "flex"
}

function drawEmploymentEducationChart(MRN){
    showChart()

    if(window.myChart){
        window.myChart.destroy()
    }

    const participantData = getSortedFromMRN(MRN)

    const xlabels = []

    const ylabels = ['40+', '30-39', '20-29', '10-19', '0-9', 'None']

    const employmentDataSet = []

    const educationDataSet = []

    let participantName

    for(const point of participantData){
        if(!participantName){
            participantName = point["Patient Name"]
        }

        const monthYearString = `${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][point.dateOfAssessment.getMonth()]} ${point.dateOfAssessment.getFullYear()}`

        let employmentPoint = point["Hours Worked"]

        if(!employmentPoint || employmentPoint == "Unemployed"){
            employmentPoint = "None"
        }

        employmentDataSet.push({x: monthYearString, y: employmentPoint})

        let educationPoint = point["Hours in Education"]

        if(!educationPoint || educationPoint == "No Education"){
            educationPoint = "None"
        }

        educationDataSet.push({x: monthYearString, y: educationPoint})

        xlabels.push(monthYearString)
    }

    const ctx = document.getElementById('myLineChart').getContext('2d');

    window.myChart = new Chart(ctx, {
    type: 'scatter',
    data: {
        datasets: [
            {
                label: 'Employment',
                data: employmentDataSet,
                pointBackgroundColor: 'darkblue',
                pointRadius: 6,
                showLine: true,
                tension: 0.4
            }, 
            {
                label: 'Education',
                data: educationDataSet,
                pointBackgroundColor: 'darkred',
                pointRadius: 6,
                showLine: true,
                tension: 0.4
            }
        ]
    },
    options: {
        scales: {
        x: {
            type: 'category',
            labels: xlabels
        },
        y: {
            type: 'category',
            labels: ylabels
        }
        },
        plugins: {
            title: {
              display: true,
              text: `Employment and Education for ${participantName}`,
              font: {
                size: 20
              },
              color: '#333',
              padding: {
                top: 10,
                bottom: 30
              },
              align: 'center' // or 'start', 'end'
            }
        }
    }
    });
}

function drawIncomeChart(MRN){
    showChart()

    if(window.myChart){
        window.myChart.destroy()
    }

    const participantData = getSortedFromMRN(MRN)

    const xlabels = []

    const incomeDataSet = []

    let participantName

    for(const point of participantData){
        if(!participantName){
            participantName = point["Patient Name"]
        }

        const monthYearString = `${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][point.dateOfAssessment.getMonth()]} ${point.dateOfAssessment.getFullYear()}`

        let cleaned = point["Income ($):"].replace(/[,$\s]/g, '');

        incomeDataSet.push({x: monthYearString, y: parseFloat(cleaned)})

        xlabels.push(monthYearString)
    }

    const ctx = document.getElementById('myLineChart').getContext('2d');

    window.myChart = new Chart(ctx, {
    type: 'line',
    data: {
        datasets: [
            {
                label: 'Income',
                data: incomeDataSet,
                pointBackgroundColor: 'darkblue',
                pointRadius: 6,
                showLine: true,
                tension: 0.4
            }
        ]
    },
    options: {
        scales: {
        x: {
            type: 'category',
            labels: xlabels
        },
        y: {
            beginAtZero: true
        }
        },
        plugins: {
            title: {
              display: true,
              text: `Income for ${participantName}`,
              font: {
                size: 20
              },
              color: '#333',
              padding: {
                top: 10,
                bottom: 30
              },
              align: 'center' // or 'start', 'end'
            }
        }
    }
    });
}

function createAverageDaysChart(){
    if(!window.daysStayed){
        return
    }

    if(window.myChart){
        window.myChart.destroy()
    }

    const bins = []; // Bin edges
    const binLabels = [];

    for(let i=0; i<window.daysStayed[window.daysStayed.length-1] + 20; i+=20){
        bins.push(i)

        binLabels.push(`${i==0 ? 0 : i+1}-${i+20}`)

        console.log(bins, binLabels)
    }

    binLabels.splice(binLabels.length-1,1)

    const binCounts = Array(binLabels.length).fill(0);

    window.daysStayed.forEach(value => {
        console.log(value)
        for (let i = 0; i < bins.length - 1; i++) {
            if (value >= bins[i] && value < bins[i + 1]) {
            binCounts[i]++;
            console.log(value, binLabels[i])
            break;
            }
        }
    });

    console.log(binCounts)

    const ctx = document.getElementById('myLineChart').getContext('2d');

    window.myChart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: binLabels,
        datasets: [{
        label: 'Frequency',
        data: binCounts,
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
        }]
    },
    options: {
        plugins: {
        title: {
            display: true,
            text: `Histogram of Days Stayed`,
            font: {
                size: 20
            },
            color: '#333',
            padding: {
                top: 10,
                bottom: 30
            },
            align: 'center' // or 'start', 'end'
        }
        },
        scales: {
        y: {
            beginAtZero: true,
            title: {
            display: true,
            text: 'Count'
            }
        },
        x: {
            title: {
            display: true,
            text: 'Value Range'
            }
        }
        }
    }
    });

    showChart()
}