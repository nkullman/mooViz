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

// Compute statistics for both normalized and original datasets
var datastats = { original: {}, normalized:{} };
datastats["original"] = getDatasetStats();
datastats["normalized"] = getNormalizedDatasetStats();











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
 * 
 * 
 * */
function getNormalizedDatasetStats(){
    var outstats = {};
    var currIdeals = ideals["normalized"];
    var currNadirs = nadirs["normalized"];
    var currDataset = ndatasets;

    // Compute average distance to ideal solution
    outstats["distToIdeal"] = computeDistsToIdeal(currDataset,currIdeals);

    // Compute unary epsilon indicator
    outstats["unaryEpsilon"] = computeUnaryEpsilonIs(currDataset,currIdeals);

    // Compute spacing metric
    outstats["spacing"] = computeSpacingMetric(currDataset,currIdeals);

    // Compute unary hypervolume indicator
    outstats["hypervolume"] = computeHypervolumes(currDataset,currIdeals,currNadirs);

    // Compute binary epsilon indicator
    outstats["binaryEpsilon"] = computeBinaryEpsilonIs(currDataset,currIdeals);

    return outstats;
}

/**
 * Compute dataset statistics for the original dataset.
 * In the normalized dataset, all objectives run from 0-1, with 1 being the best 
 * Binary Hypervolume indicator
 * Binary additive epsilon indicator
 * Unary hypervolume indicator
 * Unary epsilon indicator
 * 
 * 
 * */
function getDatasetStats(){
    var outstats = {};
    var currIdeals = ideals["original"];
    var currNadirs = nadirs["original"];
    var currDataset = datasets;

    // Compute average distance to ideal solution
    outstats["distToIdeal"] = computeDistsToIdeal(currDataset,currIdeals);

    // Compute unary epsilon indicator
    outstats["unaryEpsilon"] = computeUnaryEpsilonIs(currDataset,currIdeals);

    // Comptue Scott's spacing metric
    outstats["spacing"] = computeSpacingMetric(currDataset,currIdeals);

    // Compute unary hypervolume indicator
    outstats["hypervolume"] = computeHypervolumes(currDataset,currIdeals,currNadirs);

    return outstats;
}

function computeHypervolumes(datasets,idealvecs,nadirvecs){
    var hypervols = {};

    for (f in datasets){
        hypervols[f] = computeHypervolume(datasets[f], idealvecs[f], nadirvecs[f]);
    }

    function computeHypervolume(dataset,idealvec,nadirvec){
        var hypervolume = 0;

        // primary objective:
        var po = Object.keys(idealvec)[0];
        // secondary objectives:
        var sos = Object.keys(idealvec).filter(function(a){return a !== po;});
        // clone data for local use:
        var ldat = JSON.parse(JSON.stringify(dataset));
        // Translate objectives' scales (all max from 0->best)
        for (obj in idealvec){
            var newObjScale = d3.scaleLinear()
                    .domain([nadirvec[obj],idealvec[obj]])
                    .range([0,Math.abs(nadirvec[obj] - idealvec[obj])]);
            ldat = ldat.map(function(row){
                row[obj] = newObjScale(row[obj]);
                return row;
            })
        }
        // sort descending by primary objective
        ldat = ldat.sort(function(a,b){
            return b[po] - a[po];
        });
        // list of frontier points already accounted for (currently empty):
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

        /* End of methods. Call to compute: */
        hypervolume = getFrontierVolume(hypervolume,ldat,completedFrontierPoints);
        console.log(hypervolume);
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
        var dbar = arraySum(dists)/dists.length;
        // computing std deviation of pts on frontier
        for (var i=0; i<dists.length;i++) dists[i] = Math.pow(dists[i]-dbar,2);
        // compuing spacing
        var spacing = Math.sqrt(arraySum(dists)/(dists.length-1));
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
                maxCoveringDist = Math.max(maxCoveringDist,Math.abs(ivec[col]-dataset[row][col]));
            }
            minTranslationToCover = Math.min(minTranslationToCover,maxCoveringDist);
        }
        eps = Math.max(eps,minTranslationToCover);
        return eps;
    }

    return unaryEpsIs;
}

function computeBinaryEpsilonIs(datasets,ivecs){

    var binaryEpsIs = {};

    var frontierCombos = k_combinations(Object.keys(datasets),2);

    for (var i=0;i<frontierCombos;i++){
        var f1 = frontierCombos[i][0];
        var f2 = frontierCombos[i][1];
        var d1 = THEDATASETALLMAXED;
        var d2 = THEDATASETALLMAXED;
        var combonm = f1+"_"+f2;
        // This should work if all objs are set to Max. Look at the use of the scale from the hypervolume indicator
        binaryEpsIs[combonm] = computeBinaryEps(d1,d2,ivecs[f1]);
    }

    function computeBinaryEps(dataset1,dataset2,ivec){
        var eps = -Infinity;
        for (var row2=0;row2<dataset2.length;row2++){
            var minTranslationToCover = Infinity;
            for (var row1=0;row1<dataset1.length;row1++){
                var maxCoveringDist = 0;
                for (col in ivec){
                    maxCoveringDist = Math.max(maxCoveringDist,Math.abs(dataset2[row2][col]-dataset1[row1][col]));
                }
                minTranslationToCover = Math.min(minTranslationToCover,maxCoveringDist);
            }
            eps = Math.max(eps,minTranslationToCover);
        }
        return eps;
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
        var sum = 0;
        for (var i = 0; i < dists.length; i++){ sum += dists[i]; }
        return sum/dists.length;
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
            // create scale to map data val to 0-1 range
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

function arraySum(anArray){
    var sum = 0;
    for (var i=0;i<anArray.length;i++){
        sum += anArray[i];
    }
    return sum;
}

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