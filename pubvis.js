PUBVIS = function () {
    var make_it_all = function (params) {
        filename = params.filename;
        target = params.target;
        selection_color = params.color;

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
        var dataArr, bigJson, errors, entry, entryAt, jsonFormat;

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

    //draw data
    //@param.json = bib entries in json format
    var display_data = function ( json ) {
        //console.dir( json );
        var real_life_data, generated_data, dataset_years, dataset_amount, dataset_types, dataset_types_text;
        var change_color_of_item, get_width_of_text_element, set_data_period;
        var bar_chart, bar_type;
        
        


        //*************************SEARCH JSON******************************//
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

            //returns an object with a list with all years (key: time_list)
            //and a list with the total amounts of publications per year (key: amount_list)
            var get_years = function () {
                var all_years_distinct = [];
                var all_years_double = [];
                var amount_per_years = [];
                var oldest_year;
                var actual_year, time_span;
                
                //console.log( "get_years start" );

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

            var get_types = function ( json ) {

                var all_entry_types = [];
                var entryTypes_grouped_text = [ "Article", "Book", "Part of a Book", "Conference", "Thesis", "Misc", "Report" ];
                var possible_types = ["article", "book", "booklet", "inbook", "incollection", "conference", "inproceedings", "proceeding", "mastersthesis", "thesis", "phdthesis", "misc", "manual", "techreport"];
                var entryTypes_grouped_data = [ 0,0,0,0,0,0,0 ];
                var all_types_counted = [];

                //save all years into a list
                for ( var i = 0; i < json.length; i++ ) {

                    if ( json[i].entryType ){
                        //console.log( "entry_type:" + json[i].entryType  );
                        all_entry_types.push( json[i].entryType );
                    }
                    //console.dir( all_entry_types );
                }

                //group types
                for ( var y = 0; y < all_entry_types.length; y++ ){
                    //console.log( "all_entry_types[y]" + all_entry_types[y] );
                    var count = 0;
                    count++;

                    if (all_entry_types[y] === "article" ) {
                        entryTypes_grouped_data[0] += 1;
                    }

                    if (all_entry_types[y] === "book" ) {
                        entryTypes_grouped_data[1] += 1;
                    }

                    if (all_entry_types[y] === "booklet" ) {
                        entryTypes_grouped_data[1] += 1;
                    }

                    if (all_entry_types[y] === "inbook" ) {
                        entryTypes_grouped_data[2] += 1;
                    }

                    if (all_entry_types[y] === "incollection" ) {
                        entryTypes_grouped_data[2] += 1;
                    }

                    if (all_entry_types[y] === "conference" ) {
                        entryTypes_grouped_data[3] += 1;
                    }

                    if (all_entry_types[y] === "inproceedings" ) {
                        entryTypes_grouped_data[3] += 1;
                    }

                    if (all_entry_types[y] === "proceedings" ) {
                        entryTypes_grouped_data[3] += 1;
                    }

                    if (all_entry_types[y] === "thesis" ) {
                        entryTypes_grouped_data[4] += 1;
                    }

                    if (all_entry_types[y] === "mastersthesis" ) {
                        entryTypes_grouped_data[4] += 1;
                    }

                    if (all_entry_types[y] === "phdthesis" ) {
                        entryTypes_grouped_data[4] += 1;
                    }

                    if (all_entry_types[y] === "misc" ) {
                        entryTypes_grouped_data[5] += 1;
                    }

                    if (all_entry_types[y] === "manual" ) {
                        entryTypes_grouped_data[6] += 1;
                    }

                    if (all_entry_types[y] === "techreport" ) {
                        entryTypes_grouped_data[6] += 1;
                    }
                }
                //console.log( "count: " + count );
                //console.log( "entryTypes_grouped_data: " );
                //console.dir( entryTypes_grouped_data );

                //console.dir( all_types_counted );
                return { type_list: entryTypes_grouped_data,
                         types_text: entryTypes_grouped_text };
            }


        //*************************TEST DATA******************************//
            //generates an array with testdata, returns a list with all years counted 
            //from startYear and a list in the same length with randmom amount
            //@params.startYear = number (e.g. 1980)
            var generate_testData = function ( startYear ) {
                var testArr_years = [], testArr_amount = [], year, amount;          
                year = startYear;
                
                for (var i = startYear; i <= 2014; i++ ) {
                    amount = Math.floor((Math.random() * 40) + 1); //random # between 1 and 10
                    testArr_amount.push( amount );
                    testArr_years.push( year );
                    year++;
                    
                }
                return { years: testArr_years,
                         amount: testArr_amount };
            }

            //*** datasets
            real_life_data = get_years( json );
            generated_data = generate_testData( 1959 );

            dataset_years = real_life_data.time_list;
            //dataset_years = generated_data.years;
            dataset_amount = real_life_data.amount_list;
            //dataset_amount = generated_data.amount;
            
            var real_life_data_types = get_types( json );
            dataset_types = real_life_data_types.type_list;
            dataset_types_text = real_life_data_types.types_text;
            //var testdata = generate_testData( 2008 );
            //dataset_types = testdata.amount;
            //console.dir( dataset_types );


        //*************************HELPER FUNCTIONS***********************//
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

            //if the width of an text element is needed before the text element can be drawn (e.g because of the order of svg elements)
            //creates the elements based on the given data, access the width 
            //and removes the created element
            //@params.data a list
            get_width_of_text_element = function( svg, group, data ) {
                    var element, element_width, element_height;

                    //console.log( "get_width_of_text_element aufgerufen" );

                    element = group.selectAll( "text" )
                                .data( data )
                                .enter()
                                .append( "text" )
                                .text ( function( d ) { return d; } )
                                .attr({
                                    x: 0,
                                    y: 0,
                                    class: "element"
                                })

                    element.each( function() {
                        //console.log(this.getBBox().width);
                        //console.log(this.getBBox().height);
                        element_width = this.getBBox().width;
                        element_height = this.getBBox().height
                    } ) 

                    svg.selectAll( "text.element" ).remove();
                    //console.log( "removed" );

                    return { width: element_width,
                             height: element_height };           
            }

            //slices a given dataset into the needed periods that are demanded by the left/right-buttons next to the year labels 
            //@params.incoming_dataset = list 
            //@params.count_clicks = number
            //@params.steps = number indicating how many years will be updated if button "left/right" is clicked
            //@params.max_number_of_bars = number of years to display in the bar chart (e.g 30 produce bars from 1984 - 2014)
            set_data_period = function ( incoming_dataset, count_clicks , steps, max_number_of_bars, number_of_periods ) {
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


        //*************************BAR*CHART*START***********************//
        var CHART = function () {
            //@param.view_height = number, gives the height of the availabel space; margins will be subtracted
            //@param.list_of_margins = eg. margin = {top: 20, right: 30, bottom: 20, left: 10}
            var create_bar_chart = function ( params ){ 
                //console.log( "start create_bar_cart" );
                //*** declare vars
                var chart = {};
                var view_width, view_height = 0;
                var svg, svgH, svgW;
                var oridinal_scale, linear_scale;
                var margin;
                var number_of_periods, steps, max_number_of_bars;
                var color_bar, color_text;
        
                //*** Setup dimensons
                margin = params.margin;
                view_height = params.view_height;
                //view_width = $(document).width(); //returns width of HTML document | $(window).width() returns width of browser viewport
                view_width = params.view_width;
                color_bar = params.color_bar; 
                color_text = params.color_text;

                //calculate absolut width and height for svg
                svgH = view_height - margin.top - margin.bottom;
                svgW =  view_width - margin.left - margin.right;
                //console.log( "margins:" + margin.top + margin.right + margin.bottom + margin.left );

                //public functions
                //*** create svg element appens it to the param.target (=#pubvis_container)
                chart.set_svg = function ( classname, transform_xPos, transform_yPos ) { 
                    svg = d3.select( target )
                            .append( "svg" )
                            .attr({
                                class: classname,
                                width: view_width,
                                height: view_height
                            })
                            .append("g")
                            .attr("transform", "translate(" + transform_xPos + "," + transform_yPos + ")"); //move x,y of whole svg.chart
                        
                    //console.log( "svg ende" );
                }
                
                
                chart.set_scale = function ( array, range_lin, range_ord, in_beteween_space ) {
                    //var range_lin, range_ord;
                    //console.log( "set_scale start" );

                    //*** Setting up a linear yScale for the height of the bars   
                    linear_scale = d3.scale.linear()
                                //.domain ([ d3.min( array ), d3.max( array ) ]) 
                                .domain ([ 0, d3.max( array ) ]) 
                                .range([ 0, range_lin ]); 
                    //console.log( "Linear_scale min: " +  d3.min( array ) + " max: " + d3.max( array ) + " range_lin: " + range_lin);
                    
                    oridinal_scale = d3.scale.ordinal()
                                        .domain( d3.range( array.length ) ) //d3.range(x) returns an array with x elements sorted from 0-x
                                        .rangeRoundBands([ 0, range_ord ], in_beteween_space); //5% space between bars
                    //console.log( "ordinal_scale domain#: " +  array.length + " range_ord: " + range_ord + " in_beteween_space: " + in_beteween_space);
                }

                chart.get_svg = function() { return svg };
                chart.get_svgH = function() { return svgH };
                chart.get_svgW = function() { return svgW };
                chart.get_oridinal_scale = function() { return oridinal_scale };
                chart.get_linear_scale = function() { return linear_scale };
                chart.get_margins = function() { return margin };
                chart.get_color_bar = function( ) { return color_bar };
                chart.get_color_text = function( ) { return color_text };

                chart.create_bars = function() { throw new Error ("NOT IMPLEMENTED") };
                chart.update_bars = function() { throw new Error ("NOT IMPLEMENTED") };
                chart.labels = function() { throw new Error ("NOT IMPLEMENTED") }; 

                return chart;
            }
            return { create_bar_chart: create_bar_chart };
        }();

        var BAR_YEARS = function () {
            //console.log( "bar_years start" );

            //@param.data_year = Array 
            //@param.data_amount = Array
            var create_bar_years = function ( params ) {            
                var create_bars, update_bars, create_labels, update_labels;
                var rect, bar_group, bar, clicked_id_bar, clicked_id_text, create_bars, update_bars;            
                var btn_group, label_group;
                var data_years, data_amount;
                var xScale, yScale;

                var data_years_all = params.data_years_all; 
                var data_amount_all = params.data_amount_all;  
                var color_background_div = params.color_background_div;           
                
                var new_bar_years = CHART.create_bar_chart( params );
                
                new_bar_years.set_svg( "chart", new_bar_years.get_margins().left, new_bar_years.get_margins().top );            
                var svg = new_bar_years.get_svg();
                var svgH = new_bar_years.get_svgH();
                var svgW = new_bar_years.get_svgW();  
                var count_clicks = 0;             
                
                var label_space = 19;
                var max_number_of_bars = 30;
                var steps = 5;
                var overlap = 0.2 //percent how much the background div should extend the lable-width
                  

                //check if number of years contained in the data, extend the number of planed bars that will be shown
                if ( data_years_all.length > max_number_of_bars ) { 
                        
                    //claculate the number of needed periods that have to be slidable
                    number_of_periods = Math.floor( ( (data_years_all.length - 1) - max_number_of_bars ) / steps ); 

                    data_amount = set_data_period( data_amount_all, 0, steps, max_number_of_bars, number_of_periods);
                    data_years = set_data_period( data_years_all, 0, steps, max_number_of_bars, number_of_periods);

                } else {

                    data_amount = data_amount_all;
                    data_years = data_years_all;
                        
                }

                new_bar_years.set_scale( data_amount, svgH, svgW, 0.2 ); 
                xScale = new_bar_years.get_oridinal_scale();
                yScale = new_bar_years.get_linear_scale();
                

                //create group for bars
                bar_group = svg.append( "g" );

                //create group for labels years and move y to the bottom of the chart-svg
                label_group = svg.append( "g" )
                                .attr( "class", "label_group" ) 
                                .attr("transform", "translate(0," + svgH + ")");

                btn_group = svg.append( "g" )
                                .attr("transform", "translate(-5," + svgH + ")");

                var create_bars = function () { 
                        //console.log( "create_bars start" );  
                        //console.dir( data_amount );
                        
                        //fill group with bars
                        bar = bar_group.selectAll( "rect" )
                                .data( data_amount )
                                .enter ()
                                .append ( "rect" )
                                .attr ({
                                    x: function( d, i ){ return xScale( i ) },
                                    y: function( d ){ return svgH - yScale( d ) - label_space; }, //subtract space for labels to have space for labels ;o)
                                    width: xScale.rangeBand(),
                                    height: function( d ){ return yScale( d ); },
                                    fill: new_bar_years.get_color_bar(),
                                    class: "bar",
                                    id: function( d,i ) { 
                                        return "bar_" + data_years[i]; }
                                }) 
                                .on( "click", function( d, j ) {
                                    //bar is fist clicked >> bar and label_year turn into yellow
                                    //bar is second clicked >> bar and label_year turn into orignal color

                                    clicked_id_text = "#label_year_" + data_years[ j ];
                                    clicked_id_bar = "#" + d3.select(this).attr( "id" );

                                    change_color_of_item( clicked_id_bar, new_bar_years.get_color_bar(), selection_color );
                                    change_color_of_item( clicked_id_text, new_bar_years.get_color_text(), selection_color );                      
                                });          
                }; 

                var update_bars = function ( dataset_amount, dataset_years ){
                        //console.log( "update_bars aufgerufen" );
                        
                        //fill group with bars
                        bar = bar_group.selectAll( "rect" )
                                .data( dataset_amount )
                                .attr ({
                                    y: function( d ){ return svgH - yScale( d ) - label_space; }, //subtract space for labels to have space for labels ;o)
                                    x: function( d, i ){ return xScale( i ) },
                                    width: xScale.rangeBand(),
                                    height: function( d ){ return yScale( d ); },
                                    fill: new_bar_years.get_color_bar(),
                                    class: "bar",
                                    id: function( d,i ) { 
                                        return "bar_" + dataset_years[i]; }
                                }) 
                                .on( "click", function( d, j ) {
                                    //bar is fist clicked >> bar and label_year turn into yellow
                                    //bar is second clicked >> bar and label_year turn into orignal color

                                    clicked_id_text = "#label_year_" + dataset_years[ j ];
                                    clicked_id_bar = "#" + d3.select(this).attr( "id" );

                                    change_color_of_item( clicked_id_bar, new_bar_years.get_color_bar(), selection_color );
                                    change_color_of_item( clicked_id_text,new_bar_years.get_color_text(), selection_color );                      
                                }); 
                    //console.log( "update_bars ende" );                                 
                }; 

                var create_background_divs = function () {
                    var background_div, label_width, label_height;

                    label_width = get_width_of_text_element( svg, label_group, data_years ).width;
                    label_height = get_width_of_text_element( svg, label_group, data_years ).height;

                    background_div = label_group.selectAll( "rect" )
                                    .data( data_years )
                                    .enter()
                                    .append( "rect" )
                                    .text ( function( d ) { return d; } )
                                    .attr({
                                        x: function( d, i ){ return xScale( i ) - ( (label_width * overlap / 2) ) },
                                        y: 0 - label_height,  
                                        id: function( d, i ){ return d },
                                        width: xScale.rangeBand() + ( label_width * overlap ), //label_width + ( label_width * overlap ),
                                        height: label_height + ( label_height * overlap ),
                                        fill: color_background_div
                                    })
                }; 

                var create_labels = function () {
                    var labels;
                    //create labels for years
                    labels = label_group.selectAll( "text" )
                                .data( data_years )
                                .enter()
                                .append( "text" )
                                .text ( function( d ) { return d; } )
                                .attr({
                                    x: function( d, i ){ return xScale( i ) + (xScale.rangeBand()/2) },
                                    y: 0, //cause of grouping and transform of the labels_group
                                    fill: new_bar_years.get_color_text(),
                                    class: "labels",
                                    "text-anchor": "middle",
                                    id: function (d,i) { return "label_year_" + d; }
                                })
                                .on( "click", function( d, j ) {
                                    //label_year is fist clicked >> bar and label_year turn into yellow
                                    //label_year is second clicked >> bar and label_year turn into orignal color

                                    clicked_id_bar = "#bar_" + data_years[ j ];
                                    clicked_id_text = "#" + d3.select(this).attr( "id" );

                                    change_color_of_item( clicked_id_bar, new_bar_years.get_color_bar(), selection_color );
                                    change_color_of_item( clicked_id_text, new_bar_years.get_color_text(), selection_color );
                                
                                 });    
                };

                var update_labels = function ( dataset_years ) {
                    //console.log( "update_labels aufgerufen" );

                    //create labels for years
                    labels = label_group.selectAll( "text" )
                                .data( dataset_years )
                                .text ( function( d ) { return d; } )
                                .attr({
                                    x: function( d, i ){ return xScale( i ) + (xScale.rangeBand()/2) },
                                    y: 0, //cause of grouping and transform of the labels_group
                                    fill: new_bar_years.get_color_text(),
                                    class: "labels",
                                    "text-anchor": "middle",
                                    id: function (d,i) { return "label_year_" + d; }
                                })
                                .on( "click", function( d, j ) {
                                    //label_year is fist clicked >> bar and label_year turn into yellow
                                    //label_year is second clicked >> bar and label_year turn into orignal color

                                    clicked_id_bar = "#bar_" + dataset_years[ j ];
                                    clicked_id_text = "#" + d3.select(this).attr( "id" );

                                    change_color_of_item( clicked_id_bar, new_bar_years.get_color_bar(), selection_color );
                                    change_color_of_item( clicked_id_text, new_bar_years.get_color_text(), selection_color );
                                
                                 });  
                    //console.log( "update_labels ende" );  
                };

                var create_buttons = function () {
                    var btn_left, btn_right, btn_group, buttons_text = [], background_div, buttons, buttons_width, buttons_height;

                    buttons_text = ["<", ">"];

                    btn_group = svg.append( "g" )
                                    .attr("transform", "translate(-5," + svgH + ")");
           
                    
                    buttons_width = get_width_of_text_element( svg, btn_group, buttons_text ).width;
                    buttons_height = get_width_of_text_element( svg, btn_group, buttons_text ).height;

                    background_div = btn_group.selectAll( "rect" )
                                    .data( buttons_text )
                                    .enter()
                                    .append( "rect" )
                                    .text ( function( d ) { return d; } )
                                    .attr({
                                        x: function( d, i ){ return i * svgW }, //later to include the width of the button image
                                        y: 0 - buttons_height,
                                        id: function( d, i ){ return d },
                                        width: buttons_width,
                                        height: buttons_height + ( buttons_height * overlap ),
                                        fill: color_background_div
                                    })
                                    //console.log( "buttons_height: " + buttons_height );


                    buttons = btn_group.selectAll( "text" )
                                .data( buttons_text )
                                .enter()
                                .append( "text" )
                                .text ( function( d ) { return d; } )
                                .attr({
                                    x: function( d, i ){ return i * svgW }, //later to include the width of the button image
                                    y: 0,
                                    id: function( d, i ){ return d },
                                    fill: new_bar_years.get_color_text()
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

                                    data_years = set_data_period( data_years_all, count_clicks, steps, max_number_of_bars, number_of_periods);
                                    data_amount = set_data_period( data_amount_all, count_clicks, steps, max_number_of_bars, number_of_periods); 

                                    update_bars( data_amount, data_years );
                                    update_labels( data_years );
                                });
                    //console.log( "create_buttons ende" ); 
                };

                new_bar_years.render = function () {
                    create_bars();
                    create_background_divs();
                    create_labels();
                    
                    if ( (data_years_all.length - 1) >= max_number_of_bars + 1 ) {
                        create_buttons();
                    }

                }
                //console.log( "ende create_bar_years" );

                return new_bar_years;
            };
            
            return { create_bar_years: create_bar_years };
        }();

        var BAR_TYPE = function () {
            //console.log ( "dataset_types: " );
            //console.dir ( dataset_types );

            var create_bar_type = function( params ){
                //based on CHART
                //with new code for bars and labels
                var xScale, yScale, svg, svgH, svgW;
                var all_entry_types = [];
                var entry_types_text = [];
                var new_bar_types;
                var bar, bar_group, label_group, data_label_group, line_group;
                var distance_label_to_bars = -10;
                var label_height, label_space; 

                label_space = 50;
                new_bar_types = CHART.create_bar_chart( params );
                all_entry_types = params.all_entry_types;
                entry_types_text = params.entry_types_text;

                new_bar_types.set_svg( "type_chart", ($(document).width()/2 ), 0 );
                svg = new_bar_types.get_svg();
                svgH = new_bar_types.get_svgH();
                svgW = new_bar_types.get_svgW();

                //new_bar_years.set_scale( data_amount, svgH, svgW, 0.2 ); 
                new_bar_types.set_scale( all_entry_types, (svgW/2), svgH, 0 ); 
                xScale = new_bar_types.get_linear_scale();
                yScale = new_bar_types.get_oridinal_scale();

                //create svg-group
                bar_group = svg.append( "g" );

                //create group for labels years and move y to the bottom of the chart-svg
                label_group = svg.append( "g" );

                data_label_group = svg.append( "g" );
                
                line_group = svg.append("g");

                label_height = get_width_of_text_element( svg, label_group, entry_types_text ).height;
                

                //functions to display data
               var create_bars = function () {  
                    bar = bar_group.selectAll( "rect" )
                                .data( all_entry_types )
                                .enter ()
                                .append ( "rect" )
                                .attr ({
                                    x: 0,
                                    y: function( d, i ){ return yScale( i ) },
                                    width: function( d ){ return xScale( d ); },
                                    height: yScale.rangeBand(),
                                    fill: new_bar_types.get_color_bar(),
                                    class: "bar_type",
                                    id: function( d,i ) { 
                                        return "bar_type_" + i; }
                                })
                                .on( "click", function( d, i ) {
                                    //bar is fist clicked >> bar and label_year turn into yellow
                                    //bar is second clicked >> bar and label_year turn into orignal color

                                    clicked_id_text = "#lbl_type_" + i;
                                    clicked_id_bar = "#" + d3.select(this).attr( "id" );

                                    change_color_of_item( clicked_id_bar, new_bar_types.get_color_bar(), selection_color );
                                    change_color_of_item( clicked_id_text, new_bar_types.get_color_text(), selection_color );                      
                                });                                     
                }; 


                var create_labels = function () {

                    var labels, data_lbl;
                    //create labels for years
                    labels = label_group.selectAll( "text" )
                                .data( entry_types_text )
                                .enter()
                                .append( "text" )
                                .text ( function( d ) { return d; } )
                                .attr({
                                    y: function( d, i ){ return yScale( i ) + label_height }, 
                                    x: distance_label_to_bars, 
                                    fill: new_bar_types.get_color_text(),
                                    class: "label_type",
                                    "text-anchor": "end",
                                    id: function ( d, i ) { return "lbl_type_" + i; }
                                })
                                .on( "click", function( d, i ) {
                                    //label_year is fist clicked >> bar and label_year turn into yellow
                                    //label_year is second clicked >> bar and label_year turn into orignal color

                                    clicked_id_bar = "#bar_type_" + i;
                                    clicked_id_text = "#" + d3.select(this).attr( "id" );

                                    change_color_of_item( clicked_id_bar, new_bar_types.get_color_bar(), selection_color );
                                    change_color_of_item( clicked_id_text, new_bar_types.get_color_text(), selection_color );
                                
                                 }); 

                                 
                    data_lbl = data_label_group.selectAll( "text" )
                                    .data( all_entry_types )
                                    .enter()
                                    .append( "text" )
                                    .text ( function( d ) { return d; } )
                                    .attr({
                                        y: function( d, i ){ return yScale( i ) + label_height }, 
                                        x: (svgW/2+label_space), 
                                        fill: new_bar_types.get_color_text(),
                                        class: "lbl_text_data",
                                        "text-anchor": "end"
                                    })
                };

                var create_lines = function() {
                    var lines;

                    lines = line_group.selectAll( "line" )
                                .data( all_entry_types )
                                .enter()
                                .append( "line" )
                                .attr({
                                    x1: 0,//function( d, i ){ return yScale( i ) + (label_height -3) }, //-3 so that the labels are in the middle of the bars
                                    y1: function( d, i ){ return yScale( i ) + yScale.rangeBand() },//function( d, i ){ return yScale( i ) + (label_height -3) }, 
                                    x2: svgW/2 + label_space,
                                    y2: function( d, i ){ return yScale( i ) + yScale.rangeBand()},
                                    "shape-rendering": "crispEdges",
                                    "stroke": "black",
                                    "stroke-width": 0.3
                                })
                };


                new_bar_types.render = function () {
                        create_bars();
                        create_labels();
                        create_lines();
                }
                return new_bar_types;
            };

            return { create_bar_type: create_bar_type };
        }();
        
        //call

        bar_chart = BAR_YEARS.create_bar_years({
            data_years_all: dataset_years, 
            data_amount_all: dataset_amount, 
            color_bar: "#d9d9d9", 
            color_text: "white", 
            color_background_div: "#333333", 
            view_height: 120, 
            margin: {top: 20, right: 30, bottom: 20, left: 10}, 
            view_width: $(document).width() //returns width of HTML document | $(window).width() returns width of browser viewport 
        }).render();

        bar_type = BAR_TYPE.create_bar_type({
            all_entry_types: dataset_types, 
            entry_types_text: dataset_types_text, 
            color_bar: "#d9d9d9", color_text: "black", 
            view_height: 170, 
            margin: {top: 0, right: 200, bottom: 0, left: 0}, 
            view_width: $(document).width()
        }).render();
        //console.dir(bar_chart);
        //*************************BAR*CHART*ENDE***********************//
    }    

    //@param.errors = list with entries that were not able to parst into a json
    var display_error = function ( errors ) {
        //draw errors
        //console.dir ( errors ); 
    }

    return { make_it_all : make_it_all };
} ();





