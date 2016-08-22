// Draw charts to their viz divs
/** Viz components */
/** Universal data acros vizs */
var colorScale = d3.scaleOrdinal(d3.schemeCategory10)
    .domain(frontiers);
makeFrontierColorLegend();

/** Data specific to the non-normalized 2D scatterplot */
var scatter2d = {};
scatter2d["margin"] = {top: 20, right: 50, bottom: 50, left: 80},
scatter2d["width"] = 1000 - scatter2d["margin"].left - scatter2d["margin"].right,
scatter2d["height"] = 400 - scatter2d["margin"].top - scatter2d["margin"].bottom,
scatter2d["xScale"] = d3.scaleLinear()
    .range([0, scatter2d["width"]]),
scatter2d["yScale"] = d3.scaleLinear()
    .range([scatter2d["height"], 0]),
scatter2d["xAxis"] = d3.axisBottom(scatter2d["xScale"]);
scatter2d["yAxis"] = d3.axisLeft(scatter2d["yScale"]);
scatter2d["objStates"],
scatter2d["encodeRadius"] = false,
scatter2d["dotRadius"] = 4,
scatter2d["radiusScaleRange"] = [scatter2d["dotRadius"],scatter2d["dotRadius"]],
scatter2d["radiusScale"] = d3.scaleSqrt().range(scatter2d["radiusScaleRange"]),
scatter2d["k"] = 1;

/* Make the viz */
make2DScatterViz("#scatter2dVizDiv");

// Move the default-selected vizs to the display
 var curr1 = "viztype2";
 var curr2 = "viztype5";
 $("#"+curr1).detach().replaceAll("#firstVizDiv>:first-child");
 $("#"+curr2).detach().replaceAll("#secondVizDiv>:first-child");

// Control showing/hiding of viz panels
d3.selectAll(".vizTypeSelector")
    .on("change",function(){
        var panelToggled = this.id.startsWith("f") ? 1 : 2;
        var currVP = panelToggled === 1 ? $("#firstVizDiv") : $("#secondVizDiv");
        var altVP = panelToggled === 1 ? $("#secondVizDiv") : $("#firstVizDiv");
        var otherSelector = panelToggled === 1 ? $("#secondVizDivSelect") : $("#firstVizDivSelect");
        var vizSource = $('#masterhiddenvizdiv');
        var currViz = currVP.find(">:first-child");
        var newViz = $("#"+$(this).val());
        if (this.value === "none"){
            // hiding the toggled panel
            currVP.addClass("hidden");

            // enable the option in the other selector
            otherSelector.find(">.vizoption-disabled").prop("disabled",false);

            // set the other panel to full size
            altVP.removeClass("col-xs-6").addClass("col-xs-12");
        } else {
            // ensure current panel visible
            currVP.removeClass("hidden");

            // set the other panel to half-size
            altVP.addClass("col-xs-6").removeClass("col-xs-12");

            // remove current panel's content
            currViz.detach().appendTo(vizSource);
            
            // assign appropriate viz div to current panel
            newViz.detach().appendTo(currVP);

            // change which option is disabled in the other selector
            otherSelector.find(">.vizoption-disabled").prop("disabled",false).removeClass("vizoption-disabled");
            otherSelector.find(">[value="+$(this).val()+"]").prop("disabled",true).addClass("vizoption-disabled");
        }
    })




function make2DScatterViz(loc){
    // give ability to reset zoom
    d3.select("#zoomReset-scatter2d").on("click",function(){
        d3.select("#scatter2DSVG").transition().duration(750).call(zoomListener.transform, d3.zoomIdentity);
    });

    // define initial state of the objectives
    scatter2d["objStates"] = Object.keys(datacols);

    // initial canvas
    var svg = d3.select(loc).insert("svg",":first-child")
        .attr('id',"scatter2DSVG")
        .attr('viewBox', "0 0 " + (scatter2d["width"] + scatter2d["margin"].right + scatter2d["margin"].left) + " " + (scatter2d["height"] + scatter2d["margin"].top + scatter2d["margin"].bottom))
        .attr('preserveAspectRatio',"xMinYMin meet")
    .append("g")
        .attr("transform", "translate(" + scatter2d["margin"].left + "," + scatter2d["margin"].top + ")");

    // define axes' domains
    scatter2d["xScale"].domain(d3.extent(data, function(d) { return d[scatter2d["objStates"][0]]; })).nice();
    scatter2d["yScale"].domain(d3.extent(data, function(d) { return d[scatter2d["objStates"][1]]; })).nice();
    scatter2d["radiusScale"].domain(d3.extent(data, function(d) { return d[scatter2d["objStates"][2]]; })).nice()

    // handling zoom
    var zoomListener = d3.zoom()
        .scaleExtent([1,10])
        .on("zoom", zoomHandler);

    d3.select("#scatter2DSVG").call(zoomListener);

    svg.append("g")
      .attr("class", "x axis scatter2d")
      .attr("transform", "translate(0," + scatter2d["height"] + ")")
      .on("click",updateObjStates)
      .call(scatter2d["xAxis"]);

    svg.append("text")
      .attr("class", "label xAxisLabel")
      .attr("id","xAxisLabel-scatter2d")
      .on("click", function(){updateObjStates("x")})
      .attr("x", 0.5*scatter2d["width"])
      .attr("y", scatter2d["height"]+0.8*scatter2d.margin.bottom)
      .style("text-anchor", "middle")
      .style("cursor", "pointer")
      .text(scatter2d["objStates"][0]);

    svg.append("g")
      .attr("class", "y axis scatter2d")
      .call(scatter2d["yAxis"]);

    svg.append("text")
      .attr("class", "label yAxisLabel")
      .attr("id","yAxisLabel-scatter2d")
      .on("click", function(){updateObjStates("y")})
      .attr("x", -(scatter2d.height/2))
      .attr("y",-0.8*scatter2d.margin.left)
      .attr("transform", "rotate(-90)")
      .style("text-anchor", "middle")
      .style("cursor", "pointer")
      .text(scatter2d["objStates"][1]);

    svg.selectAll(".dot.scatter2d")
        .data(data)
        .enter().append("circle")
        .attr("class", function(d){ return "dot scatter2d "+d.mvid; })
        .attr("id", function(d){ return "dot-scatter2d-" + d.mvid; })
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
        .attr("r", function(d) {return scatter2d["radiusScale"](d[scatter2d["objStates"][2]])/scatter2d.k;})
        .attr("cx", function(d) { return scatter2d["xScale"](d[scatter2d["objStates"][0]]); })
        .attr("cy", function(d) { return scatter2d["yScale"](d[scatter2d["objStates"][1]]); })
        .attr("fill", function(d) { return colorScale(d.Frontier); })
        .attr("opacity", 0.2)
        .style("cursor","pointer");

    function zoomHandler() {
        // update curr zoom extent on scatter2d
        scatter2d.k = d3.event.transform.k;
        // update axes
        svg.select(".x.axis.scatter2d").call(scatter2d["xAxis"].scale(d3.event.transform.rescaleX(scatter2d["xScale"])));
        svg.select(".y.axis.scatter2d").call(scatter2d["yAxis"].scale(d3.event.transform.rescaleY(scatter2d["yScale"])));
        // update points
        d3.selectAll(".dot.scatter2d")
            .attr("transform", d3.event.transform)
            .attr("r", function(d) {return scatter2d["radiusScale"](d[scatter2d["objStates"][2]])/scatter2d.k});
    }

    // handle axes updating on click of text
    function updateObjStates(axisClicked){
        if (axisClicked === "x"){
            // move first element to back of array, advance others besides element at i=1
            scatter2d["objStates"].push(scatter2d["objStates"].shift());
            scatter2d["objStates"].splice(1,0,scatter2d["objStates"].splice(0,1)[0]);
            // update the x and radius scales
            scatter2d["xScale"].domain(d3.extent(data, function(d) { return d[scatter2d["objStates"][0]]; })).nice();
            scatter2d["radiusScale"].domain(d3.extent(data, function(d) { return d[scatter2d["objStates"][2]]; })).nice();
            // update the axes
            d3.select(".x.axis.scatter2d").call(scatter2d["xAxis"]);
            d3.select("#xAxisLabel-scatter2d").text(scatter2d["objStates"][0]);
            // update the zoom behavior
            d3.select("#scatter2DSVG").call(zoomListener);
            // update the circles' x position (radius updated in later call to zoomListener(?))
            d3.selectAll(".dot.scatter2d").transition().duration(1000)
                .attr("cx", function(d) {return scatter2d["xScale"](d[scatter2d["objStates"][0]])})
            // update the radius legend
            //d3.select(this).call(updateRadiusLegend);
        } else { // clicked === "y"
            // move second element to the end
            scatter2d["objStates"].splice(scatter2d["objStates"].length-1,0,scatter2d["objStates"].splice(1,1)[0]);
            // update the y and radius scales
            scatter2d["yScale"].domain(d3.extent(data, function(d) { return d[scatter2d["objStates"][1]]; })).nice();
            scatter2d["radiusScale"].domain(d3.extent(data, function(d) { return d[scatter2d["objStates"][2]]; })).nice();
            // update the axes
            d3.select(".y.axis.scatter2d").call(scatter2d["yAxis"]);
            d3.select("#yAxisLabel-scatter2d").text(scatter2d["objStates"][1]);
            // update the zoom behavior
            d3.select("#scatter2DSVG").call(zoomListener);
            // update the circles' y position (radius updated in later call to zoomListener(?))
            d3.selectAll(".dot.scatter2d").transition().duration(1000)
                .attr("cy", function(d) {return scatter2d["yScale"](d[scatter2d["objStates"][1]])})
        }
        // reset zoom
        d3.select("#scatter2DSVG").transition().duration(750).call(zoomListener.transform, d3.zoomIdentity);
    }
}

function makeFrontierColorLegend(){
    var width = 1000,
        height = 75,
        boxWidth = 18;

    var legSvg = d3.select("#legendHolder")
            .style("background-color","#eee")
            .style("border-radius","6px")
        .append("svg")
            .attr('id',"legendSVG")
            .attr('viewBox', "0 0 "+width+" "+height)
            .attr('preserveAspectRatio',"xMinYMin meet");

    var legend = legSvg.selectAll(".legend")
        .data(colorScale.domain())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) { return "translate(" + (i * width / frontiers.length) + ","+(height-boxWidth)/2+")"; });

    legend.append("rect")
        //.attr("x", width + 24)
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", colorScale);

    legend.append("text")
        .attr("x", 1.5*boxWidth)
        .attr("y", (height)/2)
        .style("text-anchor", "beginning")
        .style("font-size","1.5em")
        .text(function(d) { return d; });

}