/*$(function() {

  // We can attach the `fileselect` event to all file inputs on the page
  $(document).on('change', ':file', function() {
    var input = $(this),
        numFiles = input.get(0).files ? input.get(0).files.length : 1,
        label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
    input.trigger('fileselect', [numFiles, label]);
  });

  // We can watch for our custom `fileselect` event like this
  $(document).ready( function() {
      $(':file').on('fileselect', function(event, numFiles, label) {

          var input = $(this).parents('.input-group').find(':text'),
              log = numFiles > 1 ? numFiles + ' files selected' : label;
          

          if( input.length ) {
              input.val(log);
          } else {
              if( log ) alert(log);
          }

      });
  });
  
});*/

d3.select("#datasetinput").on("change", function(){
  if (window.File && window.FileReader && window.FileList && window.Blob) {
    var uploadFile = this.files[0];
    var filereader = new window.FileReader();
    
    filereader.onload = function(){
      var txtRes = filereader.result;
      try{
        d3.csv(txtRes,function(error,data){
            console.log("made it here");
        });
      }catch(err){
        window.alert("Error parsing uploaded file\nerror message: " + err.message);
        return;
      }
    };
    filereader.readAsText(uploadFile);
    console.log("sth happened")
    
  } else {
    alert("Error with file input. Check out the help page for more info on proper formatting of input datasets.");
  }
});