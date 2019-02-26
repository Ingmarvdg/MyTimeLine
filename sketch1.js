d3.csv("pointdata.csv").then(function(data) {

    data.forEach(function(d) {
        d.start = parseDate(d.start);
        d.end = parseDate(d.end);
        d.height = parseInt(d.height);
        d.duration = d.end - d.start;
    });

    data.sort(function(a, b) {
        return b.duration - a.duration;
    });

    // constants for dates and sizes of stuff

    const miniRectHeight = 15;

    var numberOfLanes = 0;

    var stackedRects = [];

    data.forEach(function(d) {
        while(overlap(d, stackedRects.filter(function(r) {
            return d.lane === r.lane}))) {
            d.lane = parseInt(d.lane) + 1;
            if (d.lane > numberOfLanes) {
                numberOfLanes = d.lane;
            }
        }
        stackedRects.push(d);
    });

    const xMargin = 40;

    const axisMargin = 100;
    const width = innerWidth - xMargin;
    const headerHeight = document.getElementById("header").offsetHeight;
    const height = innerHeight - headerHeight;


    const miniHeight = numberOfLanes * miniRectHeight;
    const miniWidth = width - xMargin*2;
    const mainHeight = height - (2*axisMargin) - miniHeight;

    const earliestDate = d3.min(data, function(d) {
        return d.start;
    });
    const latestDate = Date.now();

    const rectHeight = mainHeight/(numberOfLanes);

    // scales

    const timeScaleMini = d3.scaleTime()
        .domain([earliestDate, latestDate])
        .range([0, miniWidth]);

    const timeScale = d3.scaleTime()
        .range([0, width]);

    const yScaleMini = d3.scaleLinear()
        .domain([numberOfLanes, 1])
        .range([miniRectHeight, miniHeight]);

    const yScale = d3.scaleLinear()
        .domain([numberOfLanes, 1])
        .range([rectHeight, mainHeight]);


    // data stacking loop

    stackedRects = [];

    data.forEach(function(d) {
        while(overlap(d, stackedRects.filter(function(r) {
            return d.lane === r.lane}))) {
            d.lane = parseInt(d.lane) + 1;
            if (d.lane > numberOfLanes) {
                numberOfLanes = d.lane;
            }
        }
        stackedRects.push(d);
    });

    // create chart

    const chart = d3.select("#field")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    chart.append("defs").append("clipPath")
        .attr("id", "clip")
        .attr("width", width)
        .attr("height", mainHeight);

    // mini axis

    const miniAxis = d3.axisBottom()
        .scale(timeScaleMini)
        .ticks(d3.timeYear.every(1))
        .tickSizeOuter(0);

    chart.append("g")
        .attr("transform", "translate(" + xMargin + "," + (mainHeight + axisMargin + miniHeight + miniRectHeight) + ")")
        .attr("class", "mini axis")
        .call(miniAxis);
    
    // main axis

    const mainAxis = d3.axisBottom()
        .scale(timeScale)
        .tickFormat(d3.timeFormat("%Y-%m-%d"))
        .ticks(d3. timeMonth.every(6));

    chart.append("g")
        .attr("transform", "translate(" + 0 + "," + (mainHeight) + ")")
        .attr("class", "main axis")
        .call(mainAxis);

    // add main and mini

    const main = chart.append("g")
        .attr("transform", "translate(0,-" + parseInt(0) + ")" )
        .attr("width", width)
        .attr("height", mainHeight)
        .attr("class", "main");

    const mini = chart.append("g")
        .attr("transform", "translate(" + xMargin + "," + (mainHeight + axisMargin) + ")")
        .attr("width", miniWidth)
        .attr("height", miniHeight)
        .attr("class", "mini");

    const itemRects = main.append("g")
        .attr("clip_path", "url(#clip)");

    const flagRects = main.append("g")
        .attr("clip_path", "url(#clip)");

    // mini item rectangles

    mini.append("g").selectAll("miniItems")
        .data(data)
        .enter().append("rect")
        .attr("class", "minirect")
        .attr("id", function(d) {return d.type;})
        .attr("x", function(d) {return timeScaleMini(d.start);})
        .attr("y", function(d) {return yScaleMini(d.lane)})
        .attr("width", function(d) {return timeScaleMini(d.end) - timeScaleMini(d.start);})
        .attr("height", miniRectHeight);

    const brush = d3.brushX()
        .on("brush", display)
        .extent([[0, miniRectHeight], [miniWidth, miniHeight + miniRectHeight]]);

    const brushStart = timeScaleMini(new Date(2012,1,1));
    const brushEnd = timeScaleMini(new Date(2013,1,1));

    mini.append("g")
        .attr("class", "brushx")
        .call(brush)
        .call(brush.move, [brushStart, brushEnd])
        .selectAll("rect")
        .attr("y", miniRectHeight)
        .attr("height", miniHeight + miniRectHeight);

    // removes handle to resize the brush
    d3.selectAll('.brushx>.handle').remove();
    // removes crosshair cursor
    d3.selectAll('.brushx>.overlay').remove();

    function display() {
        const textPadding = 20;
        const labelSize = 30;
        const selection = d3.event.selection;
        const minExtent = timeScaleMini.invert(selection[0]);
        const maxExtent = timeScaleMini.invert(selection[1]);
        const visItems = data.filter(function(d) { return d.start < maxExtent && d.end > minExtent;});

        mini.select(".brush")
            .call(brush.extent([minExtent, maxExtent]));

        timeScale.domain([minExtent, maxExtent]);

        const mainAxis = d3.axisBottom()
            .scale(timeScale)
            .tickFormat(d3.timeFormat("%Y-%m-%d"))
            .ticks(d3.timeMonth.every(6));

        chart.selectAll("g.main.axis")
            .call(mainAxis);

        // main rectangles

        const rects = itemRects.selectAll("rect")
            .data(visItems, function(d) { return d.id; })
            .attr("x", function(d) { return timeScale(d.start);})
            .attr("width", function(d) { return timeScale(d.end) - timeScale(d.start);});

        rects.enter().append("rect")
            .attr("class", "mainrect")
            .attr("id", function(d) { return d.type})
            .attr("x", function(d) { return timeScale(d.start);})
            .attr("y", function(d) { return yScale(d.lane) - rectHeight})
            .attr("width", function(d) { return timeScale(d.end) - timeScale(d.start);})
            .attr("height", rectHeight);

        const flags = flagRects.selectAll("rect")
            .data(visItems, function(d) { return d.id; })
            .attr("x", function(d) { return timeScale(Math.max(d.start, minExtent));})
            .attr("width", function(d) { return textPadding/2;});

        flags.enter().append("rect")
            .attr("class", "flagrect")
            .attr("id", function(d) { return d.type})
            .attr("x", function(d) { return timeScale(Math.max(d.start, minExtent));})
            .attr("y", function(d) { return yScale(d.lane) - rectHeight})
            .attr("width", textPadding/2)
            .attr("height", rectHeight);

        rects.exit().remove();
        flags.exit().remove();

        const labels = itemRects.selectAll("foreignObject")
            .data(visItems, function (d) { return d.id; })
            .attr("width", 400)
            .attr("height", rectHeight)
            .attr("x", function(d) { return timeScale(Math.max(d.start, minExtent)) + textPadding ;})
            .attr("y", function(d) { return yScale(d.lane) - rectHeight});

        labels.enter().append("foreignObject")
            .attr("class", "labels")
            .attr("id", function(d) { return d.type})
            .attr("x", function(d) { return timeScale(Math.max(d.start, minExtent)) + textPadding ;})
            .attr("y", function(d) { return yScale(d.lane) - rectHeight})
            .attr("width", 400)
            .attr("height", rectHeight)
            .append("xhtml:p")
            .html(function(d) {
                const options = {year: 'numeric', month: 'long', day: 'numeric'};
                return(
             "<p>" + d.title + "</p>" + "<p>" + d.location + "</p>" + "<p>" + d.start.toLocaleDateString(options) + " - " + d.end.toLocaleDateString(options) + "</p>"
            )
            });

        labels.exit().remove();
    }

});

function parseDate(date) {
    const parts = date.split('-');
    return new Date(parts[2], parts[1] - 1, parts[0]);
}

function overlap(bar, list) {
    value = false;
    for ( i=0; i<list.length; i++) {
        if (!(bar.start > list[i].end || bar.end < list[i].start )) {
            value = true;
        }
    }
    return value;
}