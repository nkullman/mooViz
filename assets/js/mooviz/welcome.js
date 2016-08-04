
/* Handling the selection of a dataset from the welcome page */
// User-uploaded
d3.select("#datasetinput").on("change", function(){
  if (window.File && window.FileReader && window.FileList && window.Blob) {
    var filereader = new window.FileReader();
    filereader.onload = function(){
        constructViz(filereader.result);
    }
    filereader.readAsText(this.files[0]);
  } else { console.log("sth went wrong w file reading"); }
});
// Selected from the examples
d3.selectAll(".datasetoption").on("click", function(){
    var filename = "datasets/"+this.id+".csv"
    d3.text(filename, function(datasetAsText){
        constructViz(datasetAsText);
    });
});

/* Build the viz */
var constructViz = function(dat) {
    var data = d3.csvParse(dat);
    
    data = groomdata(data);
    
    buildViz(data);
}

/* Groom dataset */
var groomdata = function(dataset){
    var idcols = dataset.columns.slice(0,2),
        datacols = dataset.columns.slice(2);
    
    return dataset.map(function(row){
        row["mvid"] = row[idcols[0]]+"-"+row[idcols[1]];
        for (idx in datacols){
            row[datacols[idx]] = +row[datacols[idx]];
        }
        return row;
    });
}