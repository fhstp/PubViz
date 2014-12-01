PUBVIS = function () {
    var make_it_all = function (params) {
        filename = params.filename;
        target = params.target;
        //console.log ('filename: ' + filename); 
        //console.log ('target: ' + target);

        fetch_bibfile ( filename );        
    };

    //get asynchron = stoßt weiteren verlauf an wenn daten geladen
    var fetch_bibfile = function ( filename ) {
        var result; 

        $.get( filename, function( data ) {
            //console.log( "Data Loaded" );
            result = bib2json( data );
        
            display_data( result.json ) ;

            display_error( result.errors ) ;
        });    
    }
    //return oneBigJson and errors in an object
    var bib2json = function ( bibfile ) {
        var dataArr, bigJson, errors, entry, entryAt;

        dataArr = bibfile.split("@");
        //console.log("DataArr filled ");

        bigJson = [];
        errors = { index: [], errorMessage: [], errorEntry: [] };
        for (var i = 1 ; i <= dataArr.length-1; i++) {

            entry = dataArr[i].toString();
            entryAt = "@" + entry;
            //console.log("1. entryAt: " + entryAt);

            try {

                //pars bib-entry to JSON list with one object
                jsonFormat = bibtexParse.toJSON( entryAt );
              //  console.log( "2. dataArr i: " + dataArr[i] );
              //  console.dir( jsonFormat );


            } catch (e) {
                errors.index.push( i );
                errors.errorMessage.push( e );
                errors.errorEntry.push ( entryAt );
                jsonFormat = "";
               // console.log ( e );
            }

            if ( jsonFormat !== "") { 
                //combine lists 
                bigJson = bigJson.concat (jsonFormat);
            }

            //console.log ("entry #" + i + " added");
            //console.log ("3. entry content: " + jsonFormatString);
        };

        //console.dir( bigJson );
        console.log("ende Bib2Json");
        return { json: bigJson,
                 errors: errors }; 

    }

    var display_data = function ( json ) {       
        var real_life_data, generated_data, data_years, data_amount;
        //draw data
        //console.dir( json );


        //*************************SEARCH JSON******************************//
        //returns an object with a list with all years (key: time_list)
        //and a list with the total amounts of publications per year (key: amount_list)
        var get_years = function () {
            var all_years_distinct = [], all_years_double = [], amount_per_years = [], actual_year, time_span;
            var oldest_year;

            //@param.array = array
            //@param.value = string (example "year") 
            var count_value_in_array = function (array, value) {
                var counter = 0;
                //console.log ("array.length: " + array.length );

                for ( var z = 0; z < array.length; z++ ) {
                    //console.log( "indexJahr: " + array[z] + " und value: " + value );
                    
                    if ( array[z] === value ) {
                        counter++
                        //console.log ("match!" + " count: " + counter);
                    }
                }
                return counter;
            }


            //save all years into a list
            for ( var i = 0; i < json.length; i++ ) {
                
                if ( json[i].entryTags.year){
                    all_years_double.push( json[i].entryTags.year );
                }

            }
            //console.log( "all_years: " + all_years_double.length);

            //sort array (as JS sorts all emlements as strings, this inner function is 
            //necessary to order intagers correct 
            //source: Douglas Crockford, JavaScript. The good Parts., p.80
            all_years_double.sort( function ( a, b ) {
                return a - b;
            });
            //console.log ( "all_years_double" );
            //console.dir (all_years_double);

            //get first element (= oldest year) and calculate time span for length of array           
            actual_year = new Date().getFullYear();
            oldest_year = parseInt(all_years_double[0], 10);
            time_span = actual_year - oldest_year;
            //console.log( "oldest year: " + all_years_double[0]);
            //console.log( "actual_year: " + actual_year );
            //console.log( "time_span: " + time_span );

            //create a new list with time span
            for ( var y = 0; y <= time_span; y++ ) {
                
                all_years_distinct.push( oldest_year );
                oldest_year++;

            }
            //console.log( "all_years_distinct: " );
            //console.dir( all_years_distinct );

            //iterate list with all_years_double and count their orccurance
            for ( var y = 0; y <= time_span; y++ ) {

                var amount = count_value_in_array( all_years_double, all_years_distinct[y].toString() );
                //console.log ("all_years[y]: " + all_years[y] );
                amount_per_years.push( amount );
                //console.log ("year: " +  all_years_distinct[y] + " amount: " + amount);
            }
            return { time_list: all_years_distinct,
                     amount_list: amount_per_years };
        }


        //*************************TEST DATA******************************//
        //generate an array with testdata, returns a list with all years counted 
        //from startYear and a list in the same length with randmom amount
        var generate_testData = function ( startYear ) {
            var testArr_years = [], testArr_amount = [], year, amount;          
            year = startYear;
            
            for (i = startYear; i <= 2014; i++ ) {
                amount = Math.floor((Math.random() * 10) + 1); //random # between 1 and 10
                testArr_amount.push( amount );
                testArr_years.push( year );
                year++;
                
            }
            return { years: testArr_years,
                     amount: testArr_amount };
        }

        //*** datasets
        real_life_data = get_years( json );
        generated_data = generate_testData( 1983 );

        data_years = real_life_data.time_list;
        //data_years = generated_data.years;
            //console.log ( "data_years: " );
            //console.dir ( data_years );
        data_amount = real_life_data.amount_list;
        //data_amount = generated_data.amount;
            //console.log ( "amount_list" );
            //console.dir ( data_amount ); 


        //*************************BAR*CHART*START***********************//
        var create_bar_chart = function ( data_years, data_amount ){ 
            //*** declare vars
            var chart = {};
            var margin, view_width, view_height, svgH, svgW, left, right, top, bottom, padd_bar;
            var xScale, yScale, svg;

            chart.setup = function() { 
                //*** Setup dimensons
                view_height = 200;
                view_width = $(document).width(); //returns width of HTML document | $(window).width() returns width of browser viewport
                margin = {top: 20, right: 20, bottom: 20, left: 20};
                padd_bar = 5;
                label_space = 19;
                bar_height = 20; //height of the background bar behind the years
                

                //calculate absolut width and height for svg
                svgH = view_height - margin.top - margin.bottom;
                svgW =  view_width - margin.left - margin.right; 
                //console.log( "docWidth: " + $(document).width());       

     
                //*** Setting up a linear yScale for the height of the bars
                yScale = d3.scale.linear()
                            .domain ([ d3.min( data_amount ), d3.max( data_amount ) ]) //max, min of inputrange
                            .range([ 0, (svgH - label_space) ]); //subttact space for labels so scaling is correct
              
                
                //*** setting up ordinal scale for x-axis  
                xScale = d3.scale.ordinal()
                                .domain( d3.range(data_years.length) ) //d3.range(x) returns an array with x elements sorted from 0-x
                                .rangeRoundBands([ 0, svgW ], 0.2); //5% space between bars

                
                //*** create svg element appens it to the param.target (=#pubvis_container)
                svg = d3.select( target )
                        .append( "svg" )
                        .attr({
                            class: "chart",
                            width: view_width,
                            height: view_height
                        })
                        .append("g")
                        .attr("transform", "translate(" + margin.left + "," + margin.top + ")"); //move x,y of whole svg.chart
            }

            chart.create_bars = function () { 
                var rect, bar_group, bar;
                //create group for bars
                bar_group = svg.append( "g" );  

                //fill group with bars
                bar = bar_group.selectAll( "rect" )
                        .data( data_amount )
                        .enter ()
                        .append ( "rect" )
                        .attr ({
                            y: function( d ){ return svgH - yScale( d ) - label_space; }, //subtract space for labels to have space for labels ;o)
                            x: function( d, i ){ return xScale( i ) },
                            //time: x: function ( d, i ) { 
                                //return i * ( svgW / data_years.length ) + padd_bar; },
                            width: xScale.rangeBand(),
                            //time width: Math.floor( svgW / data_years.length - padd_bar),
                            height: function( d ){ return yScale( d ); },
                            fill: "#EEEEEE",
                            class: "bar",
                            id: function( d,i ) { 
                                //console.log( "bar_id: " + data_years[i] ); 
                                return data_years[i]; }
                        }) 
                        .on( "click", function( d, j ) {
                            console.log( "click: " + d );

                            if ( d3.select(this).attr( "fill" ) === "#EEEEEE" ) { 
                                d3.select(this).attr( "fill", "#FFE601");
                            } else {
                                d3.select(this).attr( "fill", "#EEEEEE");
                            }
                            //console.log( "fill: " + d3.select(this).attr("fill") );
                            //console.log( "year: " + data_years[ j ] ); //log the clicked year
                        });
            }       

            chart.create_labels = function () {
                var labels, label_group;

                //create group for labels years and move y to the bottom of the chart-svg
                var label_group = svg.append( "g" )
                                    .attr("transform", "translate(0," + svgH + ")");

                //create labels for years
                labels = label_group.selectAll( "text" )
                            .data( data_years )
                            .enter()
                            .append( "text" )
                            .text ( function( d ) { return d; } )
                            .attr({
                                //time: x: function ( d, i ) { return i * ( svgW / data_years.length) + padd_bar + ( (svgW / data_years.length) /2) ; },
                                x: function( d, i ){ return xScale( i ) + (xScale.rangeBand()/2) },
                                y: 0, //cause of grouping and transform of the labels_group
                                fill: "black",
                                class: "labels",
                                "text-anchor": "middle",
                                id: function (d,i) { return d; }
                            })
                            .on( "click", function( d ) {
                                console.log( "click: " + d );
                                if ( d3.select(this).attr( "fill" ) === "black" ) { 
                                    d3.select(this).attr( "fill", "#FFE601");
                                } else {
                                    d3.select(this).attr( "fill", "black");
                                }
                                //selected_text_id = d3.select(this).attr("id");
                                //console.log( "selected_text_id: " + selected_text_id );
                            });  
            } 

            chart.render = function() {

                chart.create_bars();
                chart.create_labels();

            } 

            chart.setup();
            chart.render();  

            return chart;                   

        }
        //call
        var bar_chart = create_bar_chart ( data_years, data_amount );
        //*************************BAR*CHART*ENDE***********************//

    }    


    var display_error = function ( errors ) {

        //draw errors
        //console.dir ( errors ); 
    }

    return { make_it_all : make_it_all };
} ();





