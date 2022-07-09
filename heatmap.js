const breachesData = "https://june-han.github.io/DataBreach_HeatMap/data/breaches.csv"

let width = 1000, height = 600;

//set margin left and bottom for the axis labels
var margin = {top: 10, right: 10, bottom: 30, left: 90},
        margin_width = width - margin.left - margin.right,
        margin_height = height - margin.top -margin.bottom;

let svg = d3.select("#container")
    .attr("viewBox", "0 0 " + width + " " + height);

// Load external data
Promise.all([d3.csv(breachesData)]).then(data => {
    console.log(data[0])
    // Create x axis with unique years
    let xYears = [...new Set(data[0].map(item => item.year))];

    //Create y axis with unique sectors
    let ySectors = [...new Set(data[0].map(item => item.sector))];

    //Scaling for bars x-axis
    const xScale = d3.scaleBand()
                    .domain(xYears.reverse())
                    .rangeRound([margin.left, margin_width])
                    .padding(0.01);
    
    //Scaling for bars on y-axis
    const yScale = d3.scaleBand()
                    .domain(ySectors)
                    .rangeRound([ margin.top, margin_height])
                    .padding(0.01);
    
    // Add x-axis to graph
    svg.append("g")
        .style("font-size", 15) 
        .attr("transform", "translate(0,"+ margin_height + ")")
        .call(d3.axisBottom(xScale).tickSize(0)) 
        .select (".domain").remove() 

    //Add y-axis to graph
    svg.append("g")
        .style("font-size", 15)
        .attr("transform", "translate(" + margin.left + ", 0)")
        .call(d3.axisLeft(yScale).tickSize(0)) 
        .select (".domain").remove() 
    
    //Build a color scale
    let colorScale = d3.scaleSequential()
                        .interpolator(d3.interpolateInferno)
                        .domain([1, 12])
    
    //Build the dataset
    let mapData = [];
    ySectors.forEach((sector) =>{
        xYears.forEach((year) => {
            let obj = {};
            obj.sector = sector;
            obj.year = year
            let records = data[0].filter((element) => element.year == year && element.sector == sector )
            obj.value = records.length
            obj.recordslost = 0
            records.forEach((record) => {  
                obj.recordslost += parseFloat(record["records lost"].replace(/,/g, ''));
            })
            mapData.push(obj)
        })
    })
    
    svg.selectAll("rect")
        .data(mapData)
        .enter()
        .append("rect")
            .attr("x", xdata => { 
                return xScale(xdata.year)
            })
            .attr("y", ydata => {
                return yScale(ydata.sector)
            })
            .attr("rx", 4)
            .attr("ry", 4)
            .attr("width", xScale.bandwidth())
            .attr("height", yScale.bandwidth())
            .style("fill", (d) => {
                return colorScale(d.value)
            })
            .style("stroke-width", 4)
        .on("mouseover", (event) => {
            d3.select(event.currentTarget)
            .attr("stroke", "black")
            .attr("stroke-width", 10)
            .attr('opacity', '.8')
            .append('title')
            .text((d) => d.value + ' ' + d.sector + ' cases in '+ d.year+"\n"
            + d.recordslost + " records lost");
        }) 
        .on("mouseout", (event) => {
            d3.select(event.currentTarget)
            .attr("stroke", "none")
            .attr('opacity', '1')
            .select('title').remove()
        });


    //DRAWING LEGEND
    legendSVG = d3.select("#legend")
                    .attr("height", 50)
                    .attr("width", 500);
    var size = 20
    // Add rect for each color
    let colorScaleKeys = [...Array(13).keys()];
    console.log (colorScaleKeys)
    legendSVG.append("g")
        .selectAll("legendColors")
            .data(colorScaleKeys)
            .enter()
            .append("rect")
                .attr("y", margin.top + size/2)
                .attr("x", (key, index) => {return 40 + index*(size+5);})
                .attr("width", size)
                .attr("height", size)
                .attr("stroke", "black")
                .attr("stroke-width", 0.5)
                .style("fill", function(key){ return colorScale(key)});

    // Add one dot in the legend for each name.
    legendSVG.append("g")
            .selectAll("legendlabels")
            .data(colorScaleKeys)
            .enter()
            .append("text")
                .attr("y", margin.top)
                .attr("x", (key,index) => {return 35 + index*(size+5) + (size/2)})
                .style("fill", "black")
                .text(function(key){ return key})
                .attr("text-anchor", "left")
                .style("alignment-baseline", "middle");
    
    })