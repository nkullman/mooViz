// Draw charts to their viz divs
/** Viz components */
/** Universal data across vizs */
var colorScale = d3.scaleOrdinal(d3.schemeCategory10)
    .domain(frontiers);
makeFrontierColorLegend();

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
    });


/** Draw the legend showing colors for each frontier in the dataset */
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

/**
 * Handles the selection/activation of solutions from the data
 */
function classingVizObjects(mvid, classification,classState){
    d3.selectAll("."+mvid+".actionableDrawingElement")
        .classed(classification,classState);
}