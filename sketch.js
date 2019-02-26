var scaleX=d3.scale.linear().domain([0,10]).range([margin,width-margin]);

var svg=d3.select("body").append("svg")
    .attr("width",width)
    .attr("height",height);

var xAxis = d3.svg.axis()
    .scale(scaleX)
    .orient("bottom")
    .ticks(5)
    .tickSubdivide(5)
    .tickPadding(10)
    .tickFormat(function(d) { return d + " ticks"});

var x2Axis = d3.svg.axis()
    .scale(scaleX)
    .orient("bottom")
    .ticks(5)
    .tickSize(14)
    .tickFormat("");

svg.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(0," + (margin) + ")")
    .call(xAxis);

svg.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(0," + (margin) + ")")
    .call(x2Axis);