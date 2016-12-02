/** Non-normalized 2D scatterplot */
var scatter2d = {};
scatter2d["margin"] = { top: 20, right: 150, bottom: 50, left: 80 },
    scatter2d["width"] = 1000 - scatter2d["margin"].left - scatter2d["margin"].right,
    scatter2d["height"] = 650 - scatter2d["margin"].top - scatter2d["margin"].bottom,
    scatter2d["xScale"] = d3.scaleLinear()
        .range([0, scatter2d["width"]]),
    scatter2d["yScale"] = d3.scaleLinear()
        .range([scatter2d["height"], 0]),
    scatter2d["xAxis"] = d3.axisBottom(scatter2d["xScale"]);
scatter2d["yAxis"] = d3.axisLeft(scatter2d["yScale"]);
scatter2d["objStates"],
    scatter2d["encodeRadius"] = false,
    scatter2d["dotRadius"] = 6,
    scatter2d["radiusScaleRange"] = [scatter2d["dotRadius"], scatter2d["dotRadius"]],
    scatter2d["radiusScale"] = d3.scaleLinear().range(scatter2d["radiusScaleRange"]),
    scatter2d["k"] = 1;

/* Make the viz */
make2DScatterViz("#scatter2dVizDiv");

/**
 * Draws the 2D Scaterplot visualization on the div
 * provided in the loc argument
 */
function make2DScatterViz(loc) {
    // give ability to reset zoom
    d3.select("#zoomReset-scatter2d").on("click", function () {
        d3.select("#scatter2DSVG").transition().duration(750).call(zoomListener.transform, d3.zoomIdentity);
    });

    // define initial state of the objectives
    scatter2d["objStates"] = Object.keys(datacols);

    // initial canvas
    var svg = d3.select(loc).insert("svg", ":first-child")
        .attr('id', "scatter2DSVG")
        .attr('viewBox', "0 0 " + (scatter2d["width"] + scatter2d["margin"].right + scatter2d["margin"].left) + " " + (scatter2d["height"] + scatter2d["margin"].top + scatter2d["margin"].bottom))
        .attr('preserveAspectRatio', "xMinYMin meet")
        .append("g")
        .attr("transform", "translate(" + scatter2d["margin"].left + "," + scatter2d["margin"].top + ")");

    // define axes' domains
    scatter2d["xScale"].domain(d3.extent(data, function (d) { return d[scatter2d["objStates"][0]]; })).nice();
    scatter2d["yScale"].domain(d3.extent(data, function (d) { return d[scatter2d["objStates"][1]]; })).nice();
    scatter2d["radiusScale"].domain(d3.extent(data, function (d) { return d[scatter2d["objStates"][2]]; })).nice()

    // handling zoom
    var zoomListener = d3.zoom()
        .scaleExtent([1, 10])
        .on("zoom", zoomHandler);

    d3.select("#scatter2DSVG").call(zoomListener);

    svg.append("g")
        .attr("class", "x axis scatter2d")
        .attr("transform", "translate(0," + scatter2d["height"] + ")")
        .on("click", updateObjStates)
        .call(scatter2d["xAxis"]);

    svg.append("text")
        .attr("class", "label xAxisLabel")
        .attr("id", "xAxisLabel-scatter2d")
        .on("click", function () { updateObjStates("x") })
        .attr("x", 0.5 * scatter2d["width"])
        .attr("y", scatter2d["height"] + 0.8 * scatter2d.margin.bottom)
        .style("text-anchor", "middle")
        .style("cursor", "pointer")
        .text(scatter2d["objStates"][0]);

    svg.append("g")
        .attr("class", "y axis scatter2d")
        .call(scatter2d["yAxis"]);

    svg.append("text")
        .attr("class", "label yAxisLabel")
        .attr("id", "yAxisLabel-scatter2d")
        .on("click", function () { updateObjStates("y") })
        .attr("x", -(scatter2d.height / 2))
        .attr("y", -0.8 * scatter2d.margin.left)
        .attr("transform", "rotate(-90)")
        .style("text-anchor", "middle")
        .style("cursor", "pointer")
        .text(scatter2d["objStates"][1]);

    svg.selectAll(".dot.scatter2d")
        .data(data)
        .enter().append("circle")
        .attr("class", function (d) { return "dot scatter2d actionableDrawingElement" + d.mvid; })
        .attr("id", function (d) { return "dot-scatter2d-" + d.mvid; })
        .on('mouseover', function (d) {
            //d3.select(this).call(tip.show);
            classingVizObjects(d.mvid, "active", true);
        })
        .on('mouseout', function (d) {
            //d3.select(this).call(tip.hide);
            classingVizObjects(d.mvid, "active", false);
        })
        .on("click", function (d) {
            clickToggleSelected(d.mvid);
        })
        .attr("r", function (d) { return scatter2d["radiusScale"](d[scatter2d["objStates"][2]]) / scatter2d.k; })
        .attr("cx", function (d) { return scatter2d["xScale"](d[scatter2d["objStates"][0]]); })
        .attr("cy", function (d) { return scatter2d["yScale"](d[scatter2d["objStates"][1]]); })
        .attr("fill", function (d) { return colorScale(d.Frontier); })
        .attr("opacity", 0.75)
        .style("cursor", "pointer");

    makeRadiusLegend();

    function zoomHandler() {
        // update curr zoom extent on scatter2d
        scatter2d.k = d3.event.transform.k;
        // update axes
        svg.select(".x.axis.scatter2d").call(scatter2d["xAxis"].scale(d3.event.transform.rescaleX(scatter2d["xScale"])));
        svg.select(".y.axis.scatter2d").call(scatter2d["yAxis"].scale(d3.event.transform.rescaleY(scatter2d["yScale"])));
        // update points
        d3.selectAll(".dot.scatter2d")
            .attr("transform", d3.event.transform)
            .attr("r", function (d) { return scatter2d["radiusScale"](d[scatter2d["objStates"][2]]) / scatter2d.k });
    }

    // handle axes updating on click of text
    function updateObjStates(axisClicked) {
        if (axisClicked === "x") {
            // move first element to back of array, advance others besides element at i=1
            scatter2d["objStates"].push(scatter2d["objStates"].shift());
            scatter2d["objStates"].splice(1, 0, scatter2d["objStates"].splice(0, 1)[0]);
            // update the x and radius scales
            scatter2d["xScale"].domain(d3.extent(data, function (d) { return d[scatter2d["objStates"][0]]; })).nice();
            scatter2d["radiusScale"].domain(d3.extent(data, function (d) { return d[scatter2d["objStates"][2]]; })).nice();
            // update the axes
            d3.select(".x.axis.scatter2d").call(scatter2d["xAxis"]);
            d3.select("#xAxisLabel-scatter2d").text(scatter2d["objStates"][0]);
            // update the zoom behavior
            d3.select("#scatter2DSVG").call(zoomListener);
            // update the circles' x position (radius updated in later call to zoomListener(?))
            d3.selectAll(".dot.scatter2d").transition().duration(1000)
                .attr("cx", function (d) { return scatter2d["xScale"](d[scatter2d["objStates"][0]]) })
        } else { // clicked === "y"
            // move second element to the end
            scatter2d["objStates"].splice(scatter2d["objStates"].length - 1, 0, scatter2d["objStates"].splice(1, 1)[0]);
            // update the y and radius scales
            scatter2d["yScale"].domain(d3.extent(data, function (d) { return d[scatter2d["objStates"][1]]; })).nice();
            scatter2d["radiusScale"].domain(d3.extent(data, function (d) { return d[scatter2d["objStates"][2]]; })).nice();
            // update the axes
            d3.select(".y.axis.scatter2d").call(scatter2d["yAxis"]);
            d3.select("#yAxisLabel-scatter2d").text(scatter2d["objStates"][1]);
            // update the zoom behavior
            d3.select("#scatter2DSVG").call(zoomListener);
            // update the circles' y position (radius updated in later call to zoomListener(?))
            d3.selectAll(".dot.scatter2d").transition().duration(1000)
                .attr("cy", function (d) { return scatter2d["yScale"](d[scatter2d["objStates"][1]]) })
        }
        // update radius legend
        d3.select(this).call(updateRadiusLegend);
        // reset zoom
        d3.select("#scatter2DSVG").transition().duration(750).call(zoomListener.transform, d3.zoomIdentity);
    }

    // radius-updating
    d3.select("#radiusEncode-scatter2d")
        .on("click", function () {
            scatter2d.encodeRadius = !scatter2d.encodeRadius;
            if (scatter2d.encodeRadius) {
                scatter2d.radiusScaleRange = [scatter2d.dotRadius, scatter2d.dotRadius * 4];
                scatter2d.radiusScale.range(scatter2d.radiusScaleRange);
                updateRadiusLegend();
                d3.select("#radiuslegendG-scatter2d").classed("hidden", false);
            } else {
                d3.select("#radiuslegendG-scatter2d").classed("hidden", true);
                scatter2d.radiusScaleRange = [scatter2d.dotRadius, scatter2d.dotRadius];
                scatter2d.radiusScale.range(scatter2d.radiusScaleRange);
            }
            // update the circles
            d3.selectAll(".dot.scatter2d").transition()
                .attr("r", function (d) { return scatter2d.radiusScale(d[scatter2d.objStates[2]]) / scatter2d.k; });
        });

    function updateRadiusLegend() {
        // update legend vals...
        var radiusLegendVals = scatter2d.radiusScale.domain().map(function (d) { return d; })
        radiusLegendVals.splice(1, 0, d3.mean(scatter2d.radiusScale.domain()));
        // update title
        d3.select("#radiusLegendTitle-2dscatter").text(scatter2d.objStates[2]);
        // update entries' circle sizes
        d3.selectAll(".radiusLegendEntry-scatter2d").attr("r", function (d, i) { return scatter2d.radiusScale(radiusLegendVals[i]); })
        // update entries' text
        d3.selectAll(".radiusLegendText-scatter2d").text(function (d, i) { return radiusLegendVals[i]; })
    }

    function makeRadiusLegend() {

        // legend indent from plot
        var legIndent = 0.05 * scatter2d.margin.right;
        var largestRadius = scatter2d.radiusScale.range()[1];
        // legend entries
        var radiusLegendVals = scatter2d.radiusScale.domain();
        radiusLegendVals.splice(1, 0, d3.mean(scatter2d.radiusScale.domain()));

        // main legend group
        var legG = svg.append("g")
            .attr('id', "radiuslegendG-scatter2d")
            .attr("class", "hidden")
            .attr("transform", "translate(" + scatter2d.width + ",0)");

        // title
        legG.append("text")
            .attr("x", legIndent)
            .attr("class", "legendTitle")
            .attr("id", "radiusLegendTitle-2dscatter")
            .style("text-anchor", "beginning")
            .style("font-size", "1.5em")
            .text(scatter2d.objStates[2]);

        // groups for each legend entry
        var legend = legG.selectAll(".legend")
            .data(radiusLegendVals)
            .enter().append("g")
            .attr("class", "legend")
            .attr("transform", function (d, i)
            { return "translate(" + (legIndent + largestRadius) + "," + (i + 1) * 10 * largestRadius + ")"; });

        // circles on the legend entries
        legend.append("circle")
            .attr("x", 2 * scatter2d.radiusScale(radiusLegendVals[2]))
            .attr("class", "radiusLegendEntry-scatter2d")
            .attr("r", function (d, i) { return scatter2d.radiusScale(radiusLegendVals[i]); })
            .attr("fill", "#eee");

        // text for the legend entries
        legend.append("text")
            .attr("x", 5 * largestRadius)
            .attr("y", "0.5em")
            .attr("class", "radiusLegendText-scatter2d")
            .style("text-anchor", "beginning")
            .style("font-size", "1.15em")
            .text(function (d) { return d; });
    }
}