PUBVIS = function () {
    var make_it_all = function (params) {
        filename = params.filename;
        target = params.target;

        fetch_bibfile ( filename );        
    };

    //@param.filename = String (e.g "file.bib")
    var fetch_bibfile = function ( filename ) {
        var result; 

        $.get( filename, function( data ) {

            result = bib2json( data );
        
            display_data( result.json ) ;

            display_error( result.errors ) ;
        });    
    }
    //return oneBigJson and errors in an object
    //@param.bibfile = bib data
    var bib2json = function ( bibfile ) {
        var dataArr, bigJson, errors, entry, entryAt;

        dataArr = bibfile.split("@");

        bigJson = [];
        errors = { index: [], errorMessage: [], errorEntry: [] };
        for (var i = 1 ; i <= dataArr.length-1; i++) {

            entry = dataArr[i].toString();
            entryAt = "@" + entry;

            try {
                //pars bib-entry to JSON list with one object
                jsonFormat = bibtexParse.toJSON( entryAt );
            } catch (e) {
                errors.index.push( i );
                errors.errorMessage.push( e );
                errors.errorEntry.push ( entryAt );
                jsonFormat = "";
            }

            if ( jsonFormat !== "") { 
                //combine lists 
                bigJson = bigJson.concat (jsonFormat);
            }
        };
        //console.log("ende Bib2Json");
        return { json: bigJson,
                 errors: errors }; 
    }

    //@param.json = bib entries in json format
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

                    for ( var z = 0; z < array.length; z++ ) {
                        
                        if ( array[z] === value ) {
                            counter++
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

                //sort array (as JS sorts all emlements as strings, this inner function is 
                //necessary to order intagers correct 
                //source: Douglas Crockford, JavaScript. The good Parts., p.80
                all_years_double.sort( function ( a, b ) {
                    return a - b;
                });

                //get first element (= oldest year) and calculate time span for length of array           
                actual_year = new Date().getFullYear();
                oldest_year = parseInt(all_years_double[0], 10);
                time_span = actual_year - oldest_year;

                //create a new list with time span
                for ( var y = 0; y <= time_span; y++ ) {
                    
                    all_years_distinct.push( oldest_year );
                    oldest_year++;

                }

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
            //generates an array with testdata, returns a list with all years counted 
            //from startYear and a list in the same length with randmom amount
            //@params.startYear = number (e.g. 1980)
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
            //real_life_data = get_years( json );
            generated_data = generate_testData( 1983 );

            //data_years = real_life_data.time_list;
            data_years = generated_data.years;
            //data_amount = real_life_data.amount_list;
            data_amount = generated_data.amount;


        //*************************BAR*CHART*START***********************//
        //@param.data_year = Array 
        //@param.data_amount = Array
        var create_bar_chart = function ( data_years_all, data_amount_all ){ 
            //console.log( "start create_bar_cart" );
            //*** declare vars
            var chart = {};
            var margin, view_width, view_height, svgH, svgW, left, right, top, bottom, padd_bar;
            var xScale, yScale, svg, max_number_of_bars;
            var change_color_of_item, setup, bars, labels, create_buttons, render;
            var data_years_all, data_years, data_amount_all, data_amount, sequence;
            var number_of_periods, steps, max_number_of_bars, count_clicks;

            count_clicks = 0; 
            number_of_periods = 0;

            //@param.clicked_item_id = String (e.g."#bar_2001")
            //@param.color1 = original color of item (e.g. "balck" or "#xxxxxx" )
            //@param.color2 = color for selected items (e.g. "balck" or "#xxxxxx" ) 
            change_color_of_item = function( clicked_item_id, color1, color2 ) {
                var clicked_class;

                if ( $( clicked_item_id ).attr( "fill" ) === color1 ) { 
                    $( clicked_item_id ).attr( "fill", color2);
                } else {
                    $( clicked_item_id ).attr( "fill", color1);
                }
            }

            chart.setup = function() { 
                //console.log( "start setup" );


                //*** Setup dimensons
                view_height = 200;
                view_width = $(document).width(); //returns width of HTML document | $(window).width() returns width of browser viewport
                margin = {top: 20, right: 20, bottom: 20, left: 20};
                padd_bar = 5;
                label_space = 19;
                bar_height = 20; //height of the background bar behind the years
                max_number_of_bars = 30;
                steps = 5;
                number_of_periods = 0;
                

                //calculate absolut width and height for svg
                svgH = view_height - margin.top - margin.bottom;
                svgW =  view_width - margin.left - margin.right;        

     
                
                
                //check if number of years contained in the data, extend the number of planed bars that will be shown
                if ( data_years_all.length > max_number_of_bars ) { 
                    
                    //claculate the number of needed periods that have to be slidable
                    number_of_periods = Math.floor( ( (data_years_all.length - 1) - max_number_of_bars ) / steps ); 
                    console.log("number_of_periods: " + number_of_periods);

                    data_amount = set_data_period( data_amount_all, 0, steps, max_number_of_bars);
                    data_years = set_data_period( data_years_all, 0, steps, max_number_of_bars);

                } else {

                    data_amount = data_amount_all;
                    data_years = data_years_all;
                    
                }

                //*** Setting up a linear yScale for the height of the bars   
                yScale = d3.scale.linear()
                            .domain ([ d3.min( data_amount ), d3.max( data_amount ) ]) //max, min of inputrange
                            .range([ 0, (svgH - label_space) ]); //subttact space for labels so scaling is correct
                
                xScale = d3.scale.ordinal()
                                    .domain( d3.range( data_years.length ) ) //d3.range(x) returns an array with x elements sorted from 0-x
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
                
                //console.log( "setup ende" );
            }

            chart.bars = function () { 
                var rect, bar_group, bar, clicked_id_bar, clicked_id_text, create_bars, update_bars;
                
                //create group for bars
                bar_group = svg.append( "g" );

                chart.create_bars = function () { 
                    //console.log( "create_bars start" );  
                    
                    //fill group with bars
                    bar = bar_group.selectAll( "rect" )
                            .data( data_amount )
                            .enter ()
                            .append ( "rect" )
                            .attr ({
                                y: function( d ){ return svgH - yScale( d ) - label_space; }, //subtract space for labels to have space for labels ;o)
                                x: function( d, i ){ return xScale( i ) },
                                width: xScale.rangeBand(),
                                height: function( d ){ return yScale( d ); },
                                fill: "#EEEEEE",
                                class: "bar",
                                id: function( d,i ) { 
                                    return "bar_" + data_years[i]; }
                            }) 
                            .on( "click", function( d, j ) {
                                //bar is fist clicked >> bar and label_year turn into yellow
                                //bar is second clicked >> bar and label_year turn into orignal color

                                clicked_id_text = "#label_year_" + data_years[ j ];
                                clicked_id_bar = "#" + d3.select(this).attr( "id" );

                                change_color_of_item( clicked_id_bar, "#EEEEEE", "#FFE601" );
                                change_color_of_item( clicked_id_text, "black", "#FFE601" );                      
                            }); 
                    //console.log( "create_bars ende" );          
                } 

                chart.update_bars = function ( dataset_amount, dataset_years ){
                    //console.log( "update_bars aufgerufen" );
                    
                    //fill group with bars
                    bar = bar_group.selectAll( "rect" )
                            .data( dataset_amount )
                            .attr ({
                                y: function( d ){ return svgH - yScale( d ) - label_space; }, //subtract space for labels to have space for labels ;o)
                                x: function( d, i ){ return xScale( i ) },
                                width: xScale.rangeBand(),
                                height: function( d ){ return yScale( d ); },
                                fill: "#EEEEEE",
                                class: "bar",
                                id: function( d,i ) { 
                                    return "bar_" + dataset_years[i]; }
                            }) 
                            .on( "click", function( d, j ) {
                                //bar is fist clicked >> bar and label_year turn into yellow
                                //bar is second clicked >> bar and label_year turn into orignal color

                                clicked_id_text = "#label_year_" + dataset_years[ j ];
                                clicked_id_bar = "#" + d3.select(this).attr( "id" );

                                change_color_of_item( clicked_id_bar, "#EEEEEE", "#FFE601" );
                                change_color_of_item( clicked_id_text, "black", "#FFE601" );                      
                            }); 
                    //console.log( "update_bars ende" );                                 
                } 
            }         

            chart.labels = function () { 
                var labels, label_group, clicked_id_bar, clicked_id_text;

                //create group for labels years and move y to the bottom of the chart-svg
                var label_group = svg.append( "g" )
                                     .attr("transform", "translate(0," + svgH + ")");
                
                chart.create_labels = function () {

                    //create labels for years
                    labels = label_group.selectAll( "text" )
                                .data( data_years )
                                .enter()
                                .append( "text" )
                                .text ( function( d ) { return d; } )
                                .attr({
                                    x: function( d, i ){ return xScale( i ) + (xScale.rangeBand()/2) },
                                    y: 0, //cause of grouping and transform of the labels_group
                                    fill: "black",
                                    class: "labels",
                                    "text-anchor": "middle",
                                    id: function (d,i) { return "label_year_" + d; }
                                })
                                .on( "click", function( d, j ) {
                                    //label_year is fist clicked >> bar and label_year turn into yellow
                                    //label_year is second clicked >> bar and label_year turn into orignal color

                                    clicked_id_bar = "#bar_" + data_years[ j ];
                                    clicked_id_text = "#" + d3.select(this).attr( "id" );

                                    change_color_of_item( clicked_id_bar, "#EEEEEE", "#FFE601" );
                                    change_color_of_item( clicked_id_text, "black", "#FFE601" );
                                
                                 });    
                } 

                chart.update_labels = function ( dataset_years ) {
                    //console.log( "update_labels aufgerufen" );
                    //create labels for years
                    labels = label_group.selectAll( "text" )
                                .data( dataset_years )
                                .text ( function( d ) { return d; } )
                                .attr({
                                    x: function( d, i ){ return xScale( i ) + (xScale.rangeBand()/2) },
                                    y: 0, //cause of grouping and transform of the labels_group
                                    fill: "black",
                                    class: "labels",
                                    "text-anchor": "middle",
                                    id: function (d,i) { return "label_year_" + d; }
                                })
                                .on( "click", function( d, j ) {
                                    //label_year is fist clicked >> bar and label_year turn into yellow
                                    //label_year is second clicked >> bar and label_year turn into orignal color

                                    clicked_id_bar = "#bar_" + dataset_years[ j ];
                                    clicked_id_text = "#" + d3.select(this).attr( "id" );

                                    change_color_of_item( clicked_id_bar, "#EEEEEE", "#FFE601" );
                                    change_color_of_item( clicked_id_text, "black", "#FFE601" );
                                
                                 });  
                //console.log( "update_labels ende" );  
                }
            }

            //slices a given dataset into the needed periods that are demanded by the left/right-buttons next to the year labels 
            //@params.incoming_dataset = list 
            //@params.count_clicks = number
            //@params.steps = number indicating how many years will be updated if button "left/right" is clicked
            //@params.max_number_of_bars = number of years to display in the bar chart (e.g 30 produce bars from 1984 - 2014)
            var set_data_period = function ( incoming_dataset, count_clicks , steps, max_number_of_bars ) {
                var new_dataset = {}, index_start, index_ende, end_period, start_period;
                var incoming_dataset, count_clicks , steps, last_step, last_step_difference, max_number_of_bars;

                start_period = max_number_of_bars * (-1) - 1;

                //check if the last period of years are less than the number of regular steps
                //calculate the last step and consequentliy the start_index and end_index to slice the datalist correctly
                if ( ((incoming_dataset.length-1) % steps !== 0 ) 
                     &&  (count_clicks > number_of_periods) ) {
                    
                    last_step = ( (incoming_dataset.length-1) - max_number_of_bars ) - ( number_of_periods * steps );
                    last_step_difference = steps - last_step;               

                    //index is negative, cause then the new_dataset will begin that many elements from the end of the array
                    index_start = start_period - ( count_clicks * steps ) + last_step_difference;
                    index_ende = steps * ( count_clicks * -1 ) + last_step_difference; 

                } else {
                    index_start = start_period - ( count_clicks * steps );
                    index_ende = steps * ( count_clicks * -1 );        
                }

                //index is negative, because then the new_dataset will begin that 
                //many elements from the end of the array                
                if ( index_ende === 0 ) { 
                    new_dataset = incoming_dataset.slice( index_start ); 
                } else { 
                    new_dataset = incoming_dataset.slice( index_start, index_ende ); 
                }
                
                return new_dataset;
            }
           

            chart.create_buttons = function(){
                var btn_left, btn_right, btn_group, buttons_text = [];

                buttons_text = ["<", ">"];

                btn_group = svg.append( "g" )
                                .attr("transform", "translate(-5," + svgH + ")");

                buttons = btn_group.selectAll( "text" )
                                .data( buttons_text )
                                .enter()
                                .append( "text" )
                                .text ( function( d ) { return d; } )
                                .attr({
                                    x: function( d, i ){ return i * svgW }, //later to include the width of the button image
                                    y: 0,
                                    id: function( d, i ){ return d },
                                })
                                .on( "click", function( d, j ) {
                                    //console.log( "button klicked: " + d );

                                    //take care that number of clicks do not extend the maximal number of perisods
                                    if ( (d === ">") 
                                        && (count_clicks <= number_of_periods) 
                                        && (count_clicks > 0 ) ) {
                                            //console.log( "go right" );
                                            count_clicks--;
                                            //console.log("count_clicks: " + count_clicks);
                                    }

                                    if ( (d === ">") 
                                        && (count_clicks > number_of_periods) 
                                        && (count_clicks > 0 ) ) {

                                            count_clicks = number_of_periods;
                                    }

                                    if ( (d === "<")
                                        && (count_clicks >= 0) 
                                        && (count_clicks <= number_of_periods) ) {
                                            //console.log( "go left" );
                                            count_clicks++;
                                            //console.log("count_clicks: " + count_clicks);
                                    }

                                    data_years = set_data_period( data_years_all, count_clicks, steps, max_number_of_bars);
                                    data_amount = set_data_period( data_amount_all, count_clicks, steps, max_number_of_bars); 

                                    chart.update_bars( data_amount, data_years );
                                    chart.update_labels( data_years );

                                    //console.log ("count_clicks" + count_clicks);
                                });
            }
    

            chart.render = function() {

                chart.bars();
                chart.create_bars();
                chart.labels();
                chart.create_labels();
                if ( (data_years_all.length - 1) >= max_number_of_bars + 1 ) {
                    chart.create_buttons();
                }
            } 

            chart.setup();
            chart.render();  

            return chart;                   

        }
        //call
        var bar_chart = create_bar_chart ( data_years, data_amount );
        //*************************BAR*CHART*ENDE***********************//
    }    

    //@param.errors = list with entries that were not able to parst into a json
    var display_error = function ( errors ) {
        //draw errors
        //console.dir ( errors ); 
    }

    return { make_it_all : make_it_all };
} ();





