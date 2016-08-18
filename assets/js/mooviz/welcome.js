var data;
var objectives;
var datacols={};

/* Handling the selection of a dataset from the welcome page */
// User-uploaded
d3.select("#datasetinput").on("change", function(){
  if (window.File && window.FileReader && window.FileList && window.Blob) {
    var filereader = new window.FileReader();
    filereader.onload = function(){
        prep(filereader.result);
        setDefaultObjsSensesForCustomData();
        $('#objsModal').modal('toggle');
        $('#objsModal').on('hidden.bs.modal', function () {
            launch();
        });
    }
    filereader.readAsText(this.files[0]);
  } else { console.log("Error with file upload. Please try again."); }
});
// Selected from the examples
d3.selectAll(".datasetoption").on("click", function(){
    var selectedID = this.id;
    var filename = "datasets/"+selectedID+".csv"
    d3.text(filename, function(datasetAsText){
        prep(datasetAsText,selectedID);
        launch();
    });
});


/** Groom data */
function prep(dat,optFilename) {
    if (typeof optFilename === 'undefined') { optFilename = 'custom'; }

    data = d3.csvParse(dat);

    objectives = data["columns"].splice(2);

    data = groomdata(data,objectives);

    // get the objectives' senses for pre-loaded datasets
    if (optFilename !== "custom"){
        datacols = setObjsSensesForPreloadedData(optFilename);
    }
}

/**
 * Get the names of the objectives and ID columns from the dataset.
 * ID columns are assumed to be the first two columns
 *  - one ID col for the frontier, one ID col for the solution within the frontier
 * Objectives are the column headers of the remaining columns
 * 
 * The function also assigns senses to the objectives.
 * All objectives assumed to be max for custom datasets.
 * Preloaded datasets are fixed as appropriate.
 */
function setObjsSensesForPreloadedData(filename){
    var objsSenses = {};

    /*
    Objectives set to 0 for min, 1 for max
    Default: all max
    */
    for (var i = 0; i < objectives.length; i++){
        objsSenses[objectives[i]] = 1;
    }
    /*
    Adjustments for preloaded datasets.
    This loop should be modified when more datasets added
    */
    if (filename === "deschutesdata"){
        objsSenses[objectives[0]] = 0;
        objsSenses[objectives[2]] = 0;

        return objsSenses;
    } else { // (filename === "chiledata" || filename === "packforestdata")

        // These files have all objs max, so no changes req'd
        return objsSenses;
    }
}

function setDefaultObjsSensesForCustomData(){
    /*
    Objectives set to 0 for min, 1 for max
    Default: all max
    */
    var tbID = "#senseSetModalTableBody"
    for (var i = 0; i < objectives.length; i++){
        datacols[objectives[i]] = 1;
        appendSenseSelectorToTable(tbID,i,objectives[i]);
    }
    
}

/** Save data and datacols to local storage and launch to explorer page */
function launch(){
    // Store data objects in local storage
    localStorage.setItem('MOOVizData', JSON.stringify(data));
    localStorage.setItem('MOOVizDatacols', JSON.stringify(datacols));
    
    // launch viz page with data in local storage
    window.location.href = window.location.href+"explorer/";
}

/**
 * Appends a radio button to select the sense for an objective
 * to the DOM element name passed in the arg
 * 
 */
function appendSenseSelectorToTable(tbodyID,objIdx,objName){
    var trow = d3.select(tbodyID).append("tr");
    trow.append("th").text(objName+": ");
    trow.append("td")
        .attr("class","text-left")
        .append("input")
            .attr("id","sense-toggle-"+objIdx)
            .attr("type","checkbox")
            .attr("data-toggle","toggle")
            .attr("data-on","Max")
            .attr("data-off","Min")
            .property("checked",true);

    $(function(){$("#sense-toggle-"+objIdx).bootstrapToggle();});
    $(function(){$("#sense-toggle-"+objIdx)
        .change(function(){
            datacols[objName] === 1 ? datacols[objName] = 0 : datacols[objName] = 1;
        });
    });
}

/** Groom dataset */
function groomdata(dataset,objs){    
    return dataset.map(function(row){
        row["mvid"] = row["Frontier"]+"-"+row["SolutionIndex"];
        for (idx in objs){
            row[objs[idx]] = +row[objs[idx]];
        }
        return row;
    });
}