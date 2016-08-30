var scatter3dN = {};
scatter3dN["objStates"] = Object.keys(datacols);

// if there are less than 4 vars, remove the button for permuting objectives
if (Object.keys(datacols).length < 4) {
    $("#permuteObjs-3dN").remove();
}

// make the chart
make3DNScatterPlot("scatter3dNVizDiv");

// add functionality for permute objs button click

// add plot resizing

// add click functionality to points

function make3DNScatterPlot(loc) {
    var scatterSeries = [];
    frontiers.forEach(function (d) {
        var trace = {};
        var workingData = ndatasets[d];
        trace.name = d;
        trace.type = 'scatter3d';
        trace.mode = 'markers';
        trace.marker = {
            color: colorScale(d),
            opacity: 0.4
        };
        trace.x = workingData.map(function (i) { return i[scatter3dN.objStates[[0]]]; });
        trace.y = workingData.map(function (i) { return i[scatter3dN.objStates[[1]]]; });
        trace.z = workingData.map(function (i) { return i[scatter3dN.objStates[[2]]]; });
        trace.text = workingData.map(function (i) { return i.mvid; });
        // add it to the scatterSeries array
        scatterSeries.push(trace);
    });

    // Specify layout
    var layout = {

        autosize: true,
        scene: {
            xaxis: {
                title: scatter3dN.objStates[[0]]
            },
            yaxis: {
                title: scatter3dN.objStates[[1]]
            },
            zaxis: {
                title: scatter3dN.objStates[[2]]
            }
        }
    };

    Plotly.newPlot(loc, scatterSeries, layout);

    var thisDiv = d3.select("#" + loc).node();
    window.onresize = function () { Plotly.Plots.resize(thisDiv); }
}