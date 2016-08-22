// Draw charts to their viz divs
/** Viz components */
/** Universal data acros vizs */
var colorScale = d3.scaleOrdinal(d3.schemeCategory10);

/** Data specific to the non-normalized 2D scatterplot */
var scatter2d = {};
scatter2d["margin"] = {top: 20, right: 200, bottom: 30, left: 50},
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
scatter2d["radiusScale"] = d3.scaleSqrt().range(scatter2d["radiusScaleRange"]);

/* Make the viz */
make2DScatterViz("#viztype1");

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
    // define initial state of the objectives
    scatter2d["objStates"] = Object.keys(datacols);

    // initial canvas
    var svg = d3.select(loc).append("svg")
        .attr('id',"scatter2DSVG")
        .attr('viewBox', "0 0 " + (scatter2d["width"] + scatter2d["margin"].right + scatter2d["margin"].left) + " " + (scatter2d["height"] + scatter2d["margin"].top + scatter2d["margin"].bottom))
        .attr('preserveAspectRatio',"xMinYMin meet")
    .append("g")
        .attr("transform", "translate(" + scatter2d["margin"].left + "," + scatter2d["margin"].top + ")");

    // handling zoom
    var zoomListener = d3.zoom()
        .scaleExtent([1,10])
        .translateExtent([
            [d3.min(datasets, function(d) { return d[scatter2d["objStates"][0]]; }),
                d3.min(datasets, function(d) { return d[scatter2d["objStates"][1]]; })],
            [scatter2d["width"]+50,scatter2d["height"]+50]])
        .on("zoom", zoomHandler);

    function zoomHandler() {
    
        svg.attr("transform",d3.event.transform)
        
        // update axes
        svg.select(".x.axis.scatter2d").call(scatter2d["xAxis"].scale(d3.event.transform.rescaleX(scatter2d["xScale"])));
        svg.select(".y.axis.scatter2d").call(scatter2d["yAxis"].scale(d3.event.transform.rescaleY(scatter2d["yScale"])));
        // update points
        d3.selectAll(".dot.scatter2d")
            .attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")")
        //.attr("r", function(d) {return radiusScale(d[radiusVar])/d3.event.scale});
    }

    // handle axes updating
    // TODO

    // handle axes' domains
    scatter2d["xScale"].domain(d3.extent(datasets, function(d) { return d[scatter2d["objStates"][0]]; })).nice();
    scatter2d["yScale"].domain(d3.extent(datasets, function(d) { return d[scatter2d["objStates"][1]]; })).nice();
    scatter2d["radiusScale"].domain(d3.extent(datasets, function(d) { return d[scatter2d["objStates"][2]]; })).nice()

    d3.select("#scatter2DSVG").call(zoomListener)//.rescaleX(scatter2d["xScale"]).rescaleY(scatter2d["yScale"]));

    svg.append("g")
      .attr("class", "x axis scatter2d")
      .attr("transform", "translate(0," + scatter2d["height"] + ")")
      .call(scatter2d["xAxis"])
    .append("text")
      .attr("class", "label xAxisLabel")
      //.on("click", updateXAxis)
      .attr("x", scatter2d["width"])
      .attr("y", -6)
      .style("text-anchor", "end")
      .style("cursor", "pointer")
      .text(scatter2d["objStates"][0]);

    svg.append("g")
      .attr("class", "y axis scatter2d")
      .call(scatter2d["yAxis"])
    .append("text")
      .attr("class", "label yAxisLabel")
      //.on("click", updateYAxis)
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .style("cursor", "pointer")
      .text(scatter2d["objStates"][1]);

    svg.selectAll(".dot.scatter2d")
        .data(datasets)
        .enter().append("circle")
        .attr("class", "dot scatter2d")
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
        })
        .attr("r", function(d) {return scatter2d["radiusScale"](d[scatter2d["objStates"][2]])/zoomListener.scale();})
        .attr("cx", function(d) { return scatter2d["xScale"](d[scatter2d["objStates"][0]]); })
        .attr("cy", function(d) { return scatter2d["yScale"](d[scatter2d["objStates"][1]]); })
        .attr("fill", function(d) { return colorScale(d.Frontier); })
        .attr("opacity", 0.2)
        .style("cursor","pointer");
}