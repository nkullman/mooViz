/** Non-normalized 2D scatterplot */
/*var scatter2dN = {};
scatter2dN["margin"] = { top: 20, right: 150, bottom: 50, left: 80 },
    scatter2dN["width"] = 1000 - scatter2dN["margin"].left - scatter2dN["margin"].right,
    scatter2dN["height"] = 650 - scatter2dN["margin"].top - scatter2dN["margin"].bottom,
    scatter2dN["xScale"] = d3.scaleLinear()
        .range([0, scatter2dN["width"]]),
    scatter2dN["yScale"] = d3.scaleLinear()
        .range([scatter2dN["height"], 0]),
    scatter2dN["xAxis"] = d3.axisBottom(scatter2dN["xScale"]);
scatter2dN["yAxis"] = d3.axisLeft(scatter2dN["yScale"]);
scatter2dN["objStates"],
    scatter2dN["encodeRadius"] = false,
    scatter2dN["dotRadius"] = 4,
    scatter2dN["radiusScaleRange"] = [scatter2dN["dotRadius"], scatter2dN["dotRadius"]],
    scatter2dN["radiusScale"] = d3.scaleSqrt().range(scatter2dN["radiusScaleRange"]),
    scatter2dN["k"] = 1;*/

/* Make the viz */
//makeParallelCoordsPlot("#ParallelCoordsDiv");

/**
 * Draws the Parallel coordinates visualization on the div
 * provided in the loc argument
 */
drawParallelCoordsPlot("ParallelCoordsDiv");

function drawParallelCoordsPlot(loc) {
    var pcmargin = { top: 30, right: 30, bottom: 30, left: 60 },
        pcwidth = 800 - pcmargin.left - pcmargin.right,
        pcheight = 400 - pcmargin.top - pcmargin.bottom;

    var objectives = Object.keys(datacols);

    var pcxScale = d3.scalePoint().range([0, pcwidth]),
        pcyScale = {},
        pcDragging = {};

    var pcline = d3.line(),
        pcaxis = d3.axisLeft(),
        pcforeground,
        dimensions;

    var pcsvg = d3.select("#" + loc).append("svg")
        .attr('id', "pcSVG")
        .attr('viewBox', "0 0 " + (pcwidth + pcmargin.right + pcmargin.left) + " " + (pcheight + pcmargin.top + pcmargin.bottom))
        .attr('preserveAspectRatio', "xMinYMin meet")
        .append("g")
        .attr("transform", "translate(" + pcmargin.left + "," + pcmargin.top + ")");

    //pcsvg.call(tip);

    // Extract the list of dimensions and create a scale for each.
    pcxScale.domain(dimensions = objectives.filter(function (d) {
        return (pcyScale[d] = d3.scaleLinear()
            .domain(d3.extent(data, function (p) { return +p[d]; }))
            .range([pcheight, 0]));
    }));

    // Add blue foreground lines for focus.
    pcforeground = pcsvg.append("g")
        .attr("class", "pcforeground")
        .selectAll("path")
        .data(data)
        .enter().append("path")
        .attr("class", function (d) { return "pcforegroundPath actionableDrawingElement " + d.mvid; })
        .attr("id", function (d) { return "pc-path-" + d.mvid; })
        .attr("stroke", function (d) { return colorScale(d.Frontier); })
        .style("fill", "none")
        .on('mouseover', function (d) {
            //d3.select(this).call(tip.show);
            classMeAndMyBrothers(d.mvid, "active", true);
        })
        .on('mouseout', function (d) {
            //d3.select(this).call(tip.hide);
            classMeAndMyBrothers(d.mvid, "active", false);
        })
        .on("click", function (d) {
            clickToggleSelected(d);
        })
        .attr("d", path)
        .attr("opacity", 0.2)
        .style("cursor", "pointer");


    // Add a group element for each dimension.
    var pcg = pcsvg.selectAll(".dimension")
        .data(dimensions)
        .enter().append("g")
        .attr("class", "dimension")
        .attr("transform", function (d) { return "translate(" + pcxScale(d) + ")"; });


    // Add an axis and title.
    pcg.append("g")
        .attr("class", "axis")
        .each(function (d) { d3.select(this).call(pcaxis.scale(pcyScale[d])); });
    pcg.append("text")
        .style("text-anchor", "middle")
        .attr("y", -9)
        .text(function (d) { return d; });

    // Add and store a brush for each axis.
    var theBrushes = pcg.append("g")
        .attr("class", "brush")
        .attr("objective", function (d) { return d; })
        .each(function (d) {
            pcyScale[d].brush = d3.brushY()
                .on("start", pcbrushstart)
                .on("brush", pcbrush)
                .extent([[-15, 0], [15, pcheight]]);
            pcyScale[d].brushEmpty = true;
            pcyScale[d].brushExtent = null;
            d3.select(this).call(pcyScale[d].brush);
        });

    // Ensure proper classing of paths
    //updateClassingOfSelectedSolutionsPathsAndDots(selectedSolutions);

    function position(d) {
        var v = pcDragging[d];
        return v == null ? pcxScale(d) : v;
    }

    function transition(g) {
        return g.transition().duration(500);
    }

    // Returns the path for a given data point.
    function path(d) {
        return pcline(dimensions.map(function (p) { return [position(p), pcyScale[p](d[p])]; }));
    }

    function pcbrushstart() {
        var currObj = this.getAttribute("objective");
        pcyScale[currObj].brushExtent = null;
        pcyScale[currObj].brushEmpty = true;
        d3.event.sourceEvent.stopPropagation();
        var actives = dimensions.filter(function (p) { return !pcyScale[p].brushEmpty; }),
            extents = actives.map(function (p) { return pcyScale[p].brushExtent; });
        selectedSolutions = [];
        d3.selectAll(".pcforegroundPath").each(function (d) {
            if (inPCBrushSelection(d, actives, extents)) {
                selectedSolutions.push(d.mvid);
            }
        });
        if (actives.length === 0) { selectedSolutions = []; }
        updateClassingOfSelectedSolutionsPathsAndDots(selectedSolutions);
    }

    function inPCBrushSelection(d, actives, extents) {
        return actives.every(function (p, i) {
            return extents[i][0] <= pcyScale[p](d[p]) && pcyScale[p](d[p]) <= extents[i][1];
        }) ? true : false;
    }

    // Handles a brush event, toggling the display of foreground lines.
    function pcbrush() {
        var currSelection = d3.event.selection,
            currObj = this.getAttribute("objective");
        pcyScale[currObj].brushEmpty = currSelection === null;
        pcyScale[currObj].brushExtent = currSelection;

        var actives = dimensions.filter(function (p) { return !pcyScale[p].brushEmpty; }),
            extents = actives.map(function (p) { return pcyScale[p].brushExtent; });
        selectedSolutions = [];
        d3.selectAll(".pcforegroundPath").each(function (d) {
            if (inPCBrushSelection(d, actives, extents)) {
                selectedSolutions.push(d.mvid);
            }
        });
        if (actives.length === 0) { selectedSolutions = []; }
        updateClassingOfSelectedSolutionsPathsAndDots(selectedSolutions);
    }
    function updateClassingOfSelectedSolutionsPathsAndDots(ss) {
        d3.selectAll(".actionableDrawingElement").classed("selected", false);
        ss.forEach(function (d) {
            d3.selectAll(".actionableDrawingElement." + d).classed("selected", true)
        });
    }
    function classMeAndMyBrothers(mvid, className, classification) {
        d3.selectAll(".actionableDrawingElement."+mvid).classed(className, classification)
    }
}