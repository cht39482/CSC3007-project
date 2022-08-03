function groupedBreach(data) {
    var grouped_breach = []
    data.forEach((element, id) => {
        var key = element["year"]
        var num_records = isNaN(element["records lost"]) ? 0 : parseInt(element["records lost"])
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
    var x_pos = event.pageX - (document.getElementById("svgContainer").getBoundingClientRect().x + 10) - 270
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
    var margin = { top: 30, right: 600, bottom: 70, left: 60 },
        margin_width = width - margin.left - margin.right,
        margin_height = height - margin.top - margin.bottom;
    Promise.all([d3.csv("breaches.csv")]).then(data => {
        var grouped_breach = groupedBreach(data[0])
        var svg = d3.select("#svgContainer")
            .append("svg")
            .attr("width", margin_width + margin.left + margin.right)
            .attr("height", margin_height + margin.top + margin.bottom)
            .attr("viewBox", [0, 0, width, height])
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -(height / 2))
            .attr("y", -40)
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
            .range([0, margin_width]);
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
            .attr("transform", "translate(" + 0 + "," + 0 + ")")
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
        var tooltip = d3.select("#svgContainer")
            .append("div")
            .attr("class", "tooltip-line")
            // .style("position", "relative")
            .style("padding", "8px");

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
            tooltip.style("left", xScale(d_result.year)+380 + "px")
            tooltip.style("top", yScale(d_result.count)+3550 + "px")
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
            .on("mouseover", function () {
                focus.style("display", null);
                tooltip.style("display", null);
                d3.select(".mouse-line").style("opacity", 0);
            })
            .on("mouseout", function () {
                focus.style("display", "none");
                tooltip.style("display", "none");
                d3.select(".mouse-line").style("opacity", 0);
            })
            .on("mousemove", mousemove);
    })
}
getLineChart();