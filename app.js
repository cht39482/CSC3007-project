const breachesData = "https://june-han.github.io/DataBreach_HeatMap/data/breaches.csv"

let width = 1200, height = 800;

//set margin left and bottom for the axis labels
var margin = {top: 10, right: 10, bottom: 70, left: 90},
        margin_width = width - margin.left - margin.right,
        margin_height = height - margin.top -margin.bottom;

let heatmap = d3.select("#heatmapGraph")
    .attr("viewBox", "0 0 " + width + " " + height);

let lollipop = d3.select("#lollipop")
    .attr("viewBox", "0 0 " + width + " " + height);

// Load external data
Promise.all([d3.csv(breachesData)]).then(data => {
    console.log(data[0])

    /*******************************************
    ******************Heat Map******************
    ********************************************/
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
    heatmap.append("g")
        .style("font", "15px times")
        .attr("transform", "translate(0,"+ margin_height + ")")
        .call(d3.axisBottom(xScale).tickSize(0))
        .select (".domain").remove()

    //Add y-axis to graph
    heatmap.append("g")
        .style("font", "15px times")
        .attr("transform", "translate(" + margin.left + ", 0)")
        .call(d3.axisLeft(yScale).tickSize(0)) 
        .select (".domain").remove() 
    
    //Build a color scale
    let colorScale = d3.scaleSequential()
                        .interpolator(d3.interpolateInferno)
                        .domain([1, 10])
    
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
            //console.log(obj)
            mapData.push(obj)
        })
    })

    //Tooltip for the heatmap squares
    var heatmap_tooltip = d3.select("#heattip")
                    .style("position", "absolute")
                    .style("z-index", "10")
                    .style("visibility", "hidden")
                    .style("padding", "15px")
                    .style("color", "white") //text color
                    .style("background", "black") //bg color
                    .style("border", "2px solid white") //border
                    .style("border-radius", "25px")
                    .style("box-shadow", "10px 8px 2px 1px rgba(0, 0, 255, .2)");
    
    heatmap.selectAll("rect")
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
        //mouseover tooltip effect
        .on("mouseover", (event, d) => {
            d3.select(event.currentTarget)
            .attr("stroke", "black")
            .attr("stroke-width", 10)
            .attr('opacity', '.8');

            heatmap_tooltip
                        .text(+d.value + ' ' + d.sector + ' cases in '+ d.year +' with '+d.recordslost + ' records lost')
                        .style("visibility", "visible")
                        .style("top", (event.pageY-10)+"px")
                        .style("left",(event.pageX+10)+"px");
        }) 
        .on("mouseout", (event) => {
            d3.select(event.currentTarget)
            .attr("stroke", "none")
            .attr('opacity', '1');
            d3.select("#heattip")
                .text("")
                .style("visibility", "hidden");
        });


    //DRAWING LEGEND
    legendSVG = d3.select("#legend")
                    .attr("height", 50)
                    .attr("width", 500);
    var size = 20
    let colorScaleKeys = [...Array(10).keys()];
    
    //legend colors
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

    // legend labels
    legendSVG.append("g")
            .selectAll("legendlabels")
            .data(colorScaleKeys)
            .enter()
            .append("text")
                .attr("y", margin.top+3)
                .attr("x", (key,index) => {return 35 + index*(size+5) + (size/2)})
                .style("fill", "black")
                .text(function(key){ return key})
                .attr("text-anchor", "left")
                .style("alignment-baseline", "middle");


    /*******************************************
    *****************Lollipop*******************
    ********************************************/
    let yMethods = [...new Set(data[0].map(item => item.method))];
    let lollipopRecords = [];
    yMethods.forEach( item => {
        let obj = {};
        obj.method = item;
        let lollipopCollection = data[0].filter(record => record.method === item);
        obj.count = lollipopCollection.length;
        obj.recordslost = 0;
        lollipopCollection.forEach(record => {
            obj.recordslost += parseFloat(record["records lost"].replace(/,/g, ''));
        });

        lollipopRecords.push(obj);
    })
    console.log(lollipopRecords)

    // max lollipop value for x axis max
    var maxX_lollipop = Math.max.apply(Math, lollipopRecords.map(record => record.recordslost))
    //Scaling the x axis to the width of the graph
    var xlolliScale = d3.scaleLinear()
                        .domain([0, maxX_lollipop])
                        .rangeRound([margin.left, margin_width]);

    // Scaling the y axis to the height of the graph
    var ylolliScale = d3.scaleBand()
                        .rangeRound([margin.top, margin_height])
                        .domain(lollipopRecords.map(d => d.method))
                        .padding(1);

    // Add x axis to the graph
    lollipop.append("g")
            .attr("transform", "translate(0," + margin_height + ")")
            .style("font", "15px times")
            .attr("stroke-width", "2px")
            .call(d3.axisBottom(xlolliScale));
    
    //Add y axis to the graph
    lollipop.append("g")
            .attr("transform", "translate(" + margin.left + ", 0)")
            .style("font", "15px times")
            .attr("stroke-width", "2px")
            .call(d3.axisLeft(ylolliScale));   
            
    // Lines
    lollipop.selectAll("lolliLine")
        .data(lollipopRecords)
        .enter()
        .append("line")
        .attr("x1", xlolliScale(0)) //start point
        .attr("y1", function(d) { return ylolliScale(d.method); })
        .attr("x2", d => xlolliScale(d.recordslost)) //end point (stops at x = 0)
        .attr("y2", function(d) { return ylolliScale(d.method); })
        .attr("stroke", "grey")
        .attr("stroke-width", "3px")

    //Tooltip for circles
    var lolli_tooltip = d3.select("#lollitip")
                    .style("position", "absolute")
                    .style("z-index", "10")
                    .style("visibility", "hidden")
                    .style("padding", "15px")
                    .style("color", "white") //text color
                    .style("background", "black") //bg color
                    .style("border", "2px solid white") //border
                    .style("border-radius", "25px")
                    .style("box-shadow", "10px 8px 2px 1px rgba(0, 0, 255, .2)");

    // Circles
    lollipop.selectAll("lolliCircle")
            .data(lollipopRecords)
            .enter()
            .append("circle")
            .attr("cx", data => xlolliScale(data.recordslost))
            .attr("cy", data => ylolliScale(data.method))
            .attr("r", "8")
            .style("fill", "#A020F0")
            .attr("stroke", "black")
            .attr("stroke-width", "2px")
            .on("mouseover", (event, d) => {
                d3.select(event.currentTarget)
                    .attr ("stroke-width", 10)
                    .attr ("opacity", "0.8");
                lolli_tooltip.text("Total Records Lost: " + d.recordslost)
                       .style("visibility", "visible")
                       .style("top", (event.pageY-10)+"px")
                       .style("left",(event.pageX+10)+"px");
            })
            .on("mouseout", (event) => {
                d3.select(event.currentTarget)
                    .attr("stroke-width", "2px")
                    .attr('opacity', '1');
                d3.select("#lollitip")
                    .text("")
                    .style("visibility", "hidden");
            });

})