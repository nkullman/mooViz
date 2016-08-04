// Read in data from URI component and simplify URL
var data = JSON.parse(decodeURIComponent(getParameterByName("data")));
// Simplify URL
var baseURL = window.location.href.slice(0,window.location.href.indexOf("?"));
window.history.replaceState("object or string","Title",baseURL);

console.log(data);


function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}