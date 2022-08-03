function groupedBreach(data) {
    console.log(data)
    var grouped_breach = []
    data.forEach((element, id) => {
        var key = element["year"]
        console.log(isNaN(element["records lost"]))
        var num_records =  parseInt(element["records lost"].replace(/,/g,""))
        var found = grouped_breach.find(r => r.year === key);
        if (found && "count" in found) {
            found.count += num_records
            found.num_companies+=1
            id = grouped_breach.findIndex(r => r.year === key)
            grouped_breach[id] = found
            
        } else {
            grouped_breach.push({ year: key, count: num_records,num_companies:1 })
        }
    });
    return grouped_breach
}
function getXvalue(event, xScale) {
    var x_pos = event.pageX - (document.getElementById("lineChart").getBoundingClientRect().x + 10) - 10
    var domain = xScale.domain()
    var range = xScale.range()
    var rangePoints = d3.range(range[0], range[1] + 59, xScale.step())
    var id = (d3.bisect(rangePoints, x_pos) - 1)
    id = id < 0 ? 0 : id;
    var x_val = domain[id];
    return x_val
}
function getLineChart() {

    // function check
    let width = 1400, height = 800;
    var margin = { top: 30, right: 20, bottom: 70, left: 60 },
        margin_width = width - margin.left - margin.right,
        margin_height = height - margin.top - margin.bottom;
    Promise.all([d3.csv("https://june-han.github.io/DataBreach_HeatMap/data/breaches.csv")]).then(data => {   
        var grouped_breach = groupedBreach(data[0])
        grouped_breach.reverse()
        var temp=grouped_breach[12]
        grouped_breach[12]=grouped_breach[13]
        grouped_breach[13]=temp

        var svg = d3.select("#lineChart")
                    .attr("width", margin_width + margin.left+50 + margin.right)
                    .attr("height", margin_height + margin.top + margin.bottom)
                    .attr("viewBox", [0, 0, width, height])

        svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -(height / 2))
            .attr("y", margin.left-40)
            .style("text-anchor", "middle")
            .text("Number of data breaches");
        svg.append("text")
            .attr("x", margin_width / 2)
            .attr("y", height - 60)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .text("Data breaches across years");

        //For focus
        var focus = svg.append("g")
            .style("display", "none")
            .style("fill", "steelblue");
        svg.append("path").attr("class", "mouse-line")
            .style("stroke", "black")
            .style("stroke-width", "1px")
            .style("opacity", "0");
        focus.append("circle").attr("r", 5);
        //Scaling maps
        var recordmap = d3.map(grouped_breach, d => d.count);

        var xScale = d3.scalePoint()
            .domain(d3.map(grouped_breach, d => d.year).values())
            .range([margin.left, margin_width]);
        var yScale = d3.scaleLinear()
            .domain([d3.min(recordmap), d3.max(recordmap)])
            .range([margin_height, margin.top]);
        // Add x-axis
        svg.append("g")
            .attr("class", "axis axis-x")
            .attr("transform", "translate(" + 0 + "," + (margin_height) + ")")
            .call(d3.axisBottom(xScale));
        // Add y-axis
        svg.append("g")
            .attr("class", "axis axis-y")
            .attr("transform", "translate(" + margin.left + "," + 0 + ")")
            .call(d3.axisLeft(yScale).ticks(10, "~s"));
        //draw path
        svg.append("path")
            .datum(grouped_breach)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5)
            .attr("d", d3.line()
                .x(d => xScale(d.year))
                .y(d => yScale(d.count)));
        //for tooltip
        var tooltip = d3.select("#linetip")
                        .style("position", "absolute")
                        .style("z-index", "10")
                        .style("visibility", "hidden")
                        .style("padding", "15px")
                        .style("color", "white") //text color
                        .style("background", "black") //bg color
                        .style("border", "2px solid white") //border
                        .style("border-radius", "25px")
                        .style("box-shadow", "10px 8px 2px 1px rgba(0, 0, 255, .2)");

        var bisectYear = d3.bisector(function (d) { return d.year; }).right;
        var mousemove = function (event, d) {
            var x_val = getXvalue(event, xScale);
            var i = bisectYear(grouped_breach, x_val, 1);
            var d0 = grouped_breach[i - 1];
            var d1 = d0.year == "2022" ? d0 : grouped_breach[i];
            var d0_date = new Date(d0.year, 0);
            var d1_date = new Date(d1.year, 0);
            var d_result = x_val - d0_date > d1_date - x_val ? d1 : d0;
            focus.attr("transform", "translate(" + xScale(d_result.year) + "," + yScale(d_result.count) + ")");
            tooltip.style("left", event.pageX + "px")
            tooltip.style("top",  event.pageY+ "px")
            tooltip.html(`<b>${d_result.year}</b>` + "<br />" + d_result.count +" records"+  "<br />" + d_result.num_companies+" companies")
            d3.select(".mouse-line")
                .attr("d", d3.line()([[xScale(d_result.year), 0], [xScale(d_result.year), margin_height]]))
                .style("opacity", 1)
                .style("stroke", "grey");
        }
        svg.selectAll("rect")
            .data(grouped_breach)
            .enter()
            .append("rect")
            .attr("class", "overlay")
            .attr("width", margin_width)
            .attr("height", margin_height)
            .style("fill", "none")
            .attr('pointer-events', 'all')
            .on("mouseover", function (event) {
                focus.style("display", null);
                tooltip.style("visibility", "visible")
                        .style("top", (event.pageY-10)+"px")
                        .style("left",(event.pageX+10)+"px");
                d3.select(".mouse-line").style("opacity", 0);
            })
            .on("mouseout", function () {
                focus.style("display", "none");
                tooltip.style("visibility", "hidden");
                d3.select(".mouse-line").style("opacity", 0);
            })
            .on("mousemove", mousemove);
    })
}
getLineChart();