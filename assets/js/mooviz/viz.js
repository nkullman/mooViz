// Read in data from URI
var data = getInitialData();
var datacols = getDataColsData();

// Simplify URL, scraping away URI components
var baseURL = window.location.href.slice(0,window.location.href.indexOf("?"));
window.history.replaceState("newstate","MOO Viz",baseURL);

// Create a normalized version of the dataset
var ndata = normalize(data, datacols);

// Compute statistics for both normalized and original datasets
var datastats = { original: {}, normalized:{} };
datastats["original"] = getDatasetStats(data);
datastats["normalized"] = getDatasetStats(ndata);




/**
 * Compute dataset statistics:
 * Binary Hypervolume indicator
 * Binary additive epsilon indicator
 * Unary hypervolume indicator
 * Unary epsilon indicator
 * 
 * 
 * */

/** Get data from the URI. If no or bad data passed, divert user to welcome page */
function getInitialData(){
    try {
        return JSON.parse(getParameterByName("data"));
    } catch(e) {
        window.location.href = window.location.href.slice(0,window.location.href.lastIndexOf("/viz"));
    }
}

/** Get information on the data columns from the URI. */
function getDataColsData(){
    try {
        return JSON.parse(getParameterByName("datacols"));
    } catch(e) {
       window.location.href = window.location.href.slice(0,window.location.href.lastIndexOf("/viz"));
    }
}

/** Get URI component identified by arg "name" */
function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function normalize(data, datacols){
    // clone the data
    var ndata = JSON.parse(JSON.stringify(data));
    // normalize the data columns
    for (col in datacols){

        // determine normalization based on objective sense
        var bounds = [d3.max(data,function(d){ return d[col]; })];
        if (datacols[col]>0){ // max objective
            bounds.unshift(d3.min(data,function(d){ return d[col]; }));
        } else { // min
            bounds.push(d3.min(data,function(d){ return d[col]; }));
        }
        // create scale to map data val to 0-1 range
        var scale = d3.scaleLinear().domain(bounds);
        // map the data
        ndata = ndata.map(function(row){
            row[col] = scale(row[col]);
            return row;
        })
    }
    
    return ndata;
}
