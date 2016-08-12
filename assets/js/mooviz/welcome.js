
/* Handling the selection of a dataset from the welcome page */
// User-uploaded
d3.select("#datasetinput").on("change", function(){
  if (window.File && window.FileReader && window.FileList && window.Blob) {
    var filereader = new window.FileReader();
    filereader.onload = function(){
        prepAndLaunch(filereader.result);
    }
    filereader.readAsText(this.files[0]);
  } else { console.log("Error with file upload. Please try again."); }
});
// Selected from the examples
d3.selectAll(".datasetoption").on("click", function(){
    var selectedID = this.id;
    var filename = "datasets/"+selectedID+".csv"
    d3.text(filename, function(datasetAsText){
        prepAndLaunch(datasetAsText,selectedID);
    });
});

/** Groom data and launch to viz page */
function prepAndLaunch(dat,optFilename) {
    if (typeof optFilename === 'undefined') { optFilename = 'custom'; }

    var data = d3.csvParse(dat);
    
    var colsinfo = getColsInfo(data,optFilename);

    data = groomdata(data,colsinfo);

    // convert data object to URI-encodable JSON string
    var uridataparam = encodeURIComponent(JSON.stringify(data));

    // convert datacols object to URI-encodable JSON string
    var uridatacolsparam = encodeURIComponent(JSON.stringify(colsinfo["datacols"]));
    
    // launch viz page with encoded data
    window.location.href = window.location.href+"viz?data="+uridataparam+"&datacols="+uridatacolsparam;

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
function getColsInfo(dataset, filename){
    var colsinfo = {};

    colsinfo["idcols"] = dataset.columns.slice(0,2);
    colsinfo["datacols"] = {};

    /* objectives set to 0 for min, 1 for max */
    var datacolnames = dataset.columns.slice(2);
    for (var i = 0; i < datacolnames.length; i++){
        colsinfo["datacols"][datacolnames[i]] = 1;
    }
    /* Fixes for preloaded datasets */
    if (filename === "deschutesdata"){
        colsinfo["datacols"]["FireHazard"] = 0;
        colsinfo["datacols"]["MaxSediment"] = 0;
    }

    return colsinfo;
}

/** Groom dataset */
function groomdata(dataset,colsinfo){
    var idcols = colsinfo["idcols"],
        datacols = Object.keys(colsinfo["datacols"]);
    
    return dataset.map(function(row){
        row["mvid"] = row[idcols[0]]+"-"+row[idcols[1]];
        for (idx in datacols){
            row[datacols[idx]] = +row[datacols[idx]];
        }
        return row;
    });
}