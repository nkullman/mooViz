/** Non-normalized 2D scatterplot */
var scatter2dN = {};
scatter2dN["margin"] = {top: 20, right: 150, bottom: 50, left: 80},
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
scatter2dN["radiusScaleRange"] = [scatter2dN["dotRadius"],scatter2dN["dotRadius"]],
scatter2dN["radiusScale"] = d3.scaleSqrt().range(scatter2dN["radiusScaleRange"]),
scatter2dN["k"] = 1;

/* Make the viz */
make2dscatterNViz("#scatter2dNVizDiv");

/**
 * Draws the 2D Scaterplot visualization on the div
 * provided in the loc argument
 */
function make2dscatterNViz(loc){
    // give ability to reset zoom
    d3.select("#zoomReset-scatter2dN").on("click",function(){
        d3.select("#scatter2dNSVG").transition().duration(750).call(zoomListener.transform, d3.zoomIdentity);
    });

    // define initial state of the objectives
    scatter2dN["objStates"] = Object.keys(ndatacols);

    // initial canvas
    var svg = d3.select(loc).insert("svg",":first-child")
        .attr('id',"scatter2dNSVG")
        .attr('viewBox', "0 0 " + (scatter2dN["width"] + scatter2dN["margin"].right + scatter2dN["margin"].left) + " " + (scatter2dN["height"] + scatter2dN["margin"].top + scatter2dN["margin"].bottom))
        .attr('preserveAspectRatio',"xMinYMin meet")
    .append("g")
        .attr("transform", "translate(" + scatter2dN["margin"].left + "," + scatter2dN["margin"].top + ")");

    // define axes' domains
    scatter2dN["xScale"].domain(d3.extent(ndata, function(d) { return d[scatter2dN["objStates"][0]]; })).nice();
    scatter2dN["yScale"].domain(d3.extent(ndata, function(d) { return d[scatter2dN["objStates"][1]]; })).nice();
    scatter2dN["radiusScale"].domain(d3.extent(ndata, function(d) { return d[scatter2dN["objStates"][2]]; })).nice()

    // handling zoom
    var zoomListener = d3.zoom()
        .scaleExtent([1,10])
        .on("zoom", zoomHandler);

    d3.select("#scatter2dNSVG").call(zoomListener);

    svg.append("g")
      .attr("class", "x axis scatter2dN")
      .attr("transform", "translate(0," + scatter2dN["height"] + ")")
      .on("click",updateObjStates)
      .call(scatter2dN["xAxis"]);

    svg.append("text")
      .attr("class", "label xAxisLabel")
      .attr("id","xAxisLabel-scatter2dN")
      .on("click", function(){updateObjStates("x")})
      .attr("x", 0.5*scatter2dN["width"])
      .attr("y", scatter2dN["height"]+0.8*scatter2dN.margin.bottom)
      .style("text-anchor", "middle")
      .style("cursor", "pointer")
      .text(scatter2dN["objStates"][0]);

    svg.append("g")
      .attr("class", "y axis scatter2dN")
      .call(scatter2dN["yAxis"]);

    svg.append("text")
      .attr("class", "label yAxisLabel")
      .attr("id","yAxisLabel-scatter2dN")
      .on("click", function(){updateObjStates("y")})
      .attr("x", -(scatter2dN.height/2))
      .attr("y",-0.8*scatter2dN.margin.left)
      .attr("transform", "rotate(-90)")
      .style("text-anchor", "middle")
      .style("cursor", "pointer")
      .text(scatter2dN["objStates"][1]);

    svg.selectAll(".dot.scatter2dN")
        .data(ndata)
        .enter().append("circle")
        .attr("class", function(d){ return "dot scatter2dN "+d.mvid; })
        .attr("id", function(d){ return "dot-scatter2dN-" + d.mvid; })
        //.classed("selected", false)
        .on('mouseover', function(){
            //d3.select(this).call(tip.show);
            //classMeAndMyBrothers(this, "active", true);
            console.log("mouseover! " + this.id);
            })
        .on('mouseout', function(){
            //d3.select(this).call(tip.hide);
            //classMeAndMyBrothers(this, "active", false);
            console.log("mouseout! " + this.id);
            })
        .on("click", function(d){
            //clickToggleSelected(d);
            console.log("click! " + this.id);
            updateObjStates("y");
        })
        .attr("r", function(d) {return scatter2dN["radiusScale"](d[scatter2dN["objStates"][2]])/scatter2dN.k;})
        .attr("cx", function(d) { return scatter2dN["xScale"](d[scatter2dN["objStates"][0]]); })
        .attr("cy", function(d) { return scatter2dN["yScale"](d[scatter2dN["objStates"][1]]); })
        .attr("fill", function(d) { return colorScale(d.Frontier); })
        .attr("opacity", 0.2)
        .style("cursor","pointer");

    makeRadiusLegend("#radiusLegendHolder-scatter2dN");

    function zoomHandler() {
        // update curr zoom extent on scatter2dN
        scatter2dN.k = d3.event.transform.k;
        // update axes
        svg.select(".x.axis.scatter2dN").call(scatter2dN["xAxis"].scale(d3.event.transform.rescaleX(scatter2dN["xScale"])));
        svg.select(".y.axis.scatter2dN").call(scatter2dN["yAxis"].scale(d3.event.transform.rescaleY(scatter2dN["yScale"])));
        // update points
        d3.selectAll(".dot.scatter2dN")
            .attr("transform", d3.event.transform)
            .attr("r", function(d) {return scatter2dN["radiusScale"](d[scatter2dN["objStates"][2]])/scatter2dN.k});
    }

    // handle axes updating on click of text
    function updateObjStates(axisClicked){
        if (axisClicked === "x"){
            // move first element to back of array, advance others besides element at i=1
            scatter2dN["objStates"].push(scatter2dN["objStates"].shift());
            scatter2dN["objStates"].splice(1,0,scatter2dN["objStates"].splice(0,1)[0]);
            // update the x and radius scales
            scatter2dN["xScale"].domain(d3.extent(ndata, function(d) { return d[scatter2dN["objStates"][0]]; })).nice();
            scatter2dN["radiusScale"].domain(d3.extent(ndata, function(d) { return d[scatter2dN["objStates"][2]]; })).nice();
            // update the axes
            d3.select(".x.axis.scatter2dN").call(scatter2dN["xAxis"]);
            d3.select("#xAxisLabel-scatter2dN").text(scatter2dN["objStates"][0]);
            // update the zoom behavior
            d3.select("#scatter2dNSVG").call(zoomListener);
            // update the circles' x position (radius updated in later call to zoomListener(?))
            d3.selectAll(".dot.scatter2dN").transition().duration(1000)
                .attr("cx", function(d) {return scatter2dN["xScale"](d[scatter2dN["objStates"][0]])})
        } else { // clicked === "y"
            // move second element to the end
            scatter2dN["objStates"].splice(scatter2dN["objStates"].length-1,0,scatter2dN["objStates"].splice(1,1)[0]);
            // update the y and radius scales
            scatter2dN["yScale"].domain(d3.extent(ndata, function(d) { return d[scatter2dN["objStates"][1]]; })).nice();
            scatter2dN["radiusScale"].domain(d3.extent(ndata, function(d) { return d[scatter2dN["objStates"][2]]; })).nice();
            // update the axes
            d3.select(".y.axis.scatter2dN").call(scatter2dN["yAxis"]);
            d3.select("#yAxisLabel-scatter2dN").text(scatter2dN["objStates"][1]);
            // update the zoom behavior
            d3.select("#scatter2dNSVG").call(zoomListener);
            // update the circles' y position (radius updated in later call to zoomListener(?))
            d3.selectAll(".dot.scatter2dN").transition().duration(1000)
                .attr("cy", function(d) {return scatter2dN["yScale"](d[scatter2dN["objStates"][1]])})
        }
        // update radius legend
        d3.select(this).call(updateRadiusLegend);
        // reset zoom
        d3.select("#scatter2dNSVG").transition().duration(750).call(zoomListener.transform, d3.zoomIdentity);
    }

    // radius-updating
    d3.select("#radiusEncode-scatter2dN")
        .on("click", function(){
            scatter2dN.encodeRadius = !scatter2dN.encodeRadius;
            if (scatter2dN.encodeRadius){
                scatter2dN.radiusScaleRange = [scatter2dN.dotRadius, scatter2dN.dotRadius*4];
                scatter2dN.radiusScale.range(scatter2dN.radiusScaleRange);
                updateRadiusLegend();
                d3.select("#radiuslegendG-scatter2dN").classed("hidden",false);
            } else {
                d3.select("#radiuslegendG-scatter2dN").classed("hidden",true);
                scatter2dN.radiusScaleRange = [scatter2dN.dotRadius, scatter2dN.dotRadius];
                scatter2dN.radiusScale.range(scatter2dN.radiusScaleRange);
            }
            // update the circles
            d3.selectAll(".dot.scatter2dN").transition()
                .attr("r", function(d) {return scatter2dN.radiusScale(d[scatter2dN.objStates[2]])/scatter2dN.k;});
      });

      function updateRadiusLegend(){
        // update legend vals...
        var radiusLegendVals = scatter2dN.radiusScale.domain().map(function(d) {return d;})
        radiusLegendVals.splice(1,0,d3.mean(scatter2dN.radiusScale.domain()));
        // update title
        d3.select("#radiusLegendTitle-2dscatterN").text(scatter2dN.objStates[2]);
        // update entries' circle sizes
        d3.selectAll(".radiusLegendEntry-scatter2dN").attr("r", function(d,i){return scatter2dN.radiusScale(radiusLegendVals[i]);})
        // update entries' text
        d3.selectAll(".radiusLegendText-scatter2dN").text(function(d,i){return radiusLegendVals[i];})
    }

      function makeRadiusLegend(){

        // legend indent from plot
        var legIndent = 0.05*scatter2dN.margin.right;
        var largestRadius = scatter2dN.radiusScale.range()[1];
        // legend entries
        var radiusLegendVals = scatter2dN.radiusScale.domain();
        radiusLegendVals.splice(1,0,d3.mean(scatter2dN.radiusScale.domain()));

        // main legend group
        var legG = svg.append("g")
            .attr('id',"radiuslegendG-scatter2dN")
            .attr("class","hidden")
            .attr("transform","translate("+scatter2dN.width+",0)");

        // title
        legG.append("text")
            .attr("x", legIndent)
            .attr("class","legendTitle")
            .attr("id","radiusLegendTitle-2dscatterN")
            .style("text-anchor", "beginning")
            .style("font-size","1.5em")
            .text(scatter2dN.objStates[2]);

        // groups for each legend entry
        var legend = legG.selectAll(".legend")
            .data(radiusLegendVals)
            .enter().append("g")
            .attr("class", "legend")
            .attr("transform",function(d, i)
                {return "translate("+(legIndent+largestRadius)+","+(i+1)*10*largestRadius+")"; });

        // circles on the legend entries
        legend.append("circle")
            .attr("x", 2*scatter2dN.radiusScale(radiusLegendVals[2]))
            .attr("class","radiusLegendEntry-scatter2dN")
            .attr("r", function(d,i){return scatter2dN.radiusScale(radiusLegendVals[i]);})
            .attr("fill", "#eee");

        // text for the legend entries
        legend.append("text")
            .attr("x", 5*largestRadius)
            .attr("y", "0.5em")
            .attr("class","radiusLegendText-scatter2dN")
            .style("text-anchor", "beginning")
            .style("font-size","1.15em")
            .text(function(d) { return d; });
      }
}