var chartContainerId = "chartContainer";

d3.select(window).on("resize", throttle);

var zoom = d3.behavior.zoom()
    .scaleExtent([1, 20])
    .on("zoom", move);

var width = document.getElementById( "chartContainer" ).offsetWidth;
var height = window.innerHeight-5;

var topo,
    projection,
    path,
    svg,
    question,
    gapminderData,
    g;

var tooltip = d3.select("#currentInfo").append("h1").attr("class", "tooltip hidden").attr("id", "currentCountry");
var valueContainer = d3.select("#currentInfo").append("h2").attr("class", "tooltip hidden").attr("id", "questionValue");

setup(width,height);

function setup(width,height){
    projection = d3.geo.mercator()
        .translate([0,-width/10])
        .scale(width / 2 / Math.PI);

    path = d3.geo.path()
        .projection(projection);

    svg = d3.select("#chartContainer").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 1.5 + ")")
        .call(zoom);

    g = svg.append("g");

    d3.json("data/world-topo.json", function(error, world) {
        if( error ){ console.log( error )}
        else{
            var topo = topojson.feature(world, world.objects.countries).features;

            // set WVS data
            d3.json("data/data.json", function(error, question) {
                if( error ){ console.log( error )}
                else{
                    setQuestionData( question );

                    // set gapminder data
                    d3.csv("data/gdp_per_capita.csv", function(error, gapminder ) {
                        if( error ){ console.log( error )}
                        else{
                            setGapminderData( gapminder );
                            draw( topo );
                        }

                    });
                }



            });
        }




    });
}

function setQuestionData( d ){
    question = d;
}

function setGapminderData( d ){
    gapminderData = d;
}

var topValue = 0;
var botValue = 100;
var color;
function createColorScale( ) {
    for (var k = 1; k < question.length; k++) {
        if (parseFloat(question[k].poverty.replace(",", ".")) > topValue) {
            topValue = parseFloat(question[k].poverty.replace(",", "."));
        } else {
            if (parseFloat(question[k].poverty.replace(",", ".")) < botValue) {
                botValue = parseFloat(question[k].poverty.replace(",", "."));
            }
        }
    }
    color = d3.scale.linear()
        .domain( [botValue, topValue] )
        .range( ["#B56A49", "#5dac57"] );
}

var tempSelector,
    current;
function addQuestionDataToCountries(){

    for( var k = 1; k < question.length; k++ ){
        topValue = parseFloat( question[k].poverty.replace( ",", "." ));
        tempSelector = "#" + question[k].country.replace( " ", "" );
        current = d3.selectAll( tempSelector );
        current.attr("qData", function (){
                return parseFloat( question[k].poverty.replace( ",", "." ) );
            })
            .style( "fill", function(){ return color(parseFloat( question[k].poverty.replace( ",", "." ))) })
            .classed( "active", true );
    }

    for( var i = 0; i < gapminderData.length; i++ ){
        //topValue = parseFloat( gapminderData[i].gdpPerCapita );
        tempSelector = "#" + gapminderData[i].Country.replace( " ", "" );
        if( gapminderData[i].gdpPerCapita ){
            console.log( gapminderData[i] );
            current = d3.selectAll( tempSelector );
            current.attr( "gData", function (){
                    return parseFloat( gapminderData[i].gdpPerCapita );
                })
                .style( "fill", function(){ return "red" })
                .classed( "active", true );
        }

    }
}

function draw( topo ) {

    var country = g.selectAll(".country").data(topo);

    country.enter().insert("path")
        .attr("class", "country")
        .attr("d", path)
        .attr("id", function( d ) { return d.properties.name.replace( " ", "" ); });

    createColorScale();
    createSlider();
    addQuestionDataToCountries();

    //tooltips
    country
        .on("mouseenter", function(d){
            if ( this.getAttribute( "qData" ) ){
                var currentCountry = this;
                //var currentCountryColor = window.getComputedStyle( currentCountry ).getPropertyValue( "fill" );

                d3.selectAll( ".infoSlide").classed( "getOutOfHere", true );
                tooltip.classed("hidden", false).html(d.properties.name);
                valueContainer.classed("hidden", false);
                valueContainer.html(( this.getAttribute( "qData" ) ? this.getAttribute( "qData" ) + " %" : "Country has no data" ))
                    .style( "color", function(){ return color( parseFloat( currentCountry.getAttribute( "qData" )) )} );

            }
        })
        .on("mouseout",  function() {
            if ( !this.getAttribute( "qData" ) ){
                valueContainer.attr( "class", "" );
            }
            tooltip.classed("hidden", true);
            valueContainer.classed("hidden", true);
            d3.selectAll( ".infoSlide").classed( "getOutOfHere", false );

        });
}

var toggled = true;
function filterData( lowVal, highVal ){
    toggled = !toggled;

    var countriesWithData = d3.selectAll( ".active" );
    countriesWithData
        .filter( function(){ return this.getAttribute( "qData" ) > lowVal && this.getAttribute( "qData" ) < highVal } )
        .style( "fill", function(){
            return color( this.getAttribute( "qData" ))
        })
        .classed( "fadedCountry", false );

    // Fade the countries outside the range
    countriesWithData.filter( function(){ return this.getAttribute( "qData" ) < lowVal || this.getAttribute( "qData" ) > highVal })
        .classed( "fadedCountry", true );

}

function createSlider(){
    $(function() {
        var jqSlider = $( "#filterValueSlider" );
        jqSlider.slider({
            range: true,
            min: 0,
            max: 100,
            values: [ botValue, topValue ],
            slide: function( event, ui ) {
                filterData( ui.values[ 0 ], ui.values[ 1 ] );
                $( "#lowVal" ).html( jqSlider.slider( "values", 0 ) + " %");
                $( "#highVal" ).html( jqSlider.slider( "values", 1 ) + " %");
            }
        });
        $( "#lowVal" ).html( jqSlider.slider( "values", 0 ) + " %");
        $( "#highVal" ).html( jqSlider.slider( "values", 1 ) + " %");
    });
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

// for resizing
function redraw() {
    width = document.getElementById( "chartContainer" ).offsetWidth;
    height = window.innerHeight-5;
    d3.select('svg').remove();
    setup(width,height);
    draw(topo);
}

var throttleTimer;
function throttle() {
    window.clearTimeout(throttleTimer);
    throttleTimer = window.setTimeout(function() {
        redraw();
    }, 200);
}