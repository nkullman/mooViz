var margin = {top: 20, right: 200, bottom: 30, left: 50},
    width = 1000 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;
	
var xScale = d3.scale.linear()
    .range([0, width]);

var yScale = d3.scale.linear()
    .range([height, 0]);
    
var radiusScale = d3.scale.sqrt();

var colorScale = d3.scale.category10();

var initFinalMapObj = "FireHazardIncrease"; // other option (for now) is "MinOwlHabitat"
var initFinalMapObjColorScale = d3.scale.linear();
if (initFinalMapObj == "FireHazardIncrease"){
  initFinalMapObjColorScale.range(["white","red"]);
} else {
  initFinalMapObjColorScale.range(["#d3d3d3","green"]);
}

var xAxis = d3.svg.axis()
    .scale(xScale)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(yScale)
    .orient("left");
    
var xVar,
    yVar,
    radiusVar,
    scatterPlotCols,
    objectives,
    numObjectives,
    dotRadius = 4,
    radiusScaleRange = [dotRadius,dotRadius],
    numMapsPerRow = 4,
    datafilename;
    
var intro = introJs();
    
radiusScale.range(radiusScaleRange);
    
var encodeRadius = false;
var drilldownTypeSelector = 0;
var selected_solutions = [];
var sortType = [];
    
var tip = d3.tip()
  .attr('class', 'd3-tip')
  .offset([-10, 0])
  .html(function(d) {
    var thisdata = d[0][0]["__data__"];
    var result = "";
    for (var col in scatterPlotCols){
      if (col !== "SolutionIndex" && col !== "UniqueID"){
        result += "<strong>" + scatterPlotCols[col] + ":</strong> <span style='color:#e8f4f8'>" + thisdata[scatterPlotCols[col]] + "</span>"
        if (col !== scatterPlotCols.length - 1) { result += "<br>";}
      };
    }
    return result;
  })
	
var svg = d3.select(".scatterplotDiv").append("svg")
    .attr('id',"scatterPlotSVG")
    .attr('viewBox', "0 0 " + (width + margin.right + margin.left) + " " + (height + margin.top + margin.bottom))
    .attr('preserveAspectRatio',"xMinYMin meet")
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
d3.select("#scatterPlotSVG").call(tip);
    
d3.csv("visualization/mapMaking/mapMakingData_noneOnly_final.csv",function(maperror, mapdata) {
  if (maperror) throw maperror;
  // filter to the objective we're interested in plotting
  var curmapdata = mapdata.filter(function(d){return d.Objective === initFinalMapObj;})
  curmapdata.forEach(function (d) {
    d.UniqueID = d.Frontier + "-" + d.SolutionIndex;
    d.MapColumn = +d.MapColumn;
    d.Value = +d.Value
  });
  // determine the domain for the coloring scales
  var vals = [];
  curmapdata.filter(function(row){
    return (row.MapColumn === 0 || row.MapColumn === numMapsPerRow-1);
  }).forEach(function(d){
    // put all d.Value 's in an array. Then, since we're in an extent sandwich, it should get what we want
    vals.push(d.Value);
    return;
  });
  initFinalMapObjColorScale.domain(d3.extent(vals));
  
  var urlfrontierName = getParameterByName("frontier");
  if (urlfrontierName === "none"){
    datafilename = "climateChange_EfficientSolutions_NoneOnly.csv";
  } else if (urlfrontierName === "e85"){
    datafilename = "climateChange_EfficientSolutions_E85.csv";
  } else {
    datafilename = "climateChange_EfficientSolutions_primary.csv";
  }
  
d3.csv("visualization/data/" + datafilename, function(error, data) {

  if (error) throw error;
    

  // "Unselect all" option for 2d scatter
  d3.select(".legend").append("text")
      .attr("transform", "translate(0," + colorScale.domain().length*20 + ")")
      .attr("x", width)
      .attr("y", 9)
      .attr("dy", ".35em")
      .style("text-anchor", "middle")
      .style("text-decoration","underline")
      .style("cursor","pointer")
      .on("click", function(){
        selected_solutions = [];
        updateClassingOfSelectedSolutionsPathsAndDots(selected_solutions);
        drawDrilldown(drilldownTypeSelector);
      })
      .text("Unselect all solutions")
      
  drawDrilldown(drilldownTypeSelector);
  
  d3.select("#makeParallelCoordsButton")
    .on("click", function(){
      drilldownTypeSelector = 0;
      drawDrilldown(drilldownTypeSelector);
    });
  d3.select("#makeMapsButton")
    .on("click", function(){
      drilldownTypeSelector = 1;
      drawDrilldown(drilldownTypeSelector);
    });
  d3.select("#drawTableButton")
    .on("click", function(){
      drilldownTypeSelector = 2;
      drawDrilldown(drilldownTypeSelector);
    });
    
    /** To ensure robustness to the number of objectives,
     * breakout the functinoality that is specific to 3-dimensions */
    if (objectives.length === 3){
      // add div to hold 3D scatter plot
      d3.select(".scatterplot-wrap").insert("div",":first-child")
        .attr("id", "threeDScatterDiv")
        .attr("class", "inactiveScatterPlot");
      // make dimension-toggle button
      d3.select(".scatterplot-wrap").insert("button",":first-child")
        .attr("id","toggle2D3D")
        .on("click", function(){
          d3.select("#scatterplotDiv").classed("inactiveScatterPlot",!d3.select("#scatterplotDiv").classed("inactiveScatterPlot"));
          d3.select("#threeDScatterDiv").classed("inactiveScatterPlot",!d3.select("#threeDScatterDiv").classed("inactiveScatterPlot"));
        })
        .text("Toggle 2D/3D")
      // draw the 3D scatterplot
      make3DScatterPlot(data);
      // enable on-click selection of points
      d3.selectAll(".threeDpoint")
        .on("click", function(){
          var objData = {},
              objId = this.id;
          objData.UniqueID = objId.substring(objId.indexOf("-") + 1, objId.lengh)
          clickToggleSelected(objData);
        })
        .on("mouseover", function(){
          classMeAndMyBrothers(this, "active", true);
        })
        .on("mouseout", function(){
          classMeAndMyBrothers(this, "active", false);
        });
      // ensure proper classing of selected points
      updateClassingOfSelectedSolutionsPathsAndDots(selected_solutions)
    }

      
  // Ensure proper classing of paths
  function updateClassingOfSelectedSolutionsPathsAndDots(selected_solutions){
    d3.selectAll(".dot,.pcforegroundPath,.threeDpoint").classed("selected",false);
    selected_solutions.forEach(function(d,i){
      d3.selectAll("#path-" + d + ",#dot-" + d + ",#threeDpoint-" + d).classed("selected",true)
    });
  }
  
  function classMeAndMyBrothers(element, className, classification){
    var uid = element.id.substring(element.id.indexOf("-")+1);
    d3.selectAll("#path-" + uid + ",#dot-" + uid + ",#threeDpoint-" + uid).classed(className, classification)
  }
  
  
  function clickToggleSelected(graphObjData){
    var uniqueid = graphObjData.UniqueID;
    // get graph objects corresponding to this solution
    var graphObjs = d3.selectAll("#dot-" + uniqueid + ",#path-" + uniqueid + ",#threeDpoint-" + uniqueid);
    var idxOfObjID = selected_solutions.indexOf(uniqueid);
    if (idxOfObjID > -1){
      // already in solutions, so we remove it
      selected_solutions.splice(idxOfObjID,1);
      // unclass the graph objects
      graphObjs.classed("selected", false);
    } else {
      // not in solutions, so add it
      selected_solutions.push(uniqueid);
      // class graph objects
      graphObjs.classed("selected", true);
    }
    updateTable(selected_solutions);
    updateMapTable(selected_solutions);
    drawDrilldown(drilldownTypeSelector);
  }
  
  function drawDrilldown(drilldownTypeSelector){
    d3.select(".drilldownDiv").html("");
    if (drilldownTypeSelector === 0){
      drawParallelCoordsPlot();
    }
    else if (drilldownTypeSelector === 1){
      drawMap();
    }
    else if (drilldownTypeSelector === 2){
      drawTable();
    }
    else if (drilldownTypeSelector === 3){
      drawAboutPage();
    }
    else {
      drawHelpPage();
    }
  }
  
  function drawParallelCoordsPlot(){
    var pcmargin = {top: 30, right: 10, bottom: 10, left: 10},
    pcwidth = 800 - pcmargin.left - pcmargin.right,
    pcheight = 400 - pcmargin.top - pcmargin.bottom;

    var pcxScale = d3.scale.ordinal().rangePoints([0, width], 1),
        pcyScale = {},
        pcDragging = {};
    
    var pcline = d3.svg.line(),
        pcaxis = d3.svg.axis().orient("left"),
        pcforeground,
        dimensions;
        
    var pcsvg = d3.select(".drilldownDiv").append("svg")
        .attr('id',"pcSVG")
        .attr('viewBox', "0 0 " + (pcwidth + pcmargin.right + pcmargin.left) + " " + (pcheight + pcmargin.top + pcmargin.bottom))
        .attr('preserveAspectRatio',"xMinYMin meet")
      .append("g")
        .attr("transform", "translate(" + pcmargin.left + "," + pcmargin.top + ")");
        
    pcsvg.call(tip);
        
    // Extract the list of dimensions and create a scale for each.
    pcxScale.domain(dimensions = objectives.filter(function(d) {
      return (pcyScale[d] = d3.scale.linear()
          .domain(d3.extent(data, function(p) { return +p[d]; }))
          .range([height, 0]));
    }));
      
    // Add blue foreground lines for focus.
    pcforeground = pcsvg.append("g")
        .attr("class", "pcforeground")
      .selectAll("path")
        .data(data)
      .enter().append("path")
        .attr("class","pcforegroundPath")
        .attr("id", function(d){ return "path-" + d.UniqueID; })
        .attr("stroke", function(d) { return colorScale(d.Frontier); })
        .style("fill", "none")
        .on('mouseover', function(){
          d3.select(this).call(tip.show);
          classMeAndMyBrothers(this, "active", true);
        })
        .on('mouseout', function(){
          d3.select(this).call(tip.hide);
          classMeAndMyBrothers(this, "active", false);
        })
        .on("click", function(d){
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
        .attr("transform", function(d) { return "translate(" + pcxScale(d) + ")"; });
          
          
    // Add an axis and title.
    pcg.append("g")
        .attr("class", "axis")
        .each(function(d) { d3.select(this).call(pcaxis.scale(pcyScale[d])); })
      .append("text")
        .style("text-anchor", "middle")
        .attr("y", -9)
        .text(function(d) { return d; });
  
    // Add and store a brush for each axis.
    pcg.append("g")
        .attr("class", "brush")
        .each(function(d) {
          d3.select(this).call(pcyScale[d].brush = d3.svg.brush().y(pcyScale[d]).on("brushstart", pcbrushstart).on("brush", pcbrush));
        })
      .selectAll("rect")
        .attr("x", -8)
        .attr("width", 16);
        
    // Ensure proper classing of paths
    updateClassingOfSelectedSolutionsPathsAndDots(selected_solutions);
        
    function position(d) {
      var v = pcDragging[d];
      return v == null ? pcxScale(d) : v;
    }
    
    function transition(g) {
      return g.transition().duration(500);
    }
    
    // Returns the path for a given data point.
    function path(d) {
      return pcline(dimensions.map(function(p) { return [position(p), pcyScale[p](d[p])]; }));
    }
    
    function pcbrushstart() {
      d3.event.sourceEvent.stopPropagation();
    }
    
    function inPCBrushSelection(d, actives, extents) {
      return actives.every(function(p, i) {
          return extents[i][0] <= d[p] && d[p] <= extents[i][1];
      }) ? true : false;
    }
    
    // Handles a brush event, toggling the display of foreground lines.
    function pcbrush() {
      var actives = dimensions.filter(function(p) { return !pcyScale[p].brush.empty(); }),
          extents = actives.map(function(p) { return pcyScale[p].brush.extent(); });
      selected_solutions = [];
      d3.selectAll(".pcforegroundPath").each(function(d){
        if (inPCBrushSelection(d,actives,extents)){
          selected_solutions.push(d.UniqueID);
        }
      });
      if (actives.length === 0){ selected_solutions = []; }
      updateClassingOfSelectedSolutionsPathsAndDots(selected_solutions);
    }
  }