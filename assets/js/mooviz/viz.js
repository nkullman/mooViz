// Read in data from URI
var data = getInitialData();
var frontiers = getFrontiers(data);
var datasets = divideDataByFrontier(data, frontiers);
var datacols = getDataColsData();

// Simplify URL, scraping away URI components
var baseURL = window.location.href.slice(0,window.location.href.indexOf("?"));
window.history.replaceState("newstate","MOO Viz",baseURL);

// Create normalized versions of the datasets
var ndatasets = normalizeDatasets();
var ndatacols = normalizeDataCols();

// Compute the ideal and nadir vectors for each frontier
var ideals = { original: {}, normalized:{} };
ideals["original"] = getIdealVectors(datasets, datacols);
ideals["normalized"] = getIdealVectors(ndatasets, ndatacols);
var nadirs = { original: {}, normalized:{} };
nadirs["original"] = getNadirVectors(datasets, datacols);
nadirs["normalized"] = getNadirVectors(ndatasets, ndatacols);

// Compute frontier statistics
var datastats = getNormalizedDatasetStats();











/**
 * Given a dataset d, and datacols info dc,
 * Computes the ideal vector for each frontier
 */
function getIdealVectors(d,dc){
    var ideals = {};
    for (f in d){ // for each frontier in the dataset
        var ideal = JSON.parse(JSON.stringify(dc));
        for (col in dc){
            if (dc[col] > 0){ // obj is max. Store the max val
                ideal[col] = d3.max(d[f],function(row){
                    return row[col];
                });
            } else{
                ideal[col] = d3.min(d[f],function(row){
                    return row[col];
                });
            }
        }
        ideals[f] = ideal;
    }
    return ideals;
}

/**
 * Given a dataset d, and datacols info dc,
 * Computes the nadir vector for each frontier
 */
function getNadirVectors(d,dc){
    var nadirs = {};
    for (f in d){ // for each frontier in the dataset
        var nadir = JSON.parse(JSON.stringify(dc));
        for (col in dc){
            if (dc[col] > 0){ // obj is max. Store the min val
                nadir[col] = d3.min(d[f],function(row){
                    return row[col];
                });
            } else{
                nadir[col] = d3.max(d[f],function(row){
                    return row[col];
                });
            }
        }
        nadirs[f] = nadir;
    }
    return nadirs;
}



/**
 * Compute dataset statistics for the normalized dataset.
 * In the normalized dataset, all objectives run from 0-1, with 1 being the best 
 * Binary Hypervolume indicator
 * Binary additive epsilon indicator
 * Unary hypervolume indicator
 * Unary epsilon indicator
 * Schott's spacing metric
 * Average distance to ideal
 * 
 * Only the normalized datasets are used in the analyis.
 * This is the only way to make the objective space really make sense.
 * Approach suggested by this source:
 * http://www.tik.ee.ethz.ch/pisa/publications/emo-tutorial-2up.pdf
 * 
 * 
 * */
function getNormalizedDatasetStats(){
    var outstats = {frontier:{},interfrontier:{},intrafrontier:{}};
    var currIdeals = ideals["normalized"];
    var currNadirs = nadirs["normalized"];
    var currDataset = ndatasets;


    // Compute average distance to ideal solution
    outstats["frontier"]["DistToIdeal"] = computeDistsToIdeal(currDataset,currIdeals);

    // Compute unary epsilon indicator
    outstats["frontier"]["Epsilon"] = computeUnaryEpsilonIs(currDataset,currIdeals);

    // Compute spacing metric
    outstats["frontier"]["Spacing"] = computeSpacingMetric(currDataset,currIdeals);

    // Compute unary hypervolume indicator
    outstats["frontier"]["Hypervolume"] = computeHypervolumes(currDataset,currIdeals);

    // Compute binary epsilon indicator
    outstats["interfrontier"]["BinaryEpsilon"] = computeBinaryEpsilonIs(currDataset,currIdeals,currNadirs);

    // Compute binary hypervolume indicator
    // This relies on output from the unary hypervolume computation, so it must be computed afterwards 
    outstats["interfrontier"]["BinaryHypervolume"] = computeHypervolumes(currDataset,currIdeals,outstats["hypervolume"]);

    // Compute intra-frontier statistics
    for (f in currDataset){
        outstats["intrafrontier"][f] = computeIntrafrontierStats(currDataset[f],currIdeals[f]);
    }

    return outstats;
}


function computeIntrafrontierStats(dataset,ivec){
    var result = {};

    var objCombos = k_combinations(Object.keys(ivec),2);
    for (var c=0;c<objCombos.length;c++){
        var n1 = objCombos[c][0];
        var n2 = objCombos[c][1]
        var combonm = n1+"_"+n2;
        result[combonm] = {};
        var o1 = dataset.map(function(row){return row[n1]});
        var o2 = dataset.map(function(row){return row[n2]});
        // clone the ideal vector and remove all fields excet mvid and the current objectives
        var ivecForDomdRemoval = JSON.parse(JSON.stringify(ivec));
        for (key in ivecForDomdRemoval){
            if (key === "mvid" || key === n1 || key === n2) continue;
            delete ivecForDomdRemoval[key];
        }
        // local copy of the dataset with dominated solutions removed in the 2d plane for n1 and n2,
        // and sorted in descending order according to the first objective
        var ldat = removeDominated(JSON.parse(JSON.stringify(dataset)),ivecForDomdRemoval)
            .sort(function(a,b){ return b[n1] - a[n1];});
        var o1nd = ldat.map(function(row){return row[n1]});
        var o2nd = ldat.map(function(row){return row[n2]});
        result[combonm]["PearsonCoefficient"] = computePearsonCoefficient(o1,o2);
        result[combonm]["2DHypervol"] = compute2DHypervol(o1nd,o2nd);
    }
    function compute2DHypervol(a1,a2){
        var area = a1[0]*a2[0];
        for (var i=1;i<a1.length;i++){
            area += (a2[i]-a2[i-1])*a1[i];
        }
        return area;
    }
    return result;
}


function computeHypervolumes(datasets,idealvecs,unaryHypervols){
    var hypervols = {};

    if (typeof unaryHypervols === 'undefined'){
        for (f in datasets){
            hypervols[f] = computeHypervolume(datasets[f], idealvecs[f]);
        }
    } else {
        var frontierCombos = k_combinations(Object.keys(datasets),2);
        for (var i=0;i<frontierCombos.length;i++){
            var f1 = frontierCombos[i][0];
            var f2 = frontierCombos[i][1];
            var c1 = f1+"_"+f2;
            var c2 = f2+"_"+f1;
            var h1 = unaryHypervols[f1];
            var h2 = unaryHypervols[f2];
            var merged = removeDominated(datasets[f1].concat(datasets[f2]),idealvecs[f1]);
            var mergedHypervol = computeHypervolume(merged,idealvecs[f1]);
            hypervols[c1] = mergedHypervol - h2;
            hypervols[c2] = mergedHypervol - h1;
        }
    }

    function computeHypervolume(dataset,idealvec){
        var hypervolume = 0;

        // primary objective:
        var po = Object.keys(idealvec)[0];
        // secondary objectives:
        var sos = Object.keys(idealvec).filter(function(a){return a !== po;});
        // clone data for local use:
        var ldat = JSON.parse(JSON.stringify(dataset));
        // sort descending by primary objective
        ldat = ldat.sort(function(a,b){
            return b[po] - a[po];
        });
        // list of frontier points already accounted for (initially empty):
        var completedFrontierPoints = [];

        /* Recursive Methods for Computation */
        function getSideVolInSubDim(dim, frontierPoint, completedFrontierPoints){

            var sideVolInSubDim = 0;
            
            // sorted list of boundary solutions with dim component larger than current point
            var sideSols_dim = completedFrontierPoints.filter(function(e){
                return e["BoundarySolution"] && e[dim]>frontierPoint[dim];
            }).sort(function(a,b){
                return a[dim] - b[dim];
            });

            // If the list is empty, no side volume to add, so return
            if (sideSols_dim.length === 0) return sideVolInSubDim;
            // get list of additional dimensions required to compute volume
            var otherSecondaryDims = sos.filter(function(a){return a !== dim;});
            var prevDimComponent = frontierPoint[dim];
            var currDimComponent = 0;
            // cycle over side boundary sols in dim, computing volume for each
            for (var i=0;i<sideSols_dim.length;i++){
                currDimComponent = sideSols_dim[i][dim];
                var dimDelta = currDimComponent - prevDimComponent;
                var prodOfOtherDims = 1;
                for (var d=0;d<otherSecondaryDims.length;d++) {prodOfOtherDims *= sideSols_dim[i][otherSecondaryDims[d]];}
                sideVolInSubDim += dimDelta*prodOfOtherDims;
                prevDimComponent = currDimComponent;
            }
            return sideVolInSubDim;
        }

        function getSubDimVolumeFromFrontierPoint(frontierPoint, completedFrontierPoints){
            // get the solution's sub-dimensional volume back to the origin
            var subDimContribution =  1;
            for (var d=0;d<sos.length;d++) {subDimContribution *= frontierPoint[sos[d]];}
            // subtract everything pre-existing away from its
            subDimContribution -= d3.sum(completedFrontierPoints,function(d){return d["SubDimContribution"]});
            // add back in the sides
            for(var dimidx = 0; dimidx < sos.length; dimidx++){
                var dim = sos[dimidx];
                subDimContribution += getSideVolInSubDim(dim,frontierPoint,completedFrontierPoints);
            }
            return subDimContribution;
        }
        
        function getFrontierVolume(initFrontierVolume, remainingFrontierPoints, completedFrontierPoints){
            if (remainingFrontierPoints.length === 0) { return initFrontierVolume; }
            else{
                // next solution to add to frontier
                var currSol = remainingFrontierPoints[0];
                // will always be non-dominated in sub-D space
                currSol["BoundarySolution"] = true;
                // change boundary status of points that the current solution dominates
                for (var i=0;i<completedFrontierPoints.length;i++){
                    if (completedFrontierPoints[i]["BoundarySolution"]){
                        // assume the solution is dominated
                        var isDominated = true;
                        // and check to see if in any of the sub-dimensions it is better
                        for (var oidx=0;oidx<sos.length;oidx++){
                            // if it is, then it is nondominated
                            if(currSol[sos[oidx]] <= completedFrontierPoints[i][sos[oidx]]) {isDominated=false;break;}
                        }
                        // if it is dominated, we need to update its BoundarySolution status to false
                        if (isDominated){completedFrontierPoints[i]["BoundarySolution"]=false;}
                    }
                }
                // get the sub-D volume for the current solution
                currSol["SubDimContribution"] = getSubDimVolumeFromFrontierPoint(currSol,completedFrontierPoints);
                // update frontier volume
                initFrontierVolume += currSol["SubDimContribution"]*currSol[po];
                // update the points added to the frontier
                completedFrontierPoints.push(currSol);
                // update the remaining frontier points by removing currSol, which is first point
                remainingFrontierPoints.shift();
                // recursive call
                return getFrontierVolume(initFrontierVolume,remainingFrontierPoints,completedFrontierPoints);
            }
        }

        /* End of method definitions. Call to compute: */
        hypervolume = getFrontierVolume(hypervolume,ldat,completedFrontierPoints);
        return hypervolume;
    }
    return hypervols;
}

function computeSpacingMetric(datasets, idealvecs){
    var spacings = {};

    for (f in datasets){
        spacings[f] = computeSpacing(datasets[f], idealvecs[f]);
    }

    function computeSpacing(dataset,idealvec){
        var dists = [];

        for (var i=0;i<dataset.length;i++){
            // get min dist from each solution to another solution
            var minDist = Infinity;
            for (var j=0;j<dataset.length;j++){
                if (i===j) continue;
                var dist = 0;
                for (col in idealvec){
                    dist += Math.pow(dataset[i][col] - dataset[j][col],2);
                }
                dist = Math.sqrt(dist);
                if (dist < minDist) minDist = dist;
            }
            dists.push(minDist);
        }
        // average dist between solutions:
        var dbar = d3.sum(dists)/dists.length;
        // computing spacing = std deviation of dist between pts on frontier
        for (var i=0;i<dists.length;i++) dists[i] = Math.pow(dists[i]-dbar,2);
        var spacing = Math.sqrt(d3.sum(dists)/(dists.length-1));
        return spacing;
    }
    return spacings;
}

function computeUnaryEpsilonIs(datasets,ivecs){

    var unaryEpsIs = {};

    for (f in datasets){
        unaryEpsIs[f] = computeUnaryEps(datasets[f],ivecs[f]);
    }

    function computeUnaryEps(dataset,ivec){
        var eps = -Infinity;
        var minTranslationToCover = Infinity;
        for (var row=0;row<dataset.length;row++){
            var maxCoveringDist = 0;
            for (col in ivec){
                maxCoveringDist = Math.max(maxCoveringDist,ivec[col]-dataset[row][col]);
            }
            minTranslationToCover = Math.min(minTranslationToCover,maxCoveringDist);
        }
        eps = Math.max(eps,minTranslationToCover);
        return eps;
    }
    return unaryEpsIs;
}

function computeBinaryEpsilonIs(datasets,ivecs,nadirs){

    var binaryEpsIs = {};

    var frontierCombos = k_combinations(Object.keys(datasets),2);

    function computeBinaryEps(dataset1,dataset2,ivec){
        var eps = -Infinity;
        for (var row2=0;row2<dataset2.length;row2++){
            var minTranslationToCover = Infinity;
            for (var row1=0;row1<dataset1.length;row1++){
                var maxCoveringDist = -Infinity;
                for (col in ivec){
                    maxCoveringDist = Math.max(maxCoveringDist,dataset2[row2][col]-dataset1[row1][col]);
                }
                minTranslationToCover = Math.min(minTranslationToCover,maxCoveringDist);
            }
            eps = Math.max(eps,minTranslationToCover);
        }
        return eps;
    }

    for (var i=0;i<frontierCombos.length;i++){
        var f1 = frontierCombos[i][0];
        var f2 = frontierCombos[i][1];
        var c1 = f1+"_"+f2;
        var c2 = f2+"_"+f1;
        binaryEpsIs[c1] = computeBinaryEps(datasets[f1],datasets[f2],ivecs[f1]);
        binaryEpsIs[c2] = computeBinaryEps(datasets[f2],datasets[f1],ivecs[f1]);
    }
    return binaryEpsIs;
}

function computeDistsToIdeal (datasets,ivecs){

    var distsToIdeal = {};
    
    for (f in datasets){
        distsToIdeal[f] = computeDistToIdeal(datasets[f],ivecs[f]);
    }

    return distsToIdeal;

    function computeDistToIdeal(dataset,ivec){
        var dists = dataset.map(function(row){
            var sumsqrs = 0;
            for (col in ivec){
                sumsqrs += Math.pow(row[col] - ivec[col],2);
            }
            return Math.sqrt(sumsqrs);
        });
        return d3.sum(dists)/dists.length;
    }
}

/**
 * Given a dataset formatted properly for this analysis (has a column labeled "Frontier"),
 * gets the list of unique frontiers in the dataset.
 */
function getFrontiers(dataset){
    var frontiers = [];
    for (var i = 0; i < dataset.length; i++){
        if (frontiers.indexOf(dataset[i]["Frontier"]) < 0){
            frontiers.push(dataset[i]["Frontier"]);
        }
    }
    return frontiers;
}

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

/** Converts all objectives within a frontier to be bounded between 0 (worst) and 1 (best) */
function normalizeDatasets(){
    // clone the data
    var ndatasets = JSON.parse(JSON.stringify(datasets));
    // for each frontier, normalize the data columns
    for (frontier in datasets){
        for (col in datacols){

            // determine normalization based on objective sense
            var bounds = [d3.max(datasets[frontier],function(d){ return d[col]; })];
            if (datacols[col]>0){ // max objective
                bounds.unshift(d3.min(datasets[frontier],function(d){ return d[col]; }));
            } else { // min
                bounds.push(d3.min(datasets[frontier],function(d){ return d[col]; }));
            }
            // create scale to map data val to 0-1 range, with 1 being best
            var scale = d3.scaleLinear().domain(bounds);
            // map the data
            ndatasets[frontier] = ndatasets[frontier].map(function(row){
                row[col] = scale(row[col]);
                return row;
            })
        }
    }
    
    return ndatasets;
}

/** Sets all objective senses to max */
function normalizeDataCols(){
    var ndatacols = JSON.parse(JSON.stringify(datacols));

    for (col in datacols){
        ndatacols[col] = 1;
    }

    return ndatacols;
}

/**
 * Divide master dataset into individual datasets by the values in the frontier column 
 */
function divideDataByFrontier(dataset, frontiers){
    var datasets = {};
    for (var i=0;i<frontiers.length;i++){
        datasets[frontiers[i]] = dataset.filter(function(e){
            return e["Frontier"] === frontiers[i];
        })
    }
    return datasets;
}

/** Given an array, returns all k-sized combinations of elements */
function k_combinations(set, k) {
	var i, j, combs, head, tailcombs;
	
	// There is no way to take e.g. sets of 5 elements from
	// a set of 4.
	if (k > set.length || k <= 0) {
		return [];
	}
	
	// K-sized set has only one K-sized subset.
	if (k == set.length) {
		return [set];
	}
	
	// There is N 1-sized subsets in a N-sized set.
	if (k == 1) {
		combs = [];
		for (i = 0; i < set.length; i++) {
			combs.push([set[i]]);
		}
		return combs;
	}
	
	combs = [];
	for (i = 0; i < set.length - k + 1; i++) {
		// head is a list that includes only our current element.
		head = set.slice(i, i + 1);
		// We take smaller combinations from the subsequent elements
		tailcombs = k_combinations(set.slice(i + 1), k - 1);
		// For each (k-1)-combination we join it with the current
		// and store it to the set of k-combinations.
		for (j = 0; j < tailcombs.length; j++) {
			combs.push(head.concat(tailcombs[j]));
		}
	}
	return combs;
}

function computePearsonCoefficient(x, y) {
    var shortestArrayLength = 0;
  
    var xy = [];
    var x2 = [];
    var y2 = [];
  
    for(var i=0; i<shortestArrayLength; i++) {
        xy.push(x[i] * y[i]);
        x2.push(x[i] * x[i]);
        y2.push(y[i] * y[i]);
    }
  
    var sum_x = 0;
    var sum_y = 0;
    var sum_xy = 0;
    var sum_x2 = 0;
    var sum_y2 = 0;
  
    for(var i=0; i< shortestArrayLength; i++) {
        sum_x += x[i];
        sum_y += y[i];
        sum_xy += xy[i];
        sum_x2 += x2[i];
        sum_y2 += y2[i];
    }
  
    var step1 = (shortestArrayLength * sum_xy) - (sum_x * sum_y);
    var step2 = (shortestArrayLength * sum_x2) - (sum_x * sum_x);
    var step3 = (shortestArrayLength * sum_y2) - (sum_y * sum_y);
    var step4 = Math.sqrt(step2 * step3);
    var answer = step1 / step4;
  
    return answer;
}

/** Assumes all objectives are max and normalized */
function removeDominated(dataset,ivec){
    // clone data
    var result = JSON.parse(JSON.stringify(dataset));
    // instantiate list of dominated solution ids
    var domd = [];
    // number of objectives to check in dominance tests
    var numObj = Object.keys(ivec).length;
    for (var i=0;i<dataset.length;i++){ // for each solution, check if there is another that dominates it
        var currSol = dataset[i];
        for (var j=0;j<dataset.length;j++){
            if (i===j) continue;
            var domingObjs = 0;
            for (o in ivec){ if (dataset[j][o] >= dataset[i][o]) {domingObjs++;}}
            // could be sped up by adding splice statement on result in below line
            if (domingObjs === numObj) {domd.push(dataset[i]["mvid"]);break;}
        }
    }
    // remove dominated solutions
    result = result.filter(function(row){
        return domd.indexOf(row["mvid"])<0;
    })
    return result;
}