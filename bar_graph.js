

function number_of_records(data_lost_pop) {
  range_no = 5
  cat_name = ["Email Addreesses Etc", "Personal Details,Passwords", "Credit Cards,Banking Etc" , "Heath & Personal Data" , "Full /Sensitive Details"]

  total_loss_cat = []
  for (let i = 1; i < range_no; i++) {
    let total_sum = 0
    let loss_type = data_lost_pop.filter(function(y) {
      return parseInt(y.sensitivity) == i; });
      loss_type.forEach(x => {
        clean_lost = x.lost.replace(',', '')
        total_sum += parseFloat(clean_lost);
    });
    total_loss_cat.push({sensitivity: cat_name[i],  lost: total_sum});
  }
  console.log(total_loss_cat)
  return total_loss_cat
}




function bar_graph() {  
    // Load external data
    Promise.all([d3.csv("https://june-han.github.io/DataBreach_HeatMap/data/breaches.csv")]).then(data_lost => {
      let data_lost_pop = data_lost[0].map((x) => ({ sensitivity: x["data sensitivity"],  lost: x["records lost"]}));
      console.log(data_lost_pop)
      total_loss_cat = number_of_records(data_lost_pop)

      let set_width = 660, set_height = 500;

      var margin = {top: 30, right: 30, bottom: 70, left: 60},
      width = set_width - margin.left - margin.right,
      height = set_height - margin.top - margin.bottom;

      var tooltip = d3.select("#bar_chart_div")
            .append("rect")
            .attr("id", "tooltip")
            .style("position", "absolute")
            .style("background-color", "#D6D5CB")
            .style("padding", "8px")
            .style("visibility", "hidden");

    var chart = d3.select("#bar_chart_div")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);


    var xScale = d3.scaleBand()
      .domain(total_loss_cat.map(function (d) { return d.sensitivity; }))
      .rangeRound([0, width])
      .padding(0.2);

    chart.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(xScale))
      .selectAll("text")
    
    var yScale = d3.scaleLinear()
      .domain([0, 17788576])
      .rangeRound([height, 0]);

    chart.append("g")
      .call(d3.axisLeft(yScale).ticks(10));

    let colorScale = d3.scaleLinear()
      .domain([0, 300])
      .range([0, 1]);

    // Append rectangles
    chart.selectAll("rect")
      .data(total_loss_cat)
      .join("rect")
      .attr("fill", d => d3.interpolateRainbow(colorScale(d.lost)))
      .attr("x", function (d) { return xScale(d.sensitivity); })
      .attr("y", function (d) { return yScale(d.lost); })
      .attr("width", function (d) { return xScale.bandwidth(); })
      .attr("height", function (d) { return height - yScale(d.lost); })

      .on("mouseover", (event, d) => {
        tooltip.style("visibility", "visible")
          .style('left', event.pageX + 'px')
          .style('top', event.pageY - 50 + 'px')
          .text(" Number of Data Loss : " + d.lost);

        d3.select(event.currentTarget)
          .attr("stroke", "black")
          .attr("stroke-width", 3)

      })

      .on("mouseout", (event, d) => {
        d3.select(event.currentTarget)
          .attr("stroke", "none");

        tooltip.style("visibility", "hidden");

      })
    }) 
  }

  bar_graph();