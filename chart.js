/* Global Constants Defined */

// Setting the adaptive width and height for the svg chart 
const windowWidth = window.innerWidth||document.documentElement.clientWidth||document.body.clientWidth;
const windowHeight = window.innerHeight||document.documentElement.clientHeight||document.body.clientHeight;
const width = windowWidth * 0.55;
const height = windowHeight * 0.6;

// Margin values for the svg chart
const leftmargin = 80;
const bottommargin = 60;

// Radius for the circle component of the svg
const radius = 5;

// Show titles for the annotations
const itemTitle = 'Cobra Kai';
const itemTitle1 = 'Too Hot to Handle';
const itemTitle2 = 'Cocomelon';

// x and y scale including the domain and range values.
const xscale = d3.scaleLog()
                    .domain([1,2000])
                    .range([0, width]);
                    
const yscale = d3.scaleLog()
                    .domain([1,1000])
                    .range([height, 0]);

/* Parses the loaded csv data and groups by year and show title */
function parseData(netflix_data){
    var parseDate = d3.timeParse("%d/%m/%y");
    var yearFormat = d3.timeFormat('%Y');

    return d3.nest()
                .key(function(d) { return yearFormat(parseDate(d['As of'])); })
                .key(function(d) { return d.Title; })
                .rollup(function(d) { 
                    return {
                        rank: d3.mean(d, function(c) { return parseInt(c.Rank); }),
                        type: d[0].Type,
                        netflixExclusive: d[0]['Netflix Exclusive'],
                        netflixReleaseDate: d[0]['Netflix Release Date'],
                        daysInTopTen: d3.max(d, function(c) { return parseInt(c['Days In Top 10'])}),
                        viewershipScore: d3.max(d, function(c) { return parseInt(c['Viewership Score'])})
                    };
                })            
                .entries(netflix_data);
}

/* Adapter function for creating annotations for all scenes */
function createAnnotation(data){
    var year = findCurrentYear();
    switch(year){
        case '2020':
            renderAnnotation(data, itemTitle, 50, 200);
            renderAnnotation(data, itemTitle1, -50, -50);
            renderAnnotation(data, itemTitle2, -50, -50);
            break;
        case '2021':
            renderAnnotation(data, itemTitle, 50, 200);
            renderAnnotation(data, itemTitle1, -50, -50);
            renderAnnotation(data, itemTitle2, -20, -50);
            break;
        case '2022':
            renderAnnotation(data, itemTitle, 50, 150);
            renderAnnotation(data, itemTitle1, -50, -50);
            renderAnnotation(data, itemTitle2, -20, -50);
            break;
    }
}

/* Primary function that renders the annotation for every show and year */
function renderAnnotation(data, showTitle, x_offset, y_offset){
    var year = findCurrentYear();
    const svgId = "svg#scene"+year;
    const type = d3.annotationCustomType(
        d3.annotationCalloutElbow,
        {"className":"custom",
            "connector":{"type":"elbow",
            "end":"dot"},
            "note":{"lineType":"horizontal",
            "align":"right"}});
    

    var dataItem;
    let skip = false;
    data.forEach(function(d) {
        if(skip)
            return;
        if(d.key === showTitle){
            dataItem = d;
            skip = true;
        }
    });
    
    var viewershipScore = dataItem.value.viewershipScore;
    var daysInTopTen = dataItem.value.daysInTopTen;
    var avgRank = Math.round(dataItem.value.rank);
    var showtype = dataItem.value.type;
    var message = `Featured in the top-ten for 3 consecutive years for  
                ${daysInTopTen} days with an avg. rank ${avgRank} in ${year}`;

    const annotations = [{
        note: {
          label: message,
          title: showtype + ": " + showTitle
        },
        x: leftmargin + xscale(parseInt(viewershipScore)) - 1, 
        y: bottommargin + yscale(parseInt(daysInTopTen)) - 1, 
        dy: x_offset,
        dx: y_offset
    }]

    const ann = d3.annotation()
                    .notePadding(10)
                    .textWrap(150)
                    .type(type)
                    .annotations(annotations);

    d3.select(svgId)
        .append("g")
            //.attr("class", "annotation-group")
            .attr("id", "title_ann")
        .call(ann);
}

/* Primary callback function for performing the filter by the show-type */
function typeFilter() {
    var checkedNames = [], unCheckedNames = [];
    var svgId = "svg#scene"+findCurrentYear();
    var circles = d3.select(svgId).selectAll("circle")
                    
    d3.selectAll(".filterCheckbox").each(function(d) {
        box = d3.select(this);
        type = box.property("value");
        if(box.property("checked"))
            checkedNames.push(type);
        else 
            unCheckedNames.push(type);    
    });

    circles
        .filter(d => checkedNames.includes(d.value.type))
        .style("opacity", 1)
        .attr("r", radius);
    
    circles
        .filter(d => unCheckedNames.includes(d.value.type))
        .style("opacity", 0)
        .attr("r", 0);

    // Removing the annotation
    var tvshowann = 'TV Show';
    if(unCheckedNames.includes(tvshowann))
        d3.selectAll("#title_ann").attr("opacity", 0);
    
    if(checkedNames.includes(tvshowann))
        d3.selectAll("#title_ann").attr("opacity", 1);
    
}

/* Primary callback function for rendering the scatter-plot chard
Includes chart creation and axis formatting */
function render(selection, data){

    selection
        .append("g")
            .attr("transform","translate("+leftmargin+","+bottommargin+")")
        .selectAll("circle")
        .data(data, function(d) { return d.value.type; })
        .enter()
        .append("circle")
            .attr("cx", function(d) { return xscale(parseInt(d.value.viewershipScore)); })
            .attr("cy", function(d) { return yscale(parseInt(d.value.daysInTopTen));} )
            .attr("r", function(d) { return radius; } )
            .style("stroke-width", 0.2)
            .on("mousemove", renderTooltip)
            .on("mouseout", hideTooltip);                

    var xaxis = d3.axisBottom(xscale).ticks(10, '~s')
    var yaxis = d3.axisLeft(yscale).ticks(10, '~s')
        
    // Creating yaxis
    selection.append("g")
            .attr("transform", "translate("+leftmargin+","+bottommargin+")")
            .call(yaxis)
        
    // Creating xaxis
    selection.append("g")
            .attr("transform", "translate("+leftmargin+","+(height+bottommargin)+")")
            .call(xaxis)
        
    // x-axis label
    selection.append("text")
                .attr("class", "x label")
                .attr("text-anchor", "start")
                .attr("x", width / 2 )
                .attr("y", height + 120)
                .attr("font-size","12")
                .attr("font-family", "Verdana, sans-serif")
                .text("Maximum Viewership Score");
            
    // y-axis label
    selection.append("text")
                .attr("class", "y label")
                .attr("text-anchor", "end")
                .attr("x", -160)
                .attr("y", 20)
                .attr("dy", ".75em")
                .attr("transform", "rotate(-90)")
                .attr("font-size","12")
                .attr("font-family", "Verdana, sans-serif")
                .text("Maximum no. of Days-In-Top-10");
                    
    createAnnotation(data);
}

/* Callback function for rendering the tool-tip upon hover */
function renderTooltip(d, i){
    var tooltip = d3.select("#tooltip");
    tooltip.transition()
        .duration(50)
        .style("opacity", .8)

    var releaseDate = "";
    if(d.value.netflixExclusive === 'Yes')
        releaseDate = "<br>Netflix Release Date: <b>" + d.value.netflixReleaseDate + "</b>";
    
    tooltip.style("left", d3.event.pageX + 15 + "px")
        .style("top", d3.event.pageY + 15 + "px")
        .html("Title: <b>" + d.key + "</b>" +
            "<br>Type: <b>" + d.value.type + "</b>" + 
            "<br>Avg. Rank: <b>"+ Math.round(parseFloat(d.value.rank)) + "</b>" + 
            "<br>Max. Days in Top-10: <b>" + d.value.daysInTopTen + "</b>" + 
            "<br>Max. Viewership Score: <b>" + d.value.viewershipScore + "</b>" + 
            "<br>Netflix Exclusive: <b>" + d.value.netflixExclusive + "</b>" + releaseDate
        )
}

/* Callback function for hiding the tool-tip */
function hideTooltip(){
    var tooltip = d3.select("#tooltip");
    tooltip.transition()
        .duration(100)
        .style("opacity", 0) 
}

/* Primary callback function for opening the tab and generating the 
scatter-plot chart */
function openTab(year){
    console.log("Opening tab for year: "+year);

    // Get all elements with class="tabcontent" and hide them
    Array.from(document.getElementsByClassName("tabcontent")).forEach((tabcontent) => {
      tabcontent.style.display = "none";
    });
  
    // Get all elements with class="tablinks" and removing the active status.
    //, and set the class status to 'active' to the button that opened the tab
    Array.from(document.getElementsByClassName("tablinks")).forEach((tab) => {
        if(tab.value != year) 
            tab.classList.remove('is-active');
        else
            tab.classList.add('is-active');
    });

    // Show the current tab
    document.getElementById(year).style.display = "block";

    
  
    // Firing up the function to create the scatterplot
    //createScatterPlot(ndata, year);
    var svgId = "svg#scene"+year;
    var selection = d3.select(svgId);
    var filteredData = ndata.filter(df => df.key == year)[0].values;
    render(selection, filteredData);

    // Calling the typeFilter
    typeFilter();
}

/* Helper function for finding the current year */
function findCurrentYear(){
    var selectedYear;
    Array.from(document.getElementsByClassName("tablinks")).forEach((tab) => {
        if(tab.classList.contains('is-active'))
          selectedYear = tab.value;
    });
    return selectedYear;
}