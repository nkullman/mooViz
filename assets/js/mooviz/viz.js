// Read in data from URI
var data = getInitialData();
// Simplify URL
var baseURL = window.location.href.slice(0,window.location.href.indexOf("?"));
window.history.replaceState("newstate","MOO Viz",baseURL);



/** Get data from the URI. If no or bad data passed, diver user to welcome page */
function getInitialData(){
    try {
        return JSON.parse(decodeURIComponent(getParameterByName("data")));
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
