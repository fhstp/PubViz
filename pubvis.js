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
        var chart_years = {}, chart_type = {};
        var selected_items = { years: [], types: [] };
        var add_selected_item, remove_selected_item, item_already_selected;
        var count_key_in_entryTags, get_years, get_types;
        var entryTypes_grouped_text = [ "Article", "Book", "Part of a Book", "Conference", "Thesis", "Report", "Misc" ];
        var selected_items_changed = false;
        var setup_layout;
        var max_width = $(document).width();;
        var width = 1024;
        var space_left = 0;

        //calculate how much space of the left is needed to setup in the middle
        if ( max_width > width){
            space_left = (max_width - width) /2
        }
        //console.log( "width: " + width );
        //console.log( "space_left: " + space_left );


        //*************************HELPER FUNCTIONS***********************//
            //builds the necessary svg and svg-groups
            setup_layout = function () { 
                var header;
                var overview;
                var background_overview;


                svg = d3.select( "#pubvis_container" )
                  .append( "svg" )
                  .attr({
                    id: "pubVis",
                    width: max_width, //full size of screen for the svg
                    height: 800
                  })
                  .attr("transform", "translate(" + space_left + "," + 30 + ")"); 
         

                d3.select( "#pubVis" )
                                .append( "g" )
                                .attr("transform", "translate(" + space_left + "," + 30 + ")");

                header = d3.select( "#pubVis" )
                                        .append( "g" )
                                        .attr({
                                            id: "header",
                                            width: width,
                                            height: 30
                                        })
                                        .attr("transform", "translate( 0, 0)")
                                    

                overview = d3.select( "#pubVis" )
                                        .append( "g" )
                                        .attr({
                                            id: "overview",
                                            width: width,
                                            height: 370 //includes space between header and overivew
                                        })
                                        .attr("transform", "translate( 0, 60)");

                background_overview = d3.select( "#overview" )
                                        .append ( "rect" )
                                        .attr ({
                                            x: 0,
                                            y: 0, 
                                            width: width,
                                            height: 370 ,
                                            fill: "#FFFFFF",
                                            opacity: 1,
                                            id: "background_overview"
                                        })
                                        .attr("transform", "translate( 0, 0)");
            }

            //adds an additional filter cirteria to the selected_items list
            //@params.years = number ( eg 2011 )
            //@params.types = Stirng ( eg "article" )
            //@params.authors && @params.words planed >> currently not implemented
            add_selected_item = function ( params ) {           
                //console.log( "add_selected_item aufgerufen" );
                var value = params.value;
                var key = params.key;

                if ( key === "years" ){
                    selected_items.years.push( value );
                    selected_items_changed = true;
                    last_selected_item = value;
                }

                if ( key === "types" ){
                    selected_items.types.push( value );
                    selected_items_changed = true;
                    last_selected_item = value;
                }

            }

            //search the array and retruns a boolean "true" if the item is contained
            //@params.array = Array
            //@params.key = String (eg "year")
            //@params.value = String (eg "2011")
            item_already_selected = function ( params ) {
                var array = params.array;
                var key = params.key;
                var value = params.value;
                var list = params.list;
                var item_contained = false;

                if ( key === undefined ) { 

                    for ( var i = 0; i < array[list].length; i++)  {

                        if ( array[list][ i ] === value ) {
                            item_contained = true;
                        }
                    }
                }

                if ( list === undefined ) {

                    for ( var z = 0; z < array.length; z++)  {

                        if ( array[ z ][key] === value ) {
                            item_contained = true;
                        }
                    }
                }
                return item_contained;
            }

            //removes the given value from selected_item.key list
            //@params.value = String (eg. "2011", "article")
            //@params.key = String ( "years" or "types")
            remove_selected_item = function ( params ) {
                var key = params.key;
                var value = params.value;

                for ( var i = 0; i < selected_items[key].length; i++)  {

                    if ( selected_items[key][ i ] === params.value ) {
                        selected_items_changed = true;
                        last_removed_item = params.value;
                        selected_items[key].splice(i, 1);
                        break;
                    }
                }
            }

            /*
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
            */

            //if the width of an text element is needed before the text element can be drawn (e.g because of the order of svg elements)
            //creates the elements based on the given data, returns the width and height
            //and removes the created element
            //@params.data = array
            //@params.group = the svg-group
            //@params.svg = svg
            get_width_of_text_element = function( params ) {
                    //console.log( "get_width_of_text_element aufgerufen" );
                    var svg = params.svg;
                    var group = params.group;
                    var data = params.data;
                    var element, element_width, element_height;

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
                        element_width = this.getBBox().width;
                        element_height = this.getBBox().height
                    } ) 

                    svg.selectAll( "text.element" ).remove();

                    return { width: element_width,
                             height: element_height };           
            }

            //slices a given dataset into the needed periods that are demanded by the left/right-buttons next to the year labels 
            //@params.incoming_dataset = list 
            //@params.count_clicks = number
            //@params.steps = number indicating how many years will be updated if button "left/right" is clicked
            //@params.max_number_of_bars = number of years to display in the bar chart (e.g 30 produce bars from 1984 - 2014)
            //@params.number_of_periods = number
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

            //returns the amount of the occurence of the given value in the given array  
            //@param.array = array
            //@param.value = string (example "year")
            count_key_in_entryTags = function (array, key) {
                var counter = 0;

                for ( var z = 0; z < array.length; z++ ) {
                        
                       if ( array[z] === key ) {
                        counter++
                    }
                }
                return counter;
            }

            //returns a list with counted types in the neended range for displaying as bars
            //@params.array = array (containing multiple entrytypes as strings)
            //range of the returned array: ["Article", "Book", "Part of a Book", "Conference", "Thesis", "Misc", "Report"] 
            var group_types = function ( params ) { 
                    var array = params.values;
                    var array_entries = params.entries;
                    var entryTypes_grouped = [ 0,0,0,0,0,0,0 ];
                    var entries_grouped = {  articles: [], book: [], part_book: [], conference: [], thesis: [], report: [], misc:[] }
                    
                    //console.log( "array_values" ); 
                    //console.dir(array);   
                    //console.log( "array_entries" ); 
                    //console.dir(array_entries);
                 
                  for ( var y = 0; y < array.length; y++ ){
                        //console.log( "array[y]" + array[y] );
                        //console.log( "array_entries[y]" );
                       // console.dir( array_entries[y] );

                        if (array[y] === "article" ) {
                            entryTypes_grouped[0] += 1;
                            entries_grouped.articles.push(array_entries[y]);
                        }

                        if (array[y] === "book" ) {
                            entryTypes_grouped[1] += 1;
                            entries_grouped.book.push(array_entries[y]);
                        }

                        if (array[y] === "booklet" ) {
                            entryTypes_grouped[1] += 1;
                            entries_grouped.book.push(array_entries[y]);
                        }

                        if (array[y] === "inbook" ) {
                            entryTypes_grouped[2] += 1;
                            entries_grouped.part_book.push(array_entries[y]);
                        }

                        if (array[y] === "incollection" ) {
                            entryTypes_grouped[2] += 1;
                            entries_grouped.part_book.push(array_entries[y]);
                        }

                        if (array[y] === "conference" ) {
                            entryTypes_grouped[3] += 1;
                            entries_grouped.conference.push(array_entries[y]);
                        }

                        if (array[y] === "inproceedings" ) {
                            entryTypes_grouped[3] += 1;
                            entries_grouped.conference.push(array_entries[y]);
                        }

                        if (array[y] === "proceedings" ) {
                            entryTypes_grouped[3] += 1;
                            entries_grouped.conference.push(array_entries[y]);
                        }

                        if (array[y] === "thesis" ) {
                            entryTypes_grouped[4] += 1;
                            entries_grouped.thesis.push(array_entries[y]);
                        }

                        if (array[y] === "mastersthesis" ) {
                            entryTypes_grouped[4] += 1;
                            entries_grouped.thesis.push(array_entries[y]);
                        }

                        if (array[y] === "phdthesis" ) {
                            entryTypes_grouped[4] += 1;
                            entries_grouped.thesis.push(array_entries[y]);
                        }

                        if (array[y] === "misc" ) {
                            entryTypes_grouped[6] += 1;
                            entries_grouped.misc.push(array_entries[y]);
                        }

                        if (array[y] === "manual" ) {
                            entryTypes_grouped[5] += 1;
                            entries_grouped.report.push(array_entries[y]);
                        }

                        if (array[y] === "techreport" ) {
                            entryTypes_grouped[5] += 1;
                            entries_grouped.report.push(array_entries[y]);
                        }
                    }
                    //console.log( "entries_grouped:"  )
                    //console.dir( entries_grouped );
                    return {count: entryTypes_grouped,
                            entries: entries_grouped};
            }


            //search for a specific key in an array (e.g. citationKey, entryType, entryTags)
            //@params.json = list (which contains the wanted key)
            //@params.key = String 
            //@params.value = String (eg "entryType")
            var collect_key_in_json = function ( params ) { 
                var json = [];
                var value = "";
                var result_values = [];
                var result_entries = [];

                json = params.json;
                key = params.key;
                value = params.value;               

                for ( var i = 0; i < json.length; i++ ) {

                    if ( value === "" ){

                        if ( json[i][key] ){

                            result_values.push( json[i][key] );
                            result_entries.push( json[i] ); 
                        }
                    }

                    if ( json[i][key] === value ){
                        
                        result_values.push( json[i][key] );
                        result_entries.push( json[i] );
                    }
                }

                return { values: result_values,
                         entries: result_entries };
            }

            //fecht all results for a specific key in the entryTags 
            //returns a list with values (eg values[..., 2010, 2012, 2013, ...])
            //and a list with the whole matching entries 
            //@param.json = a list object
            //@param.key = String (e.g "year", "keywords", ...) 
            //@param.value = String ( e.g. "2011", "Data Mining, Data Simplification, KDD, Visual analytics", ... )
            //if key is not defined (key = ""), the result will return all matchs for the key 
            var collect_key_in_entryTags = function ( params ) {
                //console.log( "collect_key_in_entryTags aufgerufen" );;
                var json = [];
                var value = "";
                var result_values = [];
                var result_entries = [];
                json = params.json;
                key = params.key;
                value = params.value; 

                for ( var i = 0; i < json.length; i++ ) {
                    if ( value === "" ){

                        if ( json[i]["entryTags"][key] ) {

                            result_values.push( json[i]["entryTags"][key] );
                            result_entries.push( json[i] );    
                        }
                    } 

                    if ( json[i]["entryTags"][key] === value) {

                        result_values.push( json[i]["entryTags"][key] );
                        result_entries.push( json[i] );    
                    }
                       
                }

                return { values: result_values,
                         entries: result_entries };
            } 

            //update the views of the years-chart and the type-chart according to the given entry list
            //@params.canged_data = a list with etries
            var update_views = function( params ){
                var dataset = params.changed_data;

                chart_years.highlight_subset( get_years({ 
                                                    json: dataset, 
                                                    years_to_display: chart_years.get_current_displayed_years()
                                                }).amount_list );

                chart_type.highlight_subset( get_types( dataset ).type_list ); 
            }

        //*************************SEARCH JSON******************************//
            

            //returns an object with a list with all years (key: time_list)
            //and a list with the total amounts of publications per year (key: amount_list)
            //@params.json = list with entries
            //@params.years_to_display = array containing all years as Strings that have to be displayed
            var get_years = function ( params ) {
                //console.log( "get_years aufgerufen" );
                var all_years_double = [];
                var amount_per_years = [];
                var all_years_entries = [];
                var oldest_year;
                var actual_year, time_span;
                var json = params.json;
                var all_years_distinct = params.years_to_display;
                var amount;

                //fetch all years from json as values
                all_years_double = collect_key_in_entryTags( { json: json, key: "year", value: "" } ).values;
                //fetch all years from json as entries
                all_years_entries = collect_key_in_entryTags( { json: json, key: "year", value: "" }).entries; 

                //sort array (as JS sorts all emlements as strings, this inner function is 
                //necessary to order intagers correct 
                //source: Douglas Crockford, JavaScript. The good Parts., p.80
                all_years_double.sort( function ( a, b ) {
                    return a - b;
                });

                if ( all_years_distinct === undefined ){ 
                    //get first element (= oldest year) and calculate time span for length of array           
                    all_years_distinct = [];
                    actual_year = new Date().getFullYear();
                    oldest_year = parseInt(all_years_double[0], 10);
                    time_span = actual_year - oldest_year;

                    //create a new list with time span
                    for ( var y = 0; y <= time_span; y++ ) {                    
                        all_years_distinct.push( oldest_year );
                        oldest_year++;
                    }
                } else {
                    time_span = all_years_distinct.length-1;
                }

                //iterate list with all_years_double and count their orccurance
                for ( var y = 0; y <= time_span; y++ ) {

                    amount = count_key_in_entryTags( all_years_double, all_years_distinct[y].toString() );
                    amount_per_years.push( amount );
                }

                return { time_list: all_years_distinct,
                         amount_list: amount_per_years,
                         entries_list: all_years_entries };
            }

            //returns an object with: 
            //a list with the total numbers of types, already grouped (key: type_list)
            //a list with all the entries grouped (key: types_entries)
            //a list which contains the groups as Strings (key: types_text)
            var get_types = function ( json ) {
                //console.log ( "get_types aufgerufen" );
                var all_entry_types = [];
                var entryTypes_grouped_data = [ 0,0,0,0,0,0,0 ];

                //fetch all types from the json into a list
                all_entry_types = collect_key_in_json({ json: json, key: "entryType", value: "" });

                //count and group the types
                entryTypes_grouped = group_types( {values: all_entry_types.values, entries: all_entry_types.entries } );
                entryTypes_grouped_count = entryTypes_grouped.count;
                entryTypes_grouped_entries = entryTypes_grouped.entries;

                return { type_list: entryTypes_grouped_count,
                         types_entries: entryTypes_grouped_entries,
                         types_text: entryTypes_grouped_text };
            }

            //iterate the given list containing entries and search for all filter cirteria
            //contained in the given list with filter criteria
            //@params.filter_criteria = Object with a list "years" and a list "types" (eg the "selected_items" list)
            var create_filtered_json = function( params ){
                console.log( "create_filtered_json aufgerufen" );
                var result = [];
                var filter_criteria = params.filter_criteria;
                var shorter_list, longer_list;

                for ( var i = 0; i < json.length; i++ ){

                    if ( (filter_criteria.years.length >= 1) && (filter_criteria.types.length === 0) ){
                    
                       for ( var y = 0; y < filter_criteria.years.length; y++ ){

                            if ( json[i].entryTags.year === filter_criteria.years[y] ) {

                               result.push(json[i]);

                            } else { 
                               // console.log("no match for: " + json[i].entryTags.year + " & " + filter_criteria.years[y] ); 
                            }
                        }
                    } 

                    if ( (filter_criteria.types.length >= 1) &&  (filter_criteria.years.length === 0) ){ 

                        for ( var z = 0; z < filter_criteria.types.length; z++ ){

                            if ( filter_criteria.types[z] === "Article" ) { 

                                if ( json[i].entryType === "article" ) {

                                    result.push(json[i]);

                                } 
                            }

                            if ( filter_criteria.types[z] === "Book" ) { 

                                if (   ( json[i].entryType === "book") 
                                    || ( json[i].entryType === "booklet" ) ) {

                                    result.push(json[i]);

                                } 
                            }

                            if ( filter_criteria.types[z] === "Part of a Book" ) { 

                                if (   ( json[i].entryType === "inbook") 
                                    || ( json[i].entryType === "incollection" ) ) {

                                    result.push(json[i]);

                                } 
                            }

                            if ( filter_criteria.types[z] === "Conference" ) { 

                                if (   ( json[i].entryType === "conference") 
                                    || ( json[i].entryType === "proceedings" )
                                    || ( json[i].entryType === "inproceedings" ) ) {

                                    result.push(json[i]);

                                } 
                            }

                            if ( filter_criteria.types[z] === "Thesis" ) { 

                                if (   ( json[i].entryType === "thesis") 
                                    || ( json[i].entryType === "mastersthesis" )
                                    || ( json[i].entryType === "phdthesis" ) ) {

                                    result.push(json[i]);

                                } 
                            }

                            if ( filter_criteria.types[z] === "Misc" ) { 

                                if ( ( json[i].entryType === "misc") ) {

                                    result.push(json[i]);

                                } 
                            }

                            if ( filter_criteria.types[z] === "Report" ) { 

                                if (   ( json[i].entryType === "manual") 
                                    || ( json[i].entryType === "techreport" ) ) {

                                    result.push(json[i]);

                                } 
                            }
                        }
                    } 

                    if ( (filter_criteria.types.length >= 1) &&  (filter_criteria.years.length >= 1) ){ 
                        

                        for ( var x = 0; x < filter_criteria.years.length; x++ ){
                            
                            for ( var v = 0; v < filter_criteria.types.length; v++ ){

                                if (   (json[i].entryTags.year === filter_criteria.years[x]) 
                                    && (filter_criteria.types[v] === "Article") ) { 

                                    if ( json[i].entryType === "article" ) {
                                            result.push(json[i]);
                                    } 
                                }

                                if (   (json[i].entryTags.year === filter_criteria.years[x]) 
                                    && (filter_criteria.types[v] === "Book") ) { 

                                    if (   ( json[i].entryType === "book") 
                                        || ( json[i].entryType === "booklet" ) ) {

                                        result.push(json[i]);
                                    } 
                                }

                                if (   (json[i].entryTags.year === filter_criteria.years[x]) 
                                    && (filter_criteria.types[v] === "Part of a book") ) { 

                                    if (   ( json[i].entryType === "inbook")  
                                        || ( json[i].entryType === "incollection" ) ) {

                                        result.push(json[i]);
                                            
                                    } 
                                }

                                if (   (json[i].entryTags.year === filter_criteria.years[x]) 
                                    && (filter_criteria.types[v] === "Conference") ) { 

                                    if (   ( json[i].entryType === "conference") 
                                        || ( json[i].entryType === "proceedings" )
                                        || ( json[i].entryType === "inproceedings" ) ) {

                                        result.push(json[i]);

                                    }
                                }

                                if (   (json[i].entryTags.year === filter_criteria.years[x]) 
                                    && (filter_criteria.types[v] === "Thesis") ) { 

                                    if (   ( json[i].entryType === "thesis") 
                                        || ( json[i].entryType === "mastersthesis" )
                                        || ( json[i].entryType === "phdthesis" ) ) {

                                        result.push(json[i]);

                                    } 
                                }    

                                if (   (json[i].entryTags.year === filter_criteria.years[x]) 
                                    && (filter_criteria.types[v] === "Misc") ) { 

                                    if ( json[i].entryType === "misc" ) {
                                            result.push(json[i]);
                                    } 
                                }

                                if (   (json[i].entryTags.year === filter_criteria.years[x]) 
                                    && (filter_criteria.types[v] === "Report") ) { 

                                    if (   ( json[i].entryType === "manual") 
                                        || ( json[i].entryType === "techreport" ) ) {

                                        result.push(json[i]);

                                    } 
                                }                            
                            }
                        }
                    }             
                }
                return { entries: result };
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
            real_life_data = get_years( {json: json} );
            //generated_data = generate_testData( 1959 );

            dataset_years = real_life_data.time_list;
            //dataset_years = generated_data.years;
            dataset_amount = real_life_data.amount_list;
            //dataset_amount = generated_data.amount;

            var real_life_data_types = get_types( json );
            dataset_types = real_life_data_types.type_list;
            dataset_types_text = real_life_data_types.types_text;
            //var testdata = generate_testData( 2008 );
            //dataset_types = testdata.amount;

        //***************************HEADER******************************//
            var HEADER = function(){

                var logo = d3.select( "#header" )
                                .append("g")
                                .attr( "id", "logo_div" );
                                //.attr("transform", "translate(" + 0 + "," + 0 + ")");
                                //new_bar_years.get_margins().left, new_bar_years.get_margins().top 

                var logo_div = logo.append( "rect" )
                                    .attr({
                                            x: 0, 
                                            y: 0, 
                                            width: 509,
                                            height: 30,
                                            fill: "#333333",
                                            id: "div_logo"
                                    })

                var text_bold = logo.append( "text" )
                                    .text( "PUB" )
                                    .attr({
                                            x: 35, 
                                            y: 24, 
                                            width: 509,
                                            height: 30,
                                            fill: "#333333",
                                            id: "text_bold",
                                            fill: "#f5f5f5",
                                            "text-anchor": "start",
                                            "font-weight": "bold"

                                    })
                                    .style("font-size", "22px")

                var text_regular = logo.append( "text" )
                                    .text( "VIZ" )
                                    .attr({
                                            x: 81, 
                                            y: 24, 
                                            width: 509,
                                            height: 30,
                                            fill: "#333333",
                                            id: "text_regular",
                                            fill: "#f5f5f5",
                                            "text-anchor": "start",
                                            "font-weight": "lighter"

                                    })
                                    .style("font-size", "22px")

                var search = d3.select( "#header" )
                                    .append("g")
                                    .attr( "id", "search_div" );

                var search_div = search.append( "rect" )
                                    .attr({
                                            x: 514, 
                                            y: 0, 
                                            width: 480,
                                            height: 30,
                                            fill: "white",
                                            id: "div_search"
                                    })

                var deco = d3.select( "#header" )
                                    .append("g")
                                    .attr( "id", "deco" );

                var deci_div = deco.append( "rect" )
                                    .attr({
                                            x: 999, 
                                            y: 0, 
                                            width: 25,
                                            height: 30,
                                            fill: "#333333",
                                            id: "div_search"
                                    })
            }

        //**************************OVERVIEW******************************//
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
                    var maximum_in_data = 0;
            
                    //*** Setup dimensons
                    margin = params.margin;
                    view_height = params.view_height;
                    view_width = params.view_width;
                    color_bar = params.color_bar; 
                    color_text = params.color_text;

                    //calculate absolut width and height for svg
                    svgH = view_height - margin.top - margin.bottom;
                    svgW =  view_width - margin.left - margin.right;
                    console.log( "svgH: " + svgH );

                    //public functions
                    //*** create svg group appens it to the g-overview
                    chart.set_svg_group = function ( params ) { 
                        var id = params.id;
                        var transform_xPos = params.transform_xPos;
                        var transform_yPos = params.transform_yPos;

                        svg = d3.select( "#overview" )
                                .append("g")
                                .attr( "id", id )
                                .attr("transform", "translate(" + transform_xPos + "," + transform_yPos + ")"); //move x,y of whole svg.chart
                    }
                    
                    chart.set_scale = function ( array, range_lin, range_ord, in_beteween_space ) {

                        linear_scale = d3.scale.linear()
                                            .domain ([ 0, d3.max( array ) ])  
                                            .range([ 0, range_lin ]); 

                        oridinal_scale = d3.scale.ordinal()
                                            .domain( d3.range( array.length ) ) //d3.range(x) returns an array with x elements sorted from 0-x
                                            .rangeRoundBands([ 0, range_ord ], in_beteween_space); //5% space between bars
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
                    var item_value, item_key;

                    var data_years_all = params.data_years_all; 
                    var data_amount_all = params.data_amount_all;  
                    var color_background_div = params.color_background_div;           
                    
                    var new_bar_years = CHART.create_bar_chart( params );
                    
                    new_bar_years.set_svg_group({ id:"chart", 
                                            transform_xPos: new_bar_years.get_margins().left, 
                                            transform_yPos: (new_bar_years.get_margins().top + 30) //because it don't includes the space between header and overview
                                          });            
                    var svg = new_bar_years.get_svg();
                    var svgH = new_bar_years.get_svgH();
                    var svgW = new_bar_years.get_svgW();  
                    var get_current_displayed_years;
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

                    var bar_highlight = svg.append( "g" );

                    //create group for labels years and move y to the bottom of the chart-svg
                    label_group = svg.append( "g" )
                                    .attr( "class", "label_group" ) 
                                    .attr("transform", "translate(0," + svgH + ")");

                    btn_group = svg.append( "g" )
                                    .attr("transform", "translate(-5," + svgH + ")");

                    new_bar_years.get_current_displayed_years = function() { return data_years };

                    var create_bars = function () { 
                            //console.log( "create_bars start" );  
                            
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
                                        
                                        item_value = data_years[ j ].toString();
                                        var item_type = "year";

                                        item_value = data_years[ j ].toString();
                                        item_key = "years";


                                        if ( item_already_selected( { array: selected_items, 
                                                                      list: item_key, 
                                                                      value: item_value} ) ) {

                                             remove_selected_item( {value: item_value, 
                                                                    key: item_key} ); 
                                        } else {
                                            
                                            add_selected_item( {value: item_value, 
                                                                key: item_key} );

                                        } 
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

                                        item_value = data_years[ j ].toString();
                                        item_key = "years";


                                        if ( item_already_selected( { array: selected_items, list: item_key, value: item_value} ) ) {
                                             console.log( "arleady sel" );
                                             remove_selected_item( { value: item_value, key: item_key} ); 
                                        } else {
                                            
                                            add_selected_item( { value: item_value, key: item_key} );

                                        }
                                    
                                    });                                  
                    }; 

                    var create_bars_subset = function () { 
                            //console.log( "create_bars_subset start" );  
                            
                            //fill group with bars
                            bar = bar_highlight.selectAll( "rect" )
                                    .data( data_amount )
                                    .enter ()
                                    .append ( "rect" )
                                    .attr ({
                                        x: function( d, i ){ return xScale( i ) },
                                        y: function( d ){ return svgH - yScale( d ) - label_space; }, //subtract space for labels to have space for labels ;o)
                                        width: xScale.rangeBand(),
                                        height: function( d ){ return yScale( d ); },
                                        opacity:0,
                                        //fill: new_bar_years.get_color_bar(),
                                        class: "bar",
                                        id: function( d,i ) { 
                                            return "bar_subset" + data_years[i]; }
                                    }) 
                                    .on( "click", function( d, j ) {

                                        item_value = data_years[ j ].toString();
                                        item_key = "years";


                                        if ( item_already_selected( {array: selected_items, list: item_key, value: item_value} ) ) {
                                             console.log( "arleady sel" );
                                             remove_selected_item( {value: item_value, key: item_key} ); 
                                        } else {
                                            
                                            add_selected_item( {value: item_value, key: item_key} );

                                        } 
                                    });          
                    };

                    new_bar_years.highlight_subset = function ( data_selected ) {
                        //console.log( "years: highlight_subset aufgerufen" );

                        bar = bar_highlight.selectAll( "rect" )
                                    .data( data_selected )
                                    .attr ({
                                        x: function( d, i ){ return xScale( i ) },
                                        y: function( d ){ return svgH - yScale( d ) - label_space; }, //subtract space for labels to have space for labels ;o)
                                        width: xScale.rangeBand(),
                                        height: function( d ){ return yScale( d ); },
                                        fill: selection_color,
                                        opacity:1,
                                        class: "bar",
                                        id: function( d,i ) { 
                                            return "bar_subset" + data_years[i]; }
                                    }) 
                                    .on( "click", function( d, j ) {

                                        item_value = data_years[ j ].toString();
                                        item_key = "years";


                                        if ( item_already_selected( {array: selected_items, list: item_key, value: item_value} ) ) {
                                             console.log( "arleady sel" );
                                             remove_selected_item( {value: item_value, key: item_key} ); 
                                        } else {
                                            
                                            add_selected_item( {value: item_value, key: item_key} );

                                        } 
                                    }); 
                    };

                    var create_background_divs = function () {
                        var background_div, label_width, label_height;

                        label_width = get_width_of_text_element({ svg: svg, group: label_group, data: data_years }).width;
                        label_height = get_width_of_text_element({ svg: svg, group: label_group, data: data_years }).height;

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
                                        .on( "click", function( d, j ) {

                                        item_value = data_years[ j ].toString();
                                        item_key = "years";

                                        //add selected item to selectionArray
                                        if ( item_already_selected( {array: selected_items, list: item_key, value: item_value} ) ) {
                                             
                                             console.log( "arleady sel" );
                                             remove_selected_item( {value: item_value, key: item_key} ); 
                                        } else {
                                            
                                            add_selected_item( {value: item_value, key: item_key} );

                                        }
                                        
                                     });  
                    }; 

                    var create_labels = function () {
                        //console.log( "create_labels aufgerufen" );
                        var labels;
                        //create labels for years
                        labels = label_group.selectAll( "text" )
                                    .data( data_years )
                                    .enter()
                                    .append( "text" )
                                    .text ( function( d ) { return d; } )
                                    .attr({
                                        x: function( d, i ){ return xScale( i ) + (xScale.rangeBand()/2) },
                                        y: 0, 
                                        fill: new_bar_years.get_color_text(),
                                        class: "labels",
                                        "text-anchor": "middle",
                                        id: function (d,i) { return "label_year_" + d; }
                                    })
                                    .on( "click", function( d, j ) {

                                        item_value = data_years[ j ].toString();
                                        item_key = "years";


                                        if ( item_already_selected( {array: selected_items, list: item_key, value: item_value} ) ) {
                                             console.log( "arleady sel" );
                                             
                                             d3.select(this).attr( "fill", new_bar_years.get_color_text() );
                                             remove_selected_item( {value: item_value, key: item_key} ); 

                                        } else {
                                            
                                            add_selected_item( {value: item_value, key: item_key} );
                                            d3.select(this).attr( "fill", selection_color );

                                        }
                                        
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

                                        item_value = data_years[ j ].toString();
                                        item_key = "years";


                                        if ( item_already_selected( {array: selected_items, list: item_key, value: item_value} ) ) {
                                             console.log( "arleady sel" );
                                             remove_selected_item( {value: item_value, key: item_key} ); 
                                        } else {
                                            
                                            add_selected_item( {value: item_value, key: item_key} );

                                        }

                                     });  
                    };

                    var create_buttons = function () {
                        var btn_left, btn_right, btn_group, buttons_text = [], background_div, buttons, buttons_width, buttons_height;

                        buttons_text = ["<", ">"];

                        btn_group = svg.append( "g" )
                                        .attr("transform", "translate(-5," + svgH + ")");
               
                        
                        buttons_width = get_width_of_text_element({ svg: svg, group: btn_group, data: buttons_text }).width;
                        buttons_height = get_width_of_text_element({ svg: svg, group: btn_group, data: buttons_text }).height;

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

                                                count_clicks++;
                                        }

                                        data_years = set_data_period( data_years_all, count_clicks, steps, max_number_of_bars, number_of_periods);
                                        data_amount = set_data_period( data_amount_all, count_clicks, steps, max_number_of_bars, number_of_periods); 

                                        update_bars( data_amount, data_years );
                                        update_labels( data_years );
                                    }); 
                    };

                    new_bar_years.render = function () {
                        create_bars();
                        create_bars_subset();
                        create_background_divs();
                        create_labels();
                        
                        if ( (data_years_all.length - 1) >= max_number_of_bars + 1 ) {
                            create_buttons();
                        }

                    }

                    return new_bar_years;
                };
                
                return { create_bar_years: create_bar_years };
            }();

            var BAR_TYPE = function () {

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

                    new_bar_types.set_svg_group({ id: "type_chart", 
                                            transform_xPos: ( width/2 ), 
                                            transform_yPos: (157 + 30) //because it don't includes the space between header and overview
                                          });
                    svg = new_bar_types.get_svg();
                    svgH = new_bar_types.get_svgH();
                    svgW = new_bar_types.get_svgW();

                    //new_bar_years.set_scale( data_amount, svgH, svgW, 0.2 ); 
                    new_bar_types.set_scale( all_entry_types, (svgW/2), svgH, 0 ); 
                    xScale = new_bar_types.get_linear_scale();
                    yScale = new_bar_types.get_oridinal_scale();

                    //create svg-group
                    bar_group = svg.append( "g" );
                    var bar_highlight = svg.append( "g" );

                    //create group for labels years and move y to the bottom of the chart-svg
                    label_group = svg.append( "g" );

                    data_label_group = svg.append( "g" );

                    var data_lbl_subset_group = svg.append( "g" );
                    
                    line_group = svg.append("g");

                    label_height = get_width_of_text_element({ svg: svg, group: label_group, data: entry_types_text }).height;
                    

                    var create_bars_total = function () {  
                        //console.log("create_bars_total in BAR_TYP aufgerufen");
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

                                        item_value = entry_types_text[ i ].toString();
                                        item_key = "types";


                                        if ( item_already_selected( {array: selected_items, list: item_key, value: item_value} ) ) {
                                            
                                            console.log( "arleady sel" );
                                            remove_selected_item( {value: item_value, key: item_key} ); 
                                        
                                        } else {
                                            
                                            add_selected_item( {value: item_value, key: item_key} );
                                        }

                                    });                                     
                    };

                    var create_bars_subset = function () { 
                        //console.log( "create_bars_subset aufgerufen" );

                        bar = bar_highlight.selectAll( "rect" )
                                    .data( all_entry_types )
                                    .enter ()
                                    .append ( "rect" )
                                    .attr ({
                                        x: 0,
                                        y: function( d, i ){ return yScale( i ) },
                                        width: function( d ){ return xScale( d ); },
                                        height: yScale.rangeBand(),
                                        fill: new_bar_types.get_color_bar(),
                                        class: "bar_type_highlight",
                                        id: function( d,i ) { 
                                            return "bar_type_highlight" + i; }
                                    })
                                    .on( "click", function( d, i ) {

                                        item_value = entry_types_text[ i ].toString();
                                        item_key = "types";


                                        if ( item_already_selected( { array: selected_items, list: item_key, value: item_value} ) ) {
                                            
                                            console.log( "arleady sel" );
                                            remove_selected_item( {value: item_value, key: item_key} ); 
                                        
                                        } else {
                                            
                                            add_selected_item( {value: item_value, key: item_key} );
                                        }
                                    })                                   
                    };

                    new_bar_types.highlight_subset = function ( data_selected ) { 
                        //console.log( "types: highlight_subset aufgerufen" );

                        bar = bar_highlight.selectAll( "rect" )
                                    .data( data_selected )
                                    .attr ({
                                        x: 0,
                                        y: function( d, i ){ return yScale( i ) },
                                        width: function( d ){ return xScale( d ); },
                                        height: yScale.rangeBand(),
                                        fill: selection_color,
                                        class: "bar_type_highlight",
                                        id: function( d,i ) { 
                                            return "bar_type_highlight" + i; }
                                    }) 
                                    .on( "click", function( d, i ) {

                                        item_value = entry_types_text[ i ].toString();
                                        item_key = "types";


                                        if ( item_already_selected( {array: selected_items, list: item_key, value: item_value} ) ) {
                                            
                                            console.log( "arleady sel" );
                                            remove_selected_item( {value: item_value, key: item_key} ); 
                                        
                                        } else {
                                            
                                            add_selected_item( {value: item_value, key: item_key} );
                                        }
                                    }) 

                                    highlight_data_lbl_subset( data_selected );
                    }; 

                    var create_labels = function () {
                        var labels, data_lbl;

                        labels = label_group.selectAll( "text" )
                                    .data( entry_types_text )
                                    .enter()
                                    .append( "text" )
                                    .text ( function( d ) { return d; } )
                                    .attr({
                                        y: function( d, i ){ return yScale( i ) + label_height +(label_height/2)}, 
                                        x: distance_label_to_bars, 
                                        fill: new_bar_types.get_color_text(),
                                        class: "label_type",
                                        "text-anchor": "end",
                                        id: function ( d, i ) { return "lbl_type_" + i; }
                                    })
                                    .on( "click", function( d, i ) {

                                        item_value = entry_types_text[ i ].toString();
                                        item_key = "types";


                                        if ( item_already_selected( {array: selected_items, list: item_key, value: item_value} ) ) {
                                            
                                            console.log( "arleady sel" );
                                            remove_selected_item( {value: item_value, key: item_key} ); 
                                        
                                        } else {
                                            
                                            add_selected_item( {value: item_value, key: item_key} );
                                        }
                                     }); 

                                     
                        data_lbl = data_label_group.selectAll( "text" )
                                        .data( all_entry_types )
                                        .enter()
                                        .append( "text" )
                                        .text ( function( d ) { return d; } )
                                        .attr({
                                            y: function( d, i ){ return yScale( i ) + label_height +(label_height/2) }, 
                                            x: (svgW/2+label_space-6), 
                                            fill: new_bar_types.get_color_text(),
                                            class: "lbl_text_data",
                                            "text-anchor": "middle"
                                        })
                    };

                    var create_data_lbl_subset = function(){
                        var data_lbl_subset = data_lbl_subset_group.selectAll( "text" )
                                        .data( all_entry_types )
                                        .enter()
                                        .append( "text" )
                                        .text ( function( d ) { return d; } )
                                        .attr({
                                            y: function( d, i ){ return yScale( i ) + label_height +(label_height/2)}, 
                                            x: (svgW/2 + (label_space/2)), 
                                            fill: "white",
                                            class: "lbl_text_data",
                                            "text-anchor": "middle"
                                        })
                    }

                    var highlight_data_lbl_subset = function( data_selected ){
                        data_lbl_subset = data_lbl_subset_group.selectAll( "text" )
                                        .data( data_selected )
                                        .text ( function( d ) { return d; } )
                                        .attr({
                                            y: function( d, i ){ return yScale( i ) + label_height + (label_height/2)}, 
                                            x: (svgW/2 + (label_space/2)), 
                                            fill: new_bar_types.get_color_text(),
                                            "font-weight": "bold",
                                            class: "lbl_text_data_subset",
                                            "text-anchor": "middle"
                                        })
                    }

                    var create_lines = function() {
                        var lines;

                        lines = line_group.selectAll( "line" )
                                    .data( all_entry_types )
                                    .enter()
                                    .append( "line" )
                                    .attr({
                                        x1: 0,
                                        y1: function( d, i ){ return yScale( i ) + yScale.rangeBand() },
                                        x2: svgW/2 + label_space,
                                        y2: function( d, i ){ return yScale( i ) + yScale.rangeBand()},
                                        "shape-rendering": "crispEdges",
                                        "stroke": "black",
                                        "stroke-width": 0.3
                                    })
                    };


                    new_bar_types.render = function () {
                            create_bars_total();
                            create_bars_subset();
                            create_data_lbl_subset(); 
                            create_labels();
                            create_lines();
                    }
                    return new_bar_types;
                };


                return { create_bar_type: create_bar_type };
            }();

            var AMOUNT = function ( params ) {
                console.log( "amount aufgerufen" );
                var amount;
                var total_nb = params.total;
                var selected_nb = params.selected;
                var margin = params.margin;
                var color_text = params.color_text;
                var text_size = params.text_size;
                var svg;
                var format_nb_total = zeroFilled = ('000' + total_nb).substr(-3);

                var amount = d3.select( "#overview" )
                                .append("g")
                                .attr( "id", "amount" )
                                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                var total_amount = amount.append( "text" )
                                    .text ( format_nb_total )
                                    .attr({
                                            x: 210,
                                            y: 125, 
                                            fill: color_text,
                                            "text-anchor": "start",
                                            id: "lbl_total_amount"
                                    })
                                    .style("font-size", text_size)

                var selected_amount = amount.append( "text" )
                                    .text ( selected_nb )
                                    .attr({
                                            x: 80,
                                            y: 125,  
                                            fill: color_text,
                                            "text-anchor": "start",
                                            "font-weight": "bold",
                                            id: "lbl_selected_amount"
                                    })
                                    .style("font-size", text_size)

                var update_selected_amount = function( params ) { 
                    var new_selected_nb = params.selected_new;
                    var format_nb = zeroFilled = ('000' + new_selected_nb).substr(-3);

                    d3.select("#lbl_selected_amount").text(format_nb);

                }
             
                return { update_selected_amount: update_selected_amount };               
            }

           

        //*****************************CALL**************************//
            setup_layout();

            var show_header = HEADER();

            chart_years = BAR_YEARS.create_bar_years({
                data_years_all: dataset_years, 
                data_amount_all: dataset_amount, 
                color_bar: "#D9D9D9", 
                color_text: "#f5f5f5", 
                color_background_div: "#333333", 
                view_height: 157.5, 
                margin: {top: 35, right: 25, bottom: 22.5, left: 25}, 
                view_width: 1024,
            });

            chart_years.render();

            chart_type = BAR_TYPE.create_bar_type({
                all_entry_types: dataset_types, 
                entry_types_text: dataset_types_text, 
                color_bar: "#D9D9D9", 
                color_text: "#333333", 
                view_height: 162.5, 
                margin: {top: 0, right: 200, bottom: 0, left: 0}, 
                view_width: 1024,
            });

            chart_type.render();



            var show_amount = AMOUNT ({ margin: {top: 157, right: 200, bottom: 0, left: 25}, 
                                       color_text: "#333333",
                                       text_size: "70px",
                                       total: json.length,
                                       selected: "000"
                                    });

            

            $( "svg" ).click(function(event) {

                var filtered_json = create_filtered_json({ filter_criteria: selected_items }).entries;

                update_views({ changed_data: filtered_json });

                show_amount.update_selected_amount({ selected_new: filtered_json.length });


            });   
    } 


    //@param.errors = list with entries that were not able to parst into a json
    var display_error = function ( errors ) {
        //draw errors
        //console.dir ( errors ); 
        //console.log("errors.length: " + Object.keys(errors).length)
        //alert( JSON.stringify(errors) );        
    }

    return { make_it_all : make_it_all };
} ();





