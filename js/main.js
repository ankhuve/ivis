var chartContainerId = "chartContainer";

d3.select(window).on("resize", throttle);

var zoom = d3.behavior.zoom()
    .scaleExtent([1, 8])
    .on("zoom", move);

var width = window.innerWidth-10;
var height = window.innerHeight-10;

var topo,
    projection,
    path,
    svg,
    question,
    g;

var tooltip = d3.select("#chartContainer").append("div").attr("class", "tooltip hidden");

setup(width,height);

function setup(width,height){
    projection = d3.geo.mercator()
        .translate([0, 0])
        .scale(width / 2 / Math.PI);

    path = d3.geo.path()
        .projection(projection);

    svg = d3.select("#chartContainer").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 1.6 + ")")
        .call(zoom);

    g = svg.append("g");

}

d3.json("data/world-topo.json", function(error, world) {

    var topo = topojson.feature(world, world.objects.countries).features;

    d3.json("data/data.json", function(error, question) {
        setQuestionData( question );
        draw( topo );
    });


});

function setQuestionData( d ){
    question = d;
}

//
//function addQuestionDataToCountries( data ){
//
//    for (var i = 0; i < data.length; i++ ){
//        d3.select( document.getElementById( data[i].Country ) )
//            .style( "fill", "#4BBA52")
//            .attr( "test", function( data, i ) { return data[i].Country; });
//        console.log(data[i].Country);
//
//    }
//}

function draw( topo ) {

    var country = g.selectAll(".country").data(topo);

    country.enter().insert("path")
        .attr("class", "country")
        .attr("d", path)
        .attr("id", function( d ) { return d.properties.name; })
        .attr("test", function ( d, question )
        {
            console.log(question);
            for( var i = 0; i < question.length; i++ ){
                //console.log(d.properties.name, question[i].Country);
                //if( d.properties.name == question[i].Country ){
                //    console.log("hej");
                //    return (d.properties.name);
                //}
            }
        });
            //if(d.properties.name === question.)})
    //.style("fill", function(d, i) { return d.properties.color; });

    //offsets plus width/height of transform, plus 20 px of padding, plus 20 extra for tooltip offset off mouse
    var offsetL = document.getElementById(chartContainerId).offsetLeft+(width/2)+20;
    var offsetT = document.getElementById(chartContainerId).offsetTop+(height/2)+140;

    //tooltips
    country
        .on("mouseenter", function(d){
            tooltip.classed("hidden", false).html(d.properties.name);
        })
        .on("mousemove",function() {
            var mouse = d3.mouse(svg.node()).map( function(d) { return parseInt(d); } );

            if( mouse[0] > (window.innerWidth/2)-200 ){ // tooltip would go outside the window to the right
                tooltip.attr("style", "left:"+(mouse[0]+offsetL-200)+"px;");
            } else{
                tooltip.attr("style", "left:"+(mouse[0]+offsetL)+"px;");
            }

            if( mouse[1] > (window.innerHeight/2)-200 ){ // tooltip would go outside the window at the bottom
                tooltip.attr("style", tooltip.attr("style") + "top:"+(mouse[1]+offsetT-100)+"px;");
            } else{
                tooltip.attr("style", tooltip.attr("style") + "top:"+(mouse[1]+offsetT)+"px;");
            }
        })
        .on("mouseout",  function() {
            tooltip.classed("hidden", true)
        });

}

function redraw() {
    width = window.innerWidth-10;
    height = window.innerHeight-10;
    d3.select('svg').remove();
    setup(width,height);
    draw(topo);
}

function move() {

    var t = d3.event.translate;
    var s = d3.event.scale;
    var h = height / 3;

    t[0] = Math.min(width / 2 * (s - 1), Math.max(width / 2 * (1 - s), t[0]));
    t[1] = Math.min(height / 2 * (s - 1) + h * s, Math.max(height / 2 * (1 - s) - h * s, t[1]));

    zoom.translate(t);
    g.style("stroke-width", 1 / s).attr("transform", "translate(" + t + ")scale(" + s + ")");

}

var throttleTimer;
function throttle() {
    window.clearTimeout(throttleTimer);
    throttleTimer = window.setTimeout(function() {
        redraw();
    }, 200);
}