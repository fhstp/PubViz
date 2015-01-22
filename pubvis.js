PUBVIS = function () {
    var make_it_all = function (params) {
        filename = params.filename;
        target = params.target;
        selection_color = params.color;

        //inform the user about loading
        $( target ).append( "<div id='loading'> LOADING... </div>" );

        //access the bibfile, convert and display 
        fetch_bibfile ( filename );        
    };

    //access the bib.file, start the conversion into a json 
    //and start the representation of the data
    //@param.filename = String (e.g "file.bib")
    var fetch_bibfile = function ( filename ) {
        var result; 

        $.get( filename, function( data ) {

            result = bib2json( data );

            //display_error( result.errors ).error_text ;
            //console.log( "error_text: " + display_error( result.errors ).error_text );
        
            display_data( result.json, display_error( result.errors ).error_text ) ;

        });    
    }

    //return oneBigJson and errors in an object
    //@param.bibfile = bib data
    var bib2json = function ( bibfile ) {
        var dataArr, bigJson, errors, entry, entryAt, jsonFormat, str;

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

        //fetch all authors and remove all comma and replace 'and' with a comma
        //needed format to show the authors in the list
        for ( var i = 0; i < bigJson.length; i++ ){

            if ( bigJson[i].entryTags.author !== undefined ) { 

                str = bigJson[i].entryTags.author;
                //console.log( "str: " + str );

                //all_authors_str = all_authors.toString();
                str = str.replace (/,/g, "");

                //split string at every 'and'
                str = str.replace (/ and /g, ", ");

                bigJson[i].list_authors = str;
                //console.dir( all_authors_split );

            }

        }

        //console.log ( "bigJson[0].list_authors: "  + bigJson[0].list_authors);

        //console.dir( bigJson );
        //console.log("ende Bib2Json");
        return { json: bigJson,
                 errors: errors }; 
    }

    //draw data
    //@param.json = bib entries in json format
    var display_data = function ( json, error_text ) {
        //console.dir( json );
        var real_life_data, generated_data, dataset_years, dataset_amount, dataset_types, dataset_types_text;
        var filtered_json;
        var change_color_of_item, get_width_of_text_element, set_data_period;
        var show_header, show_amount, show_btn_clearAll;
        var chart_years = {}, chart_type = {};
        var keywords = [], wordcloud = {}, list = {}, authors = [];
        var selected_items = { years: [], types: [], keywords: [], authors: [] };
        var add_selected_item, remove_selected_item, item_already_selected;
        var count_key_in_entryTags, get_years, get_types;
        var entryTypes_grouped_text = [ "Article", "Book", "Part of a Book", "Conference", "Thesis", "Report", "Misc" ];
        var selected_items_changed = false, last_selected_view, last_selected_item;
        var selected_authors;
        var current_timeline, timeline_changed = false;
        var setup_layout;
        var window_width;
        var width;
        var space_left = 0;
        var button_width = 75; //clearAll button
        var button_height = 30; //clearAll button
        var empty = [];
        var words_displayed = [], authors_displayed = []; //contain words/authors that are really displayed
        var clearAll_pushed = false;
        var text_color_for_types;
        var space_between_view = 30;
        var svg;
        var highligth_color = selection_color;


        //*************************HELPER FUNCTIONS***********************//
            
            //function in progress...
            function update_window(){
                console.log( "updateWindow aufgerufen" );

               // $( "svg" ).remove();

                window_width = window.innerWidth || document.documentElement.clientWidth || document.getElementsByTagName('body')[0].clientWidth;
                //y = w.innerHeight|| e.clientHeight|| g.clientHeight;

                //svg.attr("width", x).attr("height", y);
                calculate_width();

                

               // setup_layout();

               // display_all_views();
            }
            //window.onresize = update_window;


            //claculates the width
            var calculate_width = function(){
                //console.log( "calculate aufgerufen" );
                var max_width = 1024;

                //window_width = $(document).width();
                //window_width = window.innerWidth || document.documentElement.clientWidth || document.getElementsByTagName('body')[0].clientWidth;
                window_width = $( window ).width();

                if ( window_width > max_width){
                    space_left = (window_width - max_width) /2;
                    width = max_width;
                } else { 
                    width = window_width;
                    space_left = 0;
                }
                //console.log( "window_width: " + window_width );
                //console.log( "space_left: " + space_left );
            }

            //builds the necessary svg and svg-groups
            setup_layout = function () { 
                //console.log( "setup aufgerufen" );
                var header, clearAll;
                var overview;
                var clouds;
                var list;
                var background_overview;
                var background_cloud_words;
                var background_cloud_authors;
                var background_list;

                
                //determine the height of the views
                var svg_margin_top = 10;
                var header_height = 30;
                var overview_height = 370;
                var clouds_height = 370; 
                //var button_width = 75; //clearAll button
                //var button_height = 30; //clearAll button

                //calculation of the position for the views
               // var clarAll_yPos = header_height; //svg_margin_top + header_height;
                var overview_yPos = header_height + space_between_view;
                var clouds_yPos = overview_yPos + overview_height + space_between_view;
                var svg_height = svg_margin_top +  header_height + overview_height + clouds_height + (space_between_view * 3);

                $( target ).css("marginLeft", "auto");
                $( target ).css("margin-right", "auto");
                //create the svg:
                svg = d3.select( "#pubvis_container" )
                          .append( "svg" )
                          //.attr("viewBox", "0 0 1024 890")
                          //.attr("id", "pubVis")
                          .attr({
                            id: "pubVis",
                            width: window_width, //full size of screen for the svg, otherwise some parts maybe hidden
                            height: svg_height//880
                          })
                          .attr("transform", "translate(" + space_left + "," + svg_margin_top + ")"); 
         

                //create all groups for the views:
                header = d3.select( "#pubVis" )
                                        .append( "g" )
                                        .attr({
                                            id: "header",
                                            width: width,
                                            height: header_height
                                        })
                                        //.attr("transform", "translate( 0, 0)")
                                        .attr("transform", "translate( 0, 0)")

                clearAll = d3.select( "#pubVis" )
                                        .append( "g" )
                                        .attr({
                                            id: "clearAll",
                                            width: button_width,
                                            height: button_height
                                        })
                                        //btn middle: .attr("transform", "translate(" + (width/2 - (75/2)) + "," + 25 + ")");
                                        //.attr("transform", "translate(" + (width - button_width) + "," + clarAll_yPos + ")");
                                        .attr("transform", "translate(" + (width - button_width) + ", 0 )");
                                        

                overview = d3.select( "#pubVis" )
                                        .append( "g" )
                                        .attr({
                                            id: "overview",
                                            width: width,
                                            height: overview_height //includes space between header and overivew
                                        })
                                        //.attr("transform", "translate( 0, 60)");
                                        .attr("transform", "translate( 0," + overview_yPos + ")");


                background_overview = d3.select( "#overview" )
                                        .append ( "rect" )
                                        .attr ({
                                            x: 0,
                                            y: 0, 
                                            width: width,
                                            height: overview_height ,
                                            fill: "#FFFFFF",
                                            opacity: 1,
                                            id: "background_overview"
                                        })
                                        .attr("transform", "translate( 0, 0)");

                

                clouds = d3.select( "#pubVis" )
                                        .append( "g" )
                                        .attr({
                                            id: "clouds",
                                            width: width,
                                            height: clouds_height //includes space between overivew and cloud
                                        })
                                        //.attr("transform", "translate( 0, 460)");
                                        .attr("transform", "translate( 0," + clouds_yPos + ")");

                background_clouds_words = d3.select( "#clouds" )
                                        .append ( "rect" )
                                        .attr ({
                                            x: 0,
                                            y: 0, 
                                            width: (width/2-15), //15 because of the space between the two clouds
                                            height: 360 ,
                                            fill: "#FFFFFF",
                                            opacity: 1,
                                            id: "background_clouds_words"
                                        })
                                        //.attr("transform", "translate( 0, 0)");
                                        .attr("transform", "translate(" + (width/2 + (space_between_view/2)) + "," + 0 + ")");

                background_clouds_authors = d3.select( "#clouds" )
                                        .append ( "rect" )
                                        .attr ({
                                            x: 0,
                                            y: 0, 
                                            width: (width/2-15), //15 because of the space between the two clouds
                                            height: 360 ,
                                            fill: "#FFFFFF",
                                            opacity: 1,
                                            id: "background_clouds_authors"
                                        })
                                        //.attr("transform", "translate( 0, 0)");
                                        .attr("transform", "translate(" + 0 + "," + 0 + ")");
            }

            //set the display of the element with the given id to the given bool
            //true = element will be shown
            //false = element will be hidden
            var show = function( id, value ) {

                document.getElementById(id).style.display = value ? 'block' : 'none';
            }

            //check after the intervall is past if the body was loaded.
            //if the body is defined the interval will be cleared and 
            //the onReady function will be executed
            //source: http://stackoverflow.com/questions/25253391/javascript-loading-screen-while-page-loads
            var onReady = function( callback ) {
                var intervalID = window.setInterval(checkReady, 1000);

                function checkReady() {
                    if (document.getElementsByTagName('body')[0] !== undefined) {
                        window.clearInterval(intervalID);
                        callback.call(this);
                    }
                }
            }

            //call all views to display them
            var display_all_views = function(){
                //console.log( " display views" );
                //***display header
                show_header = HEADER();
                show_btn_clearAll = CLEAR_ALL();

                //***display bar-chart with years
                chart_years = BAR_YEARS.create_bar_years({
                    data_years_all: dataset_years, 
                    data_amount_all: dataset_amount, 
                    color_bar: "#D9D9D9", 
                    color_text: "#f5f5f5", 
                    color_background_div: "#333333", 
                    view_height: 157.5, 
                    margin: {top: 35, right: 25, bottom: 22.5, left: 25}, 
                    //view_width: 1024,
                    view_width: width
                });
                chart_years.render();

                //***display bar-cahrt with types
                chart_type = BAR_TYPE.create_bar_type({
                    all_entry_types: dataset_types, 
                    entry_types_text: dataset_types_text, 
                    color_bar: "#D9D9D9", 
                    color_text: "#333333", 
                    view_height: 162.5, 
                    margin: {top: 0, right: 200, bottom: 0, left: 0}, 
                    //view_width: 1024,
                    view_width: width
                });
                chart_type.render();

                //***display total number of entries and number of selected entries
                show_amount = AMOUNT ({ margin: {top: 157, right: 200, bottom: 0, left: 25}, 
                                           color_text: "#333333",
                                           text_size: "70px",
                                           total: json.length,
                                           selected: "0",
                                           width: width/2
                                        });
                //***display tagCloud
                keywords = get_words(json).words;
                //console.log( "keywords" );
                //console.dir( keywords );
                keywords = limit_words({ words: keywords, optimum_size: 40, min: 1 });
                wordCloud = CLOUD({ type:"keywords", 
                                    words: keywords, 
                                    xPos: (width/2 + 15), 
                                    yPos: 0,
                                    size: [ (width/2 - 15), 340 ] });

                //***display AuthorsCloud
                authors = get_authors( json ).authors;
                //authors = limit_words({ words: authors, optimum_size: 40, min: 1 });
                //console.dir( authors );
                wordCloud = CLOUD({ type:"authors", 
                                    words: authors, 
                                    xPos: 0, 
                                    yPos: 0,
                                    size: [ (width/2 - 15), 340 ] });

                //***display list
                list = LIST({ data:json, update:false });
            }

            //adds an additional filter cirteria to the selected_items list
            //@params.years = number ( eg 2011 )
            //@params.types = Stirng ( eg "article" )
            //@params.authors && @params.words planed >> currently not implemented
            add_selected_item = function ( params ) {           
                //console.log( "call: add_selected_item" );
                var value = params.value;
                var key = params.key;

                if ( key === "years" ){
                    selected_items.years.push( value );
                    selected_items_changed = true;
                    last_selected_item = value;
                    last_selected_view = key;
                }

                if ( key === "types" ){
                    selected_items.types.push( value );
                    selected_items_changed = true;
                    last_selected_item = value;
                    last_selected_view = key;
                }

                if ( key === "keywords" ){
                    selected_items.keywords.push( value );
                    selected_items_changed = true;
                    last_selected_item = value;
                    last_selected_view = key;
                    //console.log("keywords added");

                }

                if ( key === "authors" ){
                    selected_items.authors.push( value );
                    selected_items_changed = true;
                    last_selected_item = value;
                    last_selected_view = key;
                    //console.log("authors added");

                }

            }

            //search the array and retruns a boolean "true" if the item is contained
            //@params.array = Array
            //@params.key = String (eg "year")
            //@params.value = String (eg "2011")
            item_already_selected = function ( params ) {
                //console.log( "call: item_already_selected" );
                var array = params.array;
                var key = params.key;
                var value = params.value;
                var list = params.list;
                var item_contained = false;

                //console.log( "key: " + key + " value: " + value + " list: " + list );

                if ( key === undefined && list !== undefined ) { 

                    for ( var i = 0; i < array[list].length; i++)  {

                        if ( array[list][ i ] === value ) {
                            item_contained = true;
                        }
                    }
                }

                if ( list === undefined && key !== undefined ) {

                    for ( var z = 0; z < array.length; z++)  {

                        //console.log( "array[ z ][key]: " + array[ z ][key] );

                        if ( array[ z ][key] === value ) {
                            item_contained = true;
                        }
                    }
                }

                if ( key === undefined && list === undefined ) {

                    for ( var y = 0; y < array.length; y++)  {
                        
                        if ( array[ y ].toString() === value ) {
                            item_contained = true;
                        }
                    }
                }

                //console.log( "item contained?: " + item_contained );
                return item_contained;
            }

            //removes the given value from selected_item.key list
            //@params.value = String (eg. "2011", "article")
            //@params.key = String ( "years" or "types")
            remove_selected_item = function ( params ) {
                //console.log( "call remove_selected_item" );
                var key = params.key;
                var value = params.value;

                //console.log( "key: " + key + " value: " + value );

                for ( var i = 0; i < selected_items[key].length; i++)  {

                    if ( selected_items[key][ i ] === params.value ) {
                        selected_items_changed = true;
                        last_removed_item = params.value;
                        selected_items[key].splice(i, 1);
                        //console.log( "item removed: " + selected_items[key][ i ] );
                        break;
                    }
                }
                last_selected_item = value;
            }

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
                        element_height = this.getBBox().height;
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

            //keyword 'new_id' returns an id without "#"; 
            //keyword 'exist_id': returns an id with "#"
            //@params.group = String (eg keywords, authors) will be part of the id name
            //@params.text = String (eg "Visual Analytics") will be part of the id name, non word characters will be removed
            //@params.element = sort of element ( "text", "div") will be part of the id name
            //exampel for an id that will be returned: txt_keywords_Visual_Analytics
            var generate_words_id = function ( params ){
                //console.log( "CALL: generate_words_id" );
                var text = params.text;
                var group = params.group;
                var element = params.element;
                var new_id, exist_id;

                //console.log( "text: " + text + " group: " + group + " element: " + element );

                new_id = "";
                exist_id = "#";


                text = text.replace (/ /g, "_");
                //text =text.replace(/[^\w\s]/gi, ''); //remove all special chars and whitespaces
                text =text.replace(/[^\w\s\-]/gi, ''); //remove all special chars and whitespaces except the -

                if ( text.length > 29 ){ 

                    //console.log( "bin zu lang: " + text );
                    short_text = text.substring( 0, 29 );

                } 

                if ( element === "text" ) {
                    new_id += "txt_" + group + "_";
                    exist_id += "txt_" + group + "_"; 
                }                
                
                if ( element === "div" ){
                    new_id += "div_" + group + "_";
                    exist_id += "div_" + group + "_";
                }

                if ( element === undefined ){
                    console.log( "WARNING: sort of element is not defined!" );
                }

                new_id += text;
                exist_id += text;

                //console.log( "new_id: " + new_id ); 
                //console.log( "exist_id: " + exist_id ); 

                return { new_id: new_id,
                         exist_id: exist_id };
            }

            //change color of the given words into the selection_color
            //@params.data = word Array containing min a "text" element ( data.text ) 
            var highlight_words = function( data ){
                //console.log( "highlight words" );
                var item_value, id_txt_label, id_background_div;

               // console.log( " amount words to be highlight: " + data.length );
               // console.dir( data );
                //console.dir( words_displayed );
                remove_highlight_selection_items_keywords();

                for( var i = 0; i < data.length; i++ ){

                    item_value = data[i].text;
                    id_txt_label = generate_words_id({ text: item_value, group: "keywords", element: "text" }).exist_id;
                    id_background_div = generate_words_id({ text: item_value, group: "keywords", element: "div" }).exist_id;

                    if ( item_already_selected( {array:words_displayed, key:"id", value:id_txt_label } ) ) {

                        d3.select(id_txt_label).attr('fill', selection_color );
                        //d3.select(id_txt_label).attr('fill', highligth_color );
                        //d3.select(id_txt_label).style("font-weight", "900");

                    } else {
                        //console.log( "item actually NOT displayed: " + item_value );
                    }
                }
            }

            var highlight_authors = function( data ){
                //console.log( "highlight authors" );
                var item_value, id_txt_label, id_background_div;

                //console.log( " amount words to be highlight: " + data.length );
                //console.dir( data );
                remove_highlight_selection_items_authors();

                for( var i = 0; i < data.length; i++ ){

                    item_value = data[i].text;
                    id_txt_label = generate_words_id({ text: item_value, group: "authors", element: "text" }).exist_id;
                    //console.log( "id_txt_label: " + id_txt_label );
                    
                    id_background_div = generate_words_id({ text: item_value, group: "authors", element: "div" }).exist_id;
                    //console.log( "id_background_div: " + id_background_div );

                    //d3.select(id_txt_label).style("font-weight", "900");
                    d3.select(id_txt_label).attr('fill', selection_color );

                }
            }

            //update the views of the years-chart, type-chart, wordCloud and according to the given entry list
            //@params.canged_data = a list with etries
            var update_views = function( params ){
                //console.log( "call: update_views" );
                var dataset = params.changed_data;
                var selected_words;
                //console.log( "dataset: " );
                //console.dir( dataset );

                chart_years.highlight_subset( get_years({ 
                                                    json: dataset, 
                                                    years_to_display: chart_years.get_current_displayed_years()
                                                }).amount_list );

                chart_type.highlight_subset( get_types( dataset ).type_list ); 

                show_amount.update_selected_amount({ selected_new: dataset.length });

                //check if clear all was hit, consequently the json data have to be displayed by the list
                if (   (clearAll_pushed === true )
                    || (dataset.length === 0) 
                    && ( selected_items.years.length === 0 )
                    && ( selected_items.types.length === 0 )
                    && ( selected_items.keywords.length === 0 )
                    && ( selected_items.authors.length === 0 ) ){ 

                    list = LIST({ data: json, update:true });
                }else{

                    list = LIST({ data:dataset, update:true });
                }

                selected_words = get_words(dataset).words;

                highlight_words( selected_words );  

                selected_authors = get_authors( dataset ).authors;
                //console.log( "selected_authors.length: " + selected_authors.length );
                //console.dir( selected_authors );
                highlight_authors ( selected_authors );  
                //console.log( "authors_displayed" );
                //console.dir( authors_displayed );                
            }

            //change the visibility of the tooltips of the given year 
            //according to the given boolean
            var tooltip_change_visibility = function ( hoovered_year, bool ){
                //console.log( "tooltip_change_visibility aufgerufen" );
               // var ids = [];
                var tooltip_id_normal = "#tooltip_normal_" + hoovered_year;
                var tooltip_id_subset = "#tooltip_subset_" + hoovered_year;
                //ids.push( tooltip_id_normal, tooltip_id_subset );

                if ( bool === true ){
                    d3.select( tooltip_id_normal ).attr( "opacity", "1" );
                    d3.select( tooltip_id_subset ).attr( "opacity", "1" );
                } else {
                    d3.select( tooltip_id_normal ).attr( "opacity", "0" );
                    d3.select( tooltip_id_subset ).attr( "opacity", "0" );
                }
                //console.log( "opacity normal: " + d3.select( tooltip_id_normal ).attr( "opacity" ) );
                //console.log( "opacity subset: " + d3.select( tooltip_id_subset ).attr( "opacity" ) );                
            }

            var get_tooltip_ids = function( year ){
                var ids = [];

                var tooltip_id_normal = "#tooltip_normal_" + year;
                var tooltip_id_subset = "#tooltip_subset_" + year;
                ids.push( tooltip_id_normal, tooltip_id_subset );

                return { //id_normal: tooltip_id_normal,
                         //id_subset: tooltip_id_subset 
                         ids: ids};
            }

            //clear all highlighted authors
            var remove_highlight_selection_items_authors = function(){
                //console.log( "CALL: remove_highlight_selection_items_authors" );
                var item_value, id_txt_label, id_background_div;

                //console.log("authors.length: " + authors.length);
                //console.dir(authors);

                for ( var i = 0; i < authors.length; i++ ){ 

                    item_value = authors[i].text;
                    
                    id_txt_label = generate_words_id({ text: item_value, group: "authors", element: "text" }).exist_id;
                    //console.log( "id_txt_label: " + id_txt_label );

                    id_background_div = generate_words_id({ text: item_value, group: "authors", element: "div" }).exist_id;
                    //console.log( "id_background_div: " + id_background_div );

                    d3.select(id_background_div).attr('opacity', "0");
                    d3.select(id_txt_label).attr('fill', "#33333");
                    d3.select(id_txt_label).style('font-weight', "300");

                }
            }

            //clear all highlighted keywords
            var remove_highlight_selection_items_keywords = function(){
                //console.log( "CALL: remove_highlight_selection_items_keywords" );
                var item_value, id_txt_label, id_background_div;

                //console.log("keywords.length: " + keywords.length);
                //console.dir(keywords);

                for ( var i = 0; i < keywords.length; i++ ){ 

                    item_value = keywords[i].text;
                    
                    id_txt_label = generate_words_id({ text: item_value, group: "keywords", element: "text" }).exist_id;
                    //console.log( "id_txt_label: " + id_txt_label );

                    //id_background_div = generate_words_id({ text: item_value, group: "keywords", element: "div" }).exist_id;
                    //console.log( "id_background_div: " + id_background_div );

                    //d3.select(id_background_div).attr('opacity', "0");
                    //d3.select(id_background_div).attr('stroke', "");
                    d3.select(id_txt_label).attr('fill', "#33333");
                    d3.select(id_txt_label).style('font-weight', "300");

                }
            }

            //clear all highlighted labels in the timeline
            var remove_highlight_selection_items_years = function(){
                //console.log( "CALL: remove_highlight_selection_items_years" );
                var id_txt_label, id_background_div;

                //console.dir(current_timeline);
                //console.log("current_timeline.length: " + current_timeline.length);

                for ( var ct = 0; ct < current_timeline.length; ct++ ){ 

                    id_txt_label = "#label_year_" + current_timeline[ct];
                    //console.log( "id_txt_label: " + id_txt_label );
                    id_bar = "#bar_subset" + current_timeline[ct];

                    //id_background_div = "#background_div_" + current_timeline[ct];
                    //console.log( "id_background_div: " + id_background_div );

                    //d3.select(id_background_div).attr('fill', "#333333");
                    //d3.select(id_background_div).attr('stroke', "");
                    
                    d3.select(id_txt_label).attr('fill', "#f5f5f5");
                    d3.select(id_txt_label).style('font-weight', 300);

                    //change the bar
                    //d3.select(id_bar).attr('fill', '#D9D9D9');

                }
            }

            //clear all highlighted labels in the types-chart
            var remove_highlight_selection_items_types = function () {
                //console.log( "CALL: remove_highlight_selection_items_types" );
                var id_txt_label, id_background_div;
                
                for ( var i = 0; i < entryTypes_grouped_text.length; i++ ){ 

                    id_txt_label = generate_words_id({ text: entryTypes_grouped_text[i], group: "type", element: "text" }).exist_id;

                    //hide div
                    //d3.select(id_background_div).attr('opacity', "0");

                    //d3.select(id_txt_label).attr('font-weight', "regular");
                    d3.select(id_txt_label).attr('fill', text_color_for_types);

                }
            }

            //lookup the selected_itmes list and highlight, 
            //or rather remove the highlight of selected/decelected items
            var highlight_selection_items = function(){
                //console.log( "CALL: highlight_selection_items " );
                var item_value = last_selected_item;
                var item_key;
                var id_txt_label, id_background_div;

                //highlight selection items of all year elements
                if (   (selected_items.years.length > 0)
                    && (selected_items.types.length >= 0)
                    && (selected_items.keywords.length >= 0)
                    && (selected_items.authors.length >= 0)  ) { 

                    item_key = "years";
                    //console.log( "clicked year will be highlighted" );

                    remove_highlight_selection_items_years();

                    for ( var i = 0; i < selected_items.years.length; i++ ){ 

                        item_value = selected_items.years[i];

                        id_txt_label = "#label_year_" + item_value;
                        //console.log( "id_txt_label: " + id_txt_label );
                        var id_bar = "#bar_subset" + item_value;
                        //console.log( "id_bar: " + id_bar );

                        //id_background_div = "#background_div_" + item_value;
                        //console.log( "id_background_div: " + id_background_div );

                        if( item_already_selected( {array: current_timeline, value: item_value } ) ){ 

                            //highlight div
                            //d3.select(id_background_div).attr('fill', selection_color);
                            //d3.select(id_background_div).attr('stroke', "#333333");
                            //d3.select(id_txt_label).attr('fill', "#333333");
                            
                            //change text
                            d3.select(id_txt_label).attr('fill', selection_color);
                            d3.select(id_txt_label).style('font-weight', "900");

                            //change the bar
                            //d3.select(id_bar).attr('fill', selection_color);

                        } else {
                            //console.log( "item NOT contained" );
                        }
                    }
                } else {
                    remove_highlight_selection_items_years();
                }

                //highlight selection items of all types elements
                if (   (selected_items.types.length > 0)  
                    && (selected_items.years.length >= 0) 
                    && (selected_items.keywords.length >= 0)
                    && (selected_items.authors.length >= 0) ) { 

                    item_key = "types";

                    remove_highlight_selection_items_types();
                    
                    for ( var x = 0; x < selected_items.types.length; x++ ){ 

                        item_value = selected_items.types[x];

                        id_txt_label = generate_words_id({ text: item_value, group: "type", element: "text" }).exist_id;
                        id_bar = generate_words_id({ text: item_value, group: "type", element: "div" }).exist_id;

                        //console.log( "id_txt_label: " + id_txt_label );

                        //show yellow div 
                        //d3.select(id_background_div).attr('opacity', '1');
                        
                        //change the color and the weight of the clicked items    
                        d3.select(id_txt_label).attr('fill', selection_color);
                        d3.select(id_txt_label).style('font-weight', "900");

                        //change the bar
                        //d3.select(id_bar).attr('fill', selection_color);
                    }
                } else {
                    remove_highlight_selection_items_types();
                }

                //highlight selection items of all keywords elements
                if (   (selected_items.keywords.length > 0) 
                    && (selected_items.types.length >= 0) 
                    && (selected_items.years.length >= 0)
                    && (selected_items.authors.length >= 0)  ){ 

                    item_key = "keywords";
                    
                    //remove_highlight_selection_items_keywords();

                    for ( var k = 0; k < selected_items.keywords.length; k++ ){ 

                        item_value = lookup_wordtext({ array: words_displayed, word_id: selected_items.keywords[k] });
            
                        id_txt_label = generate_words_id({ text: item_value, group: "keywords", element: "text" }).exist_id;
                        //console.log( "id_txt_label: " + id_txt_label );

                        id_background_div = generate_words_id({ text: item_value, group: "keywords", element: "div" }).exist_id;
                        //id_background_div = "#selection_div_keyword_" + item_value;
                 
                        //change the weight of the clicked item
                        d3.select(id_txt_label).style('font-weight', '900');
                        
                        //d3.select(id_txt_label).attr('fill', '#333333');
                        //d3.select(id_txt_label).attr('fill', selection_color);
                        //d3.select(id_txt_label).attr('text-decoration', "underline");
                        //d3.select(id_background_div).attr('opacity', '0.5');

           
                    }
                } else {
                    //remove_highlight_selection_items_keywords();
                }

                //console.log( "selected_items.authors.length: " + selected_items.authors.length );
                //highlight selection items of all author elements
                if (   (selected_items.authors.length > 0) 
                    && (selected_items.keywords.length >= 0)
                    && (selected_items.types.length >= 0) 
                    && (selected_items.years.length >= 0)  ){ 

                    //console.log( "clicked author will be highlighted" );

                    item_key = "authors";

                    //remove_highlight_selection_items_authors();

                    for ( var a = 0; a < selected_items.authors.length; a++ ){

                        item_value = lookup_wordtext({ array: authors_displayed, word_id: selected_items.authors[a] });
            
                        id_txt_label = generate_words_id({ text: item_value, group: "authors", element: "text" }).exist_id;
                        //console.log( "id_txt_label: " + id_txt_label );

                        id_background_div = generate_words_id({ text: item_value, group: "authors", element: "div" }).exist_id;
                        //id_background_div = "#selection_div_keyword_" + item_value;
                 
                        //change the weight of the clicked item
                        d3.select(id_txt_label).style('font-weight', '900');

                        //d3.select(id_txt_label).style('font-weight', '900');
                        //d3.select(id_txt_label).attr('fill', '#333333');
                        //d3.select(id_txt_label).attr('fill', selection_color);
                        //d3.select(id_txt_label).attr('text-decoration', "underline");
                        //d3.select(id_background_div).attr('opacity', '0.5');

                    }
                    
                } else {

                    //remove_highlight_selection_items_authors();

                }
            }

            //search for the text of the given id in the words_displayed object
            var lookup_wordtext = function( params ){
                var text;
                var word_id = params.word_id;
                var arr = params.array;
                
                for ( var g = 0; g < arr.length; g++ ) {
                    
                    if ( word_id === arr[g].id ){
                        text = arr[g].text;
                    }
                }

                return text;
            }
            //lookup_wordtext({ word_id:"#_txt_...", array: words_displayed });

            //filter the text and the id of the given array in a new array
            var save_wordtext_and_wordid = function ( params ) {
                //var item_text = params.text;  
                //console.log( "CALL: save_wordtext_and_wordid" );
                var item_text, item_id, result = [];
                
                var id_name = params.id;
                var arr = params.array;

                for ( var i = 0; i < arr.length; i++ ) {

                    item_text = arr[i].text;
                    item_text = item_text.replace(/[^\w\s\-]/gi, ''); //remove all special chars and whitespaces except the -
                    
                    item_id = generate_words_id({ text:item_text, group: id_name, element: "text" }).exist_id;
                    result.push({ text:item_text, id:item_id });
                }

                return result;
            }
            //save_wordtext_and_wordid({ array: , id:"" });

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
                //console.log( "create_filtered_json aufgerufen" );
                var result = [];
                var filter_criteria = params.filter_criteria;
                var shorter_list, longer_list;
                var str = "", n;
                var word_id, searched_word;

                for ( var i = 0; i < json.length; i++ ){
                    
                    //only years are selected
                    if (   (filter_criteria.years.length >= 1) 
                        && (filter_criteria.types.length === 0)
                        && (filter_criteria.keywords.length === 0)
                        && (filter_criteria.authors.length === 0)   ){

                        //console.log( "only years are selected" );
                    
                        for ( var y = 0; y < filter_criteria.years.length; y++ ){

                            if ( json[i].entryTags.year === filter_criteria.years[y] ) {

                               result.push(json[i]);

                            } else { 
                               // console.log("no match for: " + json[i].entryTags.year + " & " + filter_criteria.years[y] ); 
                            }
                        }
                    } 
                  
                    //only keywords are selected
                    else if (   (filter_criteria.keywords.length >= 1) 
                        && (filter_criteria.types.length === 0) 
                        && (filter_criteria.years.length === 0)
                        && (filter_criteria.authors.length === 0)   ){

                         //console.log( "only keywords are selected" );

                        for ( var k = 0; k < filter_criteria.keywords.length; k++ ){                           

                            searched_word = lookup_wordtext({ array: words_displayed, word_id: filter_criteria.keywords[k] });
                            //console.log( "searched_word: " + searched_word );
                            //console.log( " in displayed_words?: " + item_already_selected( {array:words_displayed, key:"text", value:searched_word } )  );

                            if (   json[i].entryTags.keywords !== undefined 
                                && item_already_selected( {array:words_displayed, key:"text", value:searched_word } ) ) {
                                
                                //fetch keyword from json
                                str = json[i].entryTags.keywords;
                                //str = words_displayed[i].tex

                                str = str.replace(/[^\w\s\-]/gi, ''); //remove all special chars and whitespaces except the . and -
                                
                                //start every word with upper case
                                str = to_title_case( str );

                                //lookup if filtered word match in the keywords of this entry
                                n = str.search( searched_word ); //if not contained n = -1 else it retruns the index

                                if ( n !== (-1) ) {
                                    
                                    //if match was found check if the result list has already entries
                                    if ( result.length > 0 ) { 
                                        
                                        for ( var r = 0; r < result.length; r++ ){
                                            
                                            //check if this entry already exists in the result list.
                                            if ( !item_already_selected( {array: result, key:"citationKey", value:json[i].citationKey } ) ){ 
                                                
                                                result.push(json[i]);
                                            } 
                                        }
                                    } else { 
                                        //is the first entry in the result list
                                        result.push(json[i]);
                                    }
                                } 
                            }
                        }
                    }

                    //only authors are selected
                    else if (   (filter_criteria.authors.length >= 1) 
                        && (filter_criteria.types.length === 0) 
                        && (filter_criteria.years.length === 0)
                        && (filter_criteria.keywords.length === 0)   ){ 

                        //console.log( "only authors are selected" );
                        //console.log( "json[i].entryTags.author: " + json[i].entryTags.author );

                        for ( var m = 0; m < filter_criteria.authors.length; m++ ){

                            searched_word = lookup_wordtext({ array: authors_displayed, word_id: filter_criteria.authors[m] });
                            //console.log( "searched_word: " + searched_word );

                            if (   json[i].entryTags.author !== undefined 
                                && item_already_selected( {array: authors_displayed, key:"text", value:searched_word } ) ) {

                                //fetch keyword from json
                                str = json[i].entryTags.author;
                                //str = words_displayed[i].tex

                                str = str.replace(/[^\w\s\-]/gi, ''); //remove all special chars and whitespaces except the . and -
                                
                                //start every word with upper case
                                str = to_title_case( str );

                                //lookup if filtered word match in the keywords of this entry
                                n = str.search( searched_word ); //if not contained n = -1 else it retruns the index

                                if ( n !== (-1) ) {
                                    //console.log( "match found: " + json[i].citationKey );
                                    //if match was found check if it already excists in the result list.
                                    if ( result.length > 0 ) { 
                                        //console.log( "restult.length: " + result.length );
                                        
                                        for ( var r = 0; r < result.length; r++ ){
                                            //console.log( "r: " + r );
                                            //console.log( "result[r].citationKey: " + result[r].citationKey );
                                            //console.log( "json[i].citationKey: " + json[i].citationKey );
                                            //console.log( 'item_already_selected?: ' + item_already_selected( {array: result, key:"citationKey", value:json[i].citationKey} ) );

                                            if ( !item_already_selected( {array: result, key:"citationKey", value:json[i].citationKey } ) ){ 
                                                result.push(json[i]);
                                                //console.log( "result[r].citationKey" + result[r].citationKey );
                                            } 
                                        }
                                    } else { 
                                        //console.log( "war das erste im result: " + json[i].citationKey );
                                        result.push(json[i]);
                                    }
                                } 
                            } 
                        }
                    }

                    //only types are selected
                    else if (   (filter_criteria.types.length >= 1) 
                        && (filter_criteria.years.length === 0) 
                        && (filter_criteria.keywords.length === 0)
                        && (filter_criteria.authors.length === 0) ){ 

                        //console.log( "only types are selected" );

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

                    //years and types are selected
                    else if (    (filter_criteria.types.length >= 1) 
                        &&  (filter_criteria.years.length >= 1)
                        &&  (filter_criteria.keywords.length === 0)
                        &&  (filter_criteria.authors.length === 0) ){ 

                        //console.log( "years and types are selected" );

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
                                    && (filter_criteria.types[v] === "Part of a Book") ) { 

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

                    //years and keywords are selected
                    else if (   (filter_criteria.types.length === 0) 
                        && (filter_criteria.years.length >= 1)
                        && (filter_criteria.keywords.length >= 1) 
                        && (filter_criteria.authors.length === 0) ){ 

                        //console.log( "years and keywords are selected" );

                        for ( var a = 0; a < filter_criteria.years.length; a++ ){
                            
                            for ( var b = 0; b < filter_criteria.keywords.length; b++ ){

                                searched_word = lookup_wordtext({ array: words_displayed, word_id:  filter_criteria.keywords[b] });

                                if (   (json[i].entryTags.year === filter_criteria.years[a]) 
                                    && (json[i].entryTags.keywords !== undefined)
                                    && (item_already_selected( {array:words_displayed, key:"text", value:searched_word } )) ) { 

                                    //fetch keyword from json
                                    str = json[i].entryTags.keywords;

                                    //remove all special chars and whitespaces except the -
                                    str = str.replace(/[^\w\s\-]/gi, ''); 
                                    
                                    //start every word with upper case
                                    str = to_title_case( str );

                                    //lookup if filtered word match in the keywords of this entry
                                    n = str.search( searched_word ); //if not contained n = -1 else it retruns the index     

                                    if ( n !== (-1) ) {
                                    
                                        //if match was found check if the result list has already entries
                                        if ( result.length > 0 ) { 
                                            
                                            for ( var r = 0; r < result.length; r++ ){
                                                
                                                //check if this entry already exists in the result list.
                                                if ( !item_already_selected( {array: result, key:"citationKey", value:json[i].citationKey } ) ){ 
                                                    
                                                    result.push(json[i]);
                                                } 
                                            }
                                        } else { 
                                            //is the first entry in the result list
                                            result.push(json[i]);
                                        }
                                    } 
                                }                        
                            }
                        }
                    } 

                    //authors and keywords
                    else if (   (filter_criteria.types.length === 0) 
                        && (filter_criteria.years.length === 0)
                        && (filter_criteria.keywords.length >= 1) 
                        && (filter_criteria.authors.length >= 0) ){ 

                        //console.log( "authors and keywords are selected" );

                        for ( var s = 0; s < filter_criteria.authors.length; s++ ){
                            
                            for ( var t = 0; t < filter_criteria.keywords.length; t++ ){

                                //searched_word = lookup_wordtext({ array: words_displayed, word_id:  filter_criteria.keywords[t] });
                                //console.log( "filter_criteria.keywords[t]: " + filter_criteria.keywords[t] );
                                //console.log( 'item_already_selected( words_displayed, key:id, value:filter_criteria.keywords[t])): ' + item_already_selected( {array:words_displayed, key:"id", value:filter_criteria.keywords[t] } )) ;
                                //check if the keyword is contained in the current entry
                                if (   (json[i].entryTags.keywords !== undefined)
                                    && (item_already_selected( {array:words_displayed, key:"id", value:filter_criteria.keywords[t] } )) ){ 

                                    searched_word = lookup_wordtext({ array: words_displayed, word_id:  filter_criteria.keywords[t] });

                                    //fetch keyword from json
                                    str = json[i].entryTags.keywords;

                                    //remove all special chars and whitespaces except the -
                                    str = str.replace(/[^\w\s\-]/gi, ''); 
                                    
                                    //start every word with upper case
                                    str = to_title_case( str );

                                    //lookup if filtered word match in the keywords of this entry
                                    n = str.search( searched_word ); //if not contained n = -1 else it retruns the index

                                    if ( n !== (-1) ) {
                                        
                                        //console.log( "keyword found: " + json[i].entryTags.keywords );
                                        //if match was found, check if the author is contained in the current entry
                                        //searched_word = lookup_wordtext({ array: authors_displayed, word_id:  filter_criteria.authors[s] });

                                        if (   (json[i].entryTags.author !== undefined)
                                            && (item_already_selected( {array:authors_displayed, key:"id", value:filter_criteria.authors[s] } ))) {

                                            searched_word = lookup_wordtext({ array:authors_displayed, word_id: filter_criteria.authors[s] });

                                            //fetch keyword from json
                                            str = json[i].entryTags.author;

                                            //remove all special chars and whitespaces except the -
                                            str = str.replace(/[^\w\s\-]/gi, ''); 
                                            
                                            //start every word with upper case
                                            str = to_title_case( str );

                                            //lookup if filtered word match in the keywords of this entry
                                            n = str.search( searched_word ); //if not contained n = -1 else it retruns the index
                                        
                                            if ( n !== (-1) ) {
                                    
                                                //if match was found check if the result list has already entries
                                                if ( result.length > 0 ) { 
                                                    
                                                    for ( var r = 0; r < result.length; r++ ){
                                                        
                                                        //check if this entry already exists in the result list.
                                                        if ( !item_already_selected( {array: result, key:"citationKey", value:json[i].citationKey } ) ){ 
                                                            
                                                            result.push(json[i]);
                                                        } 
                                                    }
                                                } else { 
                                                    //is the first entry in the result list
                                                    result.push(json[i]);
                                                }
                                            }
                                        }
                                    } 
                                } 
                            }
                        }
                    }

                    //years and authors are selected
                    else if (   (filter_criteria.types.length === 0) 
                        && (filter_criteria.years.length >= 1)
                        && (filter_criteria.keywords.length === 0) 
                        && (filter_criteria.authors.length >= 1) ){ 

                        //console.log( "years and authors are selected" );

                        for ( var p = 0; p < filter_criteria.years.length; p++ ){
                            
                            for ( var o = 0; o < filter_criteria.authors.length; o++ ){

                                searched_word = lookup_wordtext({ array: authors_displayed, word_id:filter_criteria.authors[o] });
                                //console.log( "searched_word: " + searched_word );

                                if (   (json[i].entryTags.year === filter_criteria.years[p]) 
                                    && (json[i].entryTags.author !== undefined )
                                    && (item_already_selected( {array: authors_displayed, key:"text", value:searched_word } ) ) ) {

                                    //fetch keyword from json
                                    str = json[i].entryTags.author;
                                    //str = words_displayed[i].tex

                                    str = str.replace(/[^\w\s\-]/gi, ''); //remove all special chars and whitespaces except the . and -
                                    
                                    //start every word with upper case
                                    str = to_title_case( str );

                                    //lookup if filtered word match in the keywords of this entry
                                    n = str.search( searched_word ); //if not contained n = -1 else it retruns the index                               

                                    if ( n !== (-1) ) {
                                    
                                        //if match was found check if the result list has already entries
                                        if ( result.length > 0 ) { 
                                            
                                            for ( var r = 0; r < result.length; r++ ){
                                                
                                                //check if this entry already exists in the result list.
                                                if ( !item_already_selected( {array: result, key:"citationKey", value:json[i].citationKey } ) ){ 
                                                    
                                                    result.push(json[i]);
                                                } 
                                            }
                                        } else { 
                                            //is the first entry in the result list
                                            result.push(json[i]);
                                        }
                                    }
                                } 
                            }
                        }
                    }

                    //types and keywords are selected
                    else if (    (filter_criteria.types.length >= 1) 
                        &&  (filter_criteria.years.length === 0)
                        &&  (filter_criteria.keywords.length >= 1) 
                        &&  (filter_criteria.authors.length === 0) ){ 

                        //console.log( "types and keywords are selected" );

                        for ( var c = 0; c < filter_criteria.keywords.length; c++ ){
                            
                            for ( var d = 0; d < filter_criteria.types.length; d++ ){

                                searched_word = lookup_wordtext({ array: words_displayed, word_id:  filter_criteria.keywords[d] });

                                if (   (json[i].entryTags.keywords !== undefined) 
                                    && (item_already_selected( {array:words_displayed, key:"text", value:searched_word } ))
                                    && (filter_criteria.types[d] === "Article") ) { 

                                    if ( json[i].entryType === "article" ) {

                                        //fetch keyword from json
                                        str = json[i].entryTags.keywords;

                                        //remove all special chars and whitespaces except the -
                                        str = str.replace(/[^\w\s\-]/gi, ''); 
                                        
                                        //start every word with upper case
                                        str = to_title_case( str );

                                        //lookup if filtered word match in the keywords of this entry
                                        n = str.search( searched_word ); //if not contained n = -1 else it retruns the index
                                      
                                        if ( n !== (-1) ) {
                                    
                                            //if match was found check if the result list has already entries
                                            if ( result.length > 0 ) { 
                                                
                                                for ( var r = 0; r < result.length; r++ ){
                                                    
                                                    //check if this entry already exists in the result list.
                                                    if ( !item_already_selected( {array: result, key:"citationKey", value:json[i].citationKey } ) ){ 
                                                        
                                                        result.push(json[i]);
                                                    } 
                                                }
                                            } else { 
                                                //is the first entry in the result list
                                                result.push(json[i]);
                                            }
                                        }                                      
                                    } 
                                }

                                if (   (json[i].entryTags.keywords !== undefined) 
                                    && (item_already_selected( {array:words_displayed, key:"text", value:searched_word } ))
                                    && (filter_criteria.types[d] === "Book") ) { 

                                    if (   ( json[i].entryType === "book") 
                                        || ( json[i].entryType === "booklet" ) ) {

                                        //fetch keyword from json
                                        str = json[i].entryTags.keywords;

                                        //remove all special chars and whitespaces except the -
                                        str = str.replace(/[^\w\s\-]/gi, ''); 
                                        
                                        //start every word with upper case
                                        str = to_title_case( str );

                                        //lookup if filtered word match in the keywords of this entry
                                        n = str.search( searched_word ); //if not contained n = -1 else it retruns the index

                                        if ( n !== (-1) ) {
                                            //if match was found add this entry
                                            result.push(json[i]);
                                            //console.log( "pushed!" );
                                        } else { 
                                            //console.log("no match for STR: " + str + " filter_criteria.keywords[k]: " + filter_criteria.keywords[k] ); 
                                        }
                                    } 
                                }

                                if (   (json[i].entryTags.keywords !== undefined) 
                                    && (item_already_selected( {array:words_displayed, key:"text", value:searched_word } ))
                                    && (filter_criteria.types[d] === "Part of a Book") ) { 

                                    if (   ( json[i].entryType === "inbook")  
                                        || ( json[i].entryType === "incollection" ) ) {

                                        //fetch keyword from json
                                        str = json[i].entryTags.keywords;

                                        //remove all special chars and whitespaces except the -
                                        str = str.replace(/[^\w\s\-]/gi, ''); 
                                        
                                        //start every word with upper case
                                        str = to_title_case( str );

                                        //lookup if filtered word match in the keywords of this entry
                                        n = str.search( searched_word ); //if not contained n = -1 else it retruns the index

                                        if ( n !== (-1) ) {
                                            //if match was found add this entry
                                            result.push(json[i]);
                                            //console.log( "pushed!" );
                                        } else { 
                                            //console.log("no match for STR: " + str + " filter_criteria.keywords[k]: " + filter_criteria.keywords[k] ); 
                                        }
                                                
                                    } 
                                }

                                if (   (json[i].entryTags.keywords !== undefined)
                                    && (item_already_selected( {array:words_displayed, key:"text", value:searched_word } ))
                                    && (filter_criteria.types[d] === "Conference") ) { 

                                    if (   ( json[i].entryType === "conference") 
                                        || ( json[i].entryType === "proceedings" )
                                        || ( json[i].entryType === "inproceedings" ) ) {

                                        //fetch keyword from json
                                        //fetch keyword from json
                                        str = json[i].entryTags.keywords;

                                        //remove all special chars and whitespaces except the -
                                        str = str.replace(/[^\w\s\-]/gi, ''); 
                                        
                                        //start every word with upper case
                                        str = to_title_case( str );

                                        //lookup if filtered word match in the keywords of this entry
                                        n = str.search( searched_word ); //if not contained n = -1 else it retruns the index

                                        if ( n !== (-1) ) {
                                            //if match was found add this entry
                                            result.push(json[i]);
                                            //console.log( "pushed!" );
                                        } else { 
                                            //console.log("no match for STR: " + str + " filter_criteria.keywords[k]: " + filter_criteria.keywords[k] ); 
                                        }

                                    }
                                }

                                if (   (json[i].entryTags.keywords !== undefined)
                                    && (item_already_selected( {array:words_displayed, key:"text", value:searched_word } ))
                                    && (filter_criteria.types[d] === "Thesis") ) { 

                                    if (   ( json[i].entryType === "thesis") 
                                        || ( json[i].entryType === "mastersthesis" )
                                        || ( json[i].entryType === "phdthesis" ) ) {

                                        //fetch keyword from json
                                        str = json[i].entryTags.keywords;

                                        //remove all special chars and whitespaces except the -
                                        str = str.replace(/[^\w\s\-]/gi, ''); 
                                        
                                        //start every word with upper case
                                        str = to_title_case( str );

                                        //lookup if filtered word match in the keywords of this entry
                                        n = str.search( searched_word ); //if not contained n = -1 else it retruns the index

                                        if ( n !== (-1) ) {
                                            //if match was found add this entry
                                            result.push(json[i]);
                                            //console.log( "pushed!" );
                                        } else { 
                                            //console.log("no match for STR: " + str + " filter_criteria.keywords[k]: " + filter_criteria.keywords[k] ); 
                                        }

                                    } 
                                }    

                                if (   (json[i].entryTags.keywords !== undefined)
                                    && (item_already_selected( {array:words_displayed, key:"text", value:searched_word } ))
                                    && (filter_criteria.types[d] === "Misc") ) { 

                                    if ( json[i].entryType === "misc" ) {
                                            
                                        //fetch keyword from json
                                        str = json[i].entryTags.keywords;

                                        //remove all special chars and whitespaces except the -
                                        str = str.replace(/[^\w\s\-]/gi, ''); 
                                        
                                        //start every word with upper case
                                        str = to_title_case( str );

                                        //lookup if filtered word match in the keywords of this entry
                                        n = str.search( searched_word ); //if not contained n = -1 else it retruns the index

                                        if ( n !== (-1) ) {
                                            //if match was found add this entry
                                            result.push(json[i]);
                                            //console.log( "pushed!" );
                                        } else { 
                                            //console.log("no match for STR: " + str + " filter_criteria.keywords[k]: " + filter_criteria.keywords[k] ); 
                                        }
                                    } 
                                }

                                if (   (json[i].entryTags.keywords !== undefined)
                                    && (item_already_selected( {array:words_displayed, key:"text", value:searched_word } ))
                                    && (filter_criteria.types[d] === "Report") ) { 

                                    if (   ( json[i].entryType === "manual") 
                                        || ( json[i].entryType === "techreport" ) ) {

                                        //fetch keyword from json
                                        str = json[i].entryTags.keywords;

                                        //remove all special chars and whitespaces except the -
                                        str = str.replace(/[^\w\s\-]/gi, ''); 
                                        
                                        //start every word with upper case
                                        str = to_title_case( str );

                                        //lookup if filtered word match in the keywords of this entry
                                        n = str.search( searched_word ); //if not contained n = -1 else it retruns the index

                                        if ( n !== (-1) ) {
                                            //if match was found add this entry
                                            result.push(json[i]);
                                            //console.log( "pushed!" );
                                        } else { 
                                            //console.log("no match for STR: " + str + " filter_criteria.keywords[k]: " + filter_criteria.keywords[k] ); 
                                        }

                                    } 
                                }                            
                            }
                        }
                    }

                    //types and authors are selected
                    else if (    (filter_criteria.types.length >= 1) 
                        &&  (filter_criteria.years.length === 0)
                        &&  (filter_criteria.keywords.length === 0) 
                        &&  (filter_criteria.authors.length >= 1) ){ 

                        console.log( "types and authors are selected" );

                        for ( var q = 0; q < filter_criteria.authors.length; q++ ){

                            //console.log( "schleife q");
                            
                            for ( var r = 0; r < filter_criteria.types.length; r++ ){

                                searched_word = lookup_wordtext({ array: authors_displayed, word_id: filter_criteria.authors[q] });
                                //console.log( "json[i].entryTags.author: " + json[i].entryTags.author );
                                //console.log( "searched_word: " + searched_word + " contained?: " + item_already_selected( {array:authors_displayed, key:"text", value:searched_word } ) );
                                //console.log( "filter_criteria.types[r]: " + filter_criteria.types[r] );
                                //console.log( "json[i].entryType: " + json[i].entryType );

                                if (   (json[i].entryTags.author !== undefined) 
                                    && (item_already_selected( {array:authors_displayed, key:"text", value:searched_word } )) ) { 
                                    //&& (filter_criteria.types[r] === "Article") ) { 

                                    if ( filter_criteria.types[r] === "Article" ) { 

                                        //console.log( "Article!" );

                                        if ( json[i].entryType === "article" ) {

                                            //fetch keyword from json
                                            str = json[i].entryTags.author;
                                            //str = words_displayed[i].tex

                                            str = str.replace(/[^\w\s\-]/gi, ''); //remove all special chars and whitespaces except the . and -
                                            
                                            //start every word with upper case
                                            str = to_title_case( str );

                                            //console.log( "str: " + str );

                                            //lookup if filtered word match in the keywords of this entry
                                            n = str.search( searched_word ); //if not contained n = -1 else it retruns the index
                                  
                                            if ( n !== (-1) ) {
                                    
                                                //if match was found check if the result list has already entries
                                                if ( result.length > 0 ) { 
                                                    
                                                    for ( var r = 0; r < result.length; r++ ){
                                                        
                                                        //check if this entry already exists in the result list.
                                                        if ( !item_already_selected( {array: result, key:"citationKey", value:json[i].citationKey } ) ){ 
                                                            
                                                            result.push(json[i]);
                                                        } 
                                                    }
                                                } else { 
                                                    //is the first entry in the result list
                                                    result.push(json[i]);
                                                }
                                            }
                                        }  
                                    }

                                    if ( filter_criteria.types[r] === "Book" ) { 

                                        //console.log( "Book!" );

                                        if (   ( json[i].entryType === "book") 
                                        || ( json[i].entryType === "booklet" ) ) {

                                            //console.log( "really a Book!" );

                                            //fetch keyword from json
                                            str = json[i].entryTags.author;
                                            //str = words_displayed[i].tex

                                            str = str.replace(/[^\w\s\-]/gi, ''); //remove all special chars and whitespaces except the . and -
                                            
                                            //start every word with upper case
                                            str = to_title_case( str );

                                            //console.log( "str: " + str );

                                            //lookup if filtered word match in the keywords of this entry
                                            n = str.search( searched_word ); //if not contained n = -1 else it retruns the index
         
                                            //if match was found check if the result list has already entries
                                            if ( result.length > 0 ) { 
                                                
                                                for ( var r = 0; r < result.length; r++ ){
                                                    
                                                    //check if this entry already exists in the result list.
                                                    if ( !item_already_selected( {array: result, key:"citationKey", value:json[i].citationKey } ) ){ 
                                                        
                                                        result.push(json[i]);
                                                    } 
                                                }
                                            } else { 
                                                //is the first entry in the result list
                                                result.push(json[i]);
                                            }
                                        }
                                    }

                                    if ( filter_criteria.types[r] === "Part of a Book" ) { 

                                        //console.log( "Part of a Book!" );

                                        if (   ( json[i].entryType === "inbook")  
                                        || ( json[i].entryType === "incollection" ) ) {

                                            //console.log( "really a Part of a Book!" );

                                            //fetch keyword from json
                                            str = json[i].entryTags.author;
                                            //str = words_displayed[i].tex

                                            str = str.replace(/[^\w\s\-]/gi, ''); //remove all special chars and whitespaces except the . and -
                                            
                                            //start every word with upper case
                                            str = to_title_case( str );

                                            //console.log( "str: " + str );

                                            //lookup if filtered word match in the keywords of this entry
                                            n = str.search( searched_word ); //if not contained n = -1 else it retruns the index

                                            //if match was found check if the result list has already entries
                                            if ( result.length > 0 ) { 
                                                
                                                for ( var r = 0; r < result.length; r++ ){
                                                    
                                                    //check if this entry already exists in the result list.
                                                    if ( !item_already_selected( {array: result, key:"citationKey", value:json[i].citationKey } ) ){ 
                                                        
                                                        result.push(json[i]);
                                                    } 
                                                }
                                            } else { 
                                                //is the first entry in the result list
                                                result.push(json[i]);
                                            }

                                        }

                                    }

                                    if ( filter_criteria.types[r] === "Conference" ) { 

                                        //console.log( "Conference!" );

                                        if (   ( json[i].entryType === "conference") 
                                        || ( json[i].entryType === "proceedings" )
                                        || ( json[i].entryType === "inproceedings" ) ) {

                                            //console.log( "really a Conference!" );

                                            //fetch keyword from json
                                            str = json[i].entryTags.author;
                                            //str = words_displayed[i].tex

                                            str = str.replace(/[^\w\s\-]/gi, ''); //remove all special chars and whitespaces except the . and -
                                            
                                            //start every word with upper case
                                            str = to_title_case( str );

                                            //console.log( "str: " + str );

                                            //lookup if filtered word match in the keywords of this entry
                                            n = str.search( searched_word ); //if not contained n = -1 else it retruns the index

                                            //if match was found check if the result list has already entries
                                            if ( result.length > 0 ) { 
                                                
                                                for ( var r = 0; r < result.length; r++ ){
                                                    
                                                    //check if this entry already exists in the result list.
                                                    if ( !item_already_selected( {array: result, key:"citationKey", value:json[i].citationKey } ) ){ 
                                                        
                                                        result.push(json[i]);
                                                    } 
                                                }
                                            } else { 
                                                //is the first entry in the result list
                                                result.push(json[i]);
                                            }

                                        }
                                    }

                                    if ( filter_criteria.types[r] === "Thesis" ) { 

                                        //console.log( "Thesis!" );

                                        if (   ( json[i].entryType === "thesis") 
                                        || ( json[i].entryType === "mastersthesis" )
                                        || ( json[i].entryType === "phdthesis" ) ) {

                                            //console.log( "really a Thesis!" );

                                            //fetch keyword from json
                                            str = json[i].entryTags.author;
                                            //str = words_displayed[i].tex

                                            str = str.replace(/[^\w\s\-]/gi, ''); //remove all special chars and whitespaces except the . and -
                                            
                                            //start every word with upper case
                                            str = to_title_case( str );

                                            //console.log( "str: " + str );

                                            //lookup if filtered word match in the keywords of this entry
                                            n = str.search( searched_word ); //if not contained n = -1 else it retruns the index

                                            //if match was found check if the result list has already entries
                                            if ( result.length > 0 ) { 
                                                
                                                for ( var r = 0; r < result.length; r++ ){
                                                    
                                                    //check if this entry already exists in the result list.
                                                    if ( !item_already_selected( {array: result, key:"citationKey", value:json[i].citationKey } ) ){ 
                                                        
                                                        result.push(json[i]);
                                                    } 
                                                }
                                            } else { 
                                                //is the first entry in the result list
                                                result.push(json[i]);
                                            }

                                        }
                                    }

                                    if ( filter_criteria.types[r] === "Report" ) { 

                                        //console.log( "Report!" );

                                        if (   ( json[i].entryType === "manual") 
                                        || ( json[i].entryType === "techreport" ) ) {

                                            //console.log( "really a Report!" );

                                            //fetch keyword from json
                                            str = json[i].entryTags.author;
                                            //str = words_displayed[i].tex

                                            str = str.replace(/[^\w\s\-]/gi, ''); //remove all special chars and whitespaces except the . and -
                                            
                                            //start every word with upper case
                                            str = to_title_case( str );

                                            //console.log( "str: " + str );

                                            //lookup if filtered word match in the keywords of this entry
                                            n = str.search( searched_word ); //if not contained n = -1 else it retruns the index

                                            //if match was found check if the result list has already entries
                                            if ( result.length > 0 ) { 
                                                
                                                for ( var r = 0; r < result.length; r++ ){
                                                    
                                                    //check if this entry already exists in the result list.
                                                    if ( !item_already_selected( {array: result, key:"citationKey", value:json[i].citationKey } ) ){ 
                                                        
                                                        result.push(json[i]);
                                                    } 
                                                }
                                            } else { 
                                                //is the first entry in the result list
                                                result.push(json[i]);
                                            }

                                        }
                                    }

                                    if ( filter_criteria.types[r] === "Misc" ) { 

                                        //console.log( "Misc!" );

                                        if ( json[i].entryType === "misc" ) {

                                            //console.log( "really a misc!" );

                                            //fetch keyword from json
                                            str = json[i].entryTags.author;
                                            //str = words_displayed[i].tex

                                            str = str.replace(/[^\w\s\-]/gi, ''); //remove all special chars and whitespaces except the . and -
                                            
                                            //start every word with upper case
                                            str = to_title_case( str );

                                            //console.log( "str: " + str );

                                            //lookup if filtered word match in the keywords of this entry
                                            n = str.search( searched_word ); //if not contained n = -1 else it retruns the index

                                            //if match was found check if the result list has already entries
                                            if ( result.length > 0 ) { 
                                                
                                                for ( var r = 0; r < result.length; r++ ){
                                                    
                                                    //check if this entry already exists in the result list.
                                                    if ( !item_already_selected( {array: result, key:"citationKey", value:json[i].citationKey } ) ){ 
                                                        
                                                        result.push(json[i]);
                                                    } 
                                                }
                                            } else { 
                                                //is the first entry in the result list
                                                result.push(json[i]);
                                            }

                                        }
                                    }

                                }
                            }
                        }
                    }                       

                    //years, types and keywords are selected 
                    else if ( (filter_criteria.types.length >= 1) 
                        &&  (filter_criteria.years.length >= 1)
                        &&  (filter_criteria.keywords.length >= 1) ){ 

                        //console.log( "years, types and keywords are selected" );

                        for ( var e = 0; e < filter_criteria.keywords.length; e++ ){

                            for ( var f = 0; f < filter_criteria.years.length; f++ ){
                            
                                for ( var g = 0; g < filter_criteria.types.length; g++ ){

                                    searched_word = lookup_wordtext({ array: words_displayed, word_id: filter_criteria.keywords[g] });

                                    if (   (json[i].entryTags.keywords !== undefined) 
                                        && (item_already_selected( {array:words_displayed, key:"text", value:searched_word } ))
                                        && (json[i].entryTags.year === filter_criteria.years[f])
                                        && (filter_criteria.types[g] === "Article") ) { 

                                        if ( json[i].entryType === "article" ) {

                                            //fetch keyword from json
                                            str = json[i].entryTags.keywords;

                                            //remove all special chars and whitespaces except the -
                                            str = str.replace(/[^\w\s\-]/gi, ''); 
                                            
                                            //start every word with upper case
                                            str = to_title_case( str );

                                            //lookup if filtered word match in the keywords of this entry
                                            n = str.search( searched_word ); //if not contained n = -1 else it retruns the index

                                            if ( n !== (-1) ) {
                                                //if match was found add this entry
                                                result.push(json[i]);
                                                //console.log( "pushed!" );
                                            } else { 
                                                //console.log("no match for STR: " + str + " filter_criteria.keywords[k]: " + filter_criteria.keywords[k] ); 
                                            }
                                        } 
                                    }

                                    if (   (json[i].entryTags.keywords !== undefined) 
                                        && (item_already_selected( {array:words_displayed, key:"text", value:searched_word } ))
                                        && (json[i].entryTags.year === filter_criteria.years[f])
                                        && (filter_criteria.types[g] === "Book") ) { 

                                        if (   ( json[i].entryType === "book") 
                                            || ( json[i].entryType === "booklet" ) ) {

                                            //fetch keyword from json
                                            str = json[i].entryTags.keywords;

                                            //remove all special chars and whitespaces except the -
                                            str = str.replace(/[^\w\s\-]/gi, ''); 
                                            
                                            //start every word with upper case
                                            str = to_title_case( str );

                                            //lookup if filtered word match in the keywords of this entry
                                            n = str.search( searched_word ); //if not contained n = -1 else it retruns the index

                                            if ( n !== (-1) ) {
                                                //if match was found add this entry
                                                result.push(json[i]);
                                                //console.log( "pushed!" );
                                            } else { 
                                                //console.log("no match for STR: " + str + " filter_criteria.keywords[k]: " + filter_criteria.keywords[k] ); 
                                            }
                                        } 
                                    }

                                    if (   (json[i].entryTags.keywords !== undefined) 
                                        && (item_already_selected( {array:words_displayed, key:"text", value:searched_word } ))
                                        && (json[i].entryTags.year === filter_criteria.years[f])
                                        && (filter_criteria.types[g] === "Part of a Book") ) { 

                                        if (   ( json[i].entryType === "inbook")  
                                            || ( json[i].entryType === "incollection" ) ) {

                                            //fetch keyword from json
                                            str = json[i].entryTags.keywords;

                                            //remove all special chars and whitespaces except the -
                                            str = str.replace(/[^\w\s\-]/gi, ''); 
                                            
                                            //start every word with upper case
                                            str = to_title_case( str );

                                            //lookup if filtered word match in the keywords of this entry
                                            n = str.search( searched_word ); //if not contained n = -1 else it retruns the index

                                            if ( n !== (-1) ) {
                                                //if match was found add this entry
                                                result.push(json[i]);
                                                //console.log( "pushed!" );
                                            } else { 
                                                //console.log("no match for STR: " + str + " filter_criteria.keywords[k]: " + filter_criteria.keywords[k] ); 
                                            }
                                                    
                                        } 
                                    }

                                    if (   (json[i].entryTags.keywords !== undefined) 
                                        && (item_already_selected( {array:words_displayed, key:"text", value:searched_word } ))
                                        && (json[i].entryTags.year === filter_criteria.years[f])
                                        && (filter_criteria.types[g] === "Conference") ) { 

                                        if (   ( json[i].entryType === "conference") 
                                            || ( json[i].entryType === "proceedings" )
                                            || ( json[i].entryType === "inproceedings" ) ) {

                                            //fetch keyword from json
                                            str = json[i].entryTags.keywords;

                                            //remove all special chars and whitespaces except the -
                                            str = str.replace(/[^\w\s\-]/gi, ''); 
                                            
                                            //start every word with upper case
                                            str = to_title_case( str );

                                            //lookup if filtered word match in the keywords of this entry
                                            n = str.search( searched_word ); //if not contained n = -1 else it retruns the index

                                            if ( n !== (-1) ) {
                                                //if match was found add this entry
                                                result.push(json[i]);
                                                //console.log( "pushed!" );
                                            } else { 
                                                //console.log("no match for STR: " + str + " filter_criteria.keywords[k]: " + filter_criteria.keywords[k] ); 
                                            }

                                        }
                                    }

                                    if (   (json[i].entryTags.keywords !== undefined) 
                                        && (item_already_selected( {array:words_displayed, key:"text", value:searched_word } ))
                                        && (json[i].entryTags.year === filter_criteria.years[f])
                                        && (filter_criteria.types[g] === "Thesis") ) { 

                                        if (   ( json[i].entryType === "thesis") 
                                            || ( json[i].entryType === "mastersthesis" )
                                            || ( json[i].entryType === "phdthesis" ) ) {

                                            //fetch keyword from json
                                            str = json[i].entryTags.keywords;

                                            //remove all special chars and whitespaces except the -
                                            str = str.replace(/[^\w\s\-]/gi, ''); 
                                            
                                            //start every word with upper case
                                            str = to_title_case( str );

                                            //lookup if filtered word match in the keywords of this entry
                                            n = str.search( searched_word ); //if not contained n = -1 else it retruns the index

                                            if ( n !== (-1) ) {
                                                //if match was found add this entry
                                                result.push(json[i]);
                                                //console.log( "pushed!" );
                                            } else { 
                                                //console.log("no match for STR: " + str + " filter_criteria.keywords[k]: " + filter_criteria.keywords[k] ); 
                                            }

                                        } 
                                    }    

                                    if (   (json[i].entryTags.keywords !== undefined)
                                        && (item_already_selected( {array:words_displayed, key:"text", value:searched_word } ))
                                        && (json[i].entryTags.year === filter_criteria.years[f]) 
                                        && (filter_criteria.types[g] === "Misc") ) { 

                                        if ( json[i].entryType === "misc" ) {
                                                
                                            //fetch keyword from json
                                            str = json[i].entryTags.keywords;

                                            //remove all special chars and whitespaces except the -
                                            str = str.replace(/[^\w\s\-]/gi, ''); 
                                            
                                            //start every word with upper case
                                            str = to_title_case( str );

                                            //lookup if filtered word match in the keywords of this entry
                                            n = str.search( searched_word ); //if not contained n = -1 else it retruns the index

                                            if ( n !== (-1) ) {
                                                //if match was found add this entry
                                                result.push(json[i]);
                                                //console.log( "pushed!" );
                                            } else { 
                                                //console.log("no match for STR: " + str + " filter_criteria.keywords[k]: " + filter_criteria.keywords[k] ); 
                                            }
                                        } 
                                    }

                                    if (   (json[i].entryTags.keywords !== undefined)
                                        && (item_already_selected( {array:words_displayed, key:"text", value:searched_word } ))
                                        && (json[i].entryTags.year === filter_criteria.years[f])
                                        && (filter_criteria.types[g] === "Report") ) { 

                                        if (   ( json[i].entryType === "manual") 
                                            || ( json[i].entryType === "techreport" ) ) {

                                            //fetch keyword from json
                                            str = json[i].entryTags.keywords;

                                            //remove all special chars and whitespaces except the -
                                            str = str.replace(/[^\w\s\-]/gi, ''); 
                                            
                                            //start every word with upper case
                                            str = to_title_case( str );

                                            //lookup if filtered word match in the keywords of this entry
                                            n = str.search( searched_word ); //if not contained n = -1 else it retruns the index

                                            if ( n !== (-1) ) {
                                                //if match was found add this entry
                                                result.push(json[i]);
                                                //console.log( "pushed!" );
                                            } else { 
                                                //console.log("no match for STR: " + str + " filter_criteria.keywords[k]: " + filter_criteria.keywords[k] ); 
                                            }
                                        } 
                                    }
                                }                            
                            }
                        }
                    }    

                    //years, types and authors
                    else if (    (filter_criteria.types.length >= 1) 
                        &&  (filter_criteria.years.length >= 1)
                        &&  (filter_criteria.authors.length >= 1) 
                        &&  (filter_criteria.keywords.length === 0)){ 

                        //console.log( "years, types and authors are selected" );

                        for ( var h = 0; h < filter_criteria.years.length; h++ ){

                            for ( var j = 0; j < filter_criteria.authors.length; j++ ){
                            
                                for ( var l = 0; l < filter_criteria.types.length; l++ ){

                                    if (   (json[i].entryTags.year === filter_criteria.years[h]) ){

                                        //console.log( "year match: " +  json[i].entryTags.year);
                                        //console.log( 'item_already_selected( {array: authors_displayed, key:"id", value:filter_criteria.author[j] } ) ): ' + item_already_selected( {array: authors_displayed, key:"id", value:filter_criteria.authors[j] } ) );

                                        if (   (json[i].entryTags.author !== undefined) 
                                            && (item_already_selected( {array: authors_displayed, key:"id", value:filter_criteria.authors[j] } ) ) ) { 

                                            //console.log( "Author is defined & contained" );
                                            searched_word = lookup_wordtext({ array: authors_displayed, word_id:filter_criteria.authors[j] });

                                            //fetch author from json
                                            str = json[i].entryTags.author;
                                            //str = words_displayed[i].tex

                                            str = str.replace(/[^\w\s\-]/gi, ''); //remove all special chars and whitespaces except the . and -
                                            
                                            //start every word with upper case
                                            str = to_title_case( str );

                                            //lookup if filtered word match in the keywords of this entry
                                            n = str.search( searched_word ); //if not contained n = -1 else it retruns the index

                                            if ( n !== (-1) ) {
                                                //if match was found add this entry
                                                //result.push(json[i]);
                                                //console.log( "author match: " +  str);

                                                if ( filter_criteria.types[l] === "Article" ) { 

                                                    //console.log( "Article!" );

                                                    if ( json[i].entryType === "article" ) {

                                                        //fetch keyword from json
                                                        str = json[i].entryTags.author;
                                                        //str = words_displayed[i].tex

                                                        str = str.replace(/[^\w\s\-]/gi, ''); //remove all special chars and whitespaces except the . and -
                                                        
                                                        //start every word with upper case
                                                        str = to_title_case( str );

                                                        //console.log( "str: " + str );

                                                        //lookup if filtered word match in the keywords of this entry
                                                        n = str.search( searched_word ); //if not contained n = -1 else it retruns the index

                                                        if ( n !== (-1) ) {
                                                            //if match was found add this entry
                                                            result.push(json[i]);
                                                        } else { 
                                                            //console.log("no match for STR: " + str + " filter_criteria.keywords[k]: " + filter_criteria.types[r] ); 
                                                        }
                                                    }  
                                                }

                                                if ( filter_criteria.types[l] === "Book" ) { 

                                                    //console.log( "Book!" );

                                                    if (   ( json[i].entryType === "book") 
                                                    || ( json[i].entryType === "booklet" ) ) {

                                                        //console.log( "really a Book!" );

                                                        //fetch keyword from json
                                                        str = json[i].entryTags.author;
                                                        //str = words_displayed[i].tex

                                                        str = str.replace(/[^\w\s\-]/gi, ''); //remove all special chars and whitespaces except the . and -
                                                        
                                                        //start every word with upper case
                                                        str = to_title_case( str );

                                                        //console.log( "str: " + str );

                                                        //lookup if filtered word match in the keywords of this entry
                                                        n = str.search( searched_word ); //if not contained n = -1 else it retruns the index

                                                        if ( n !== (-1) ) {
                                                            //if match was found add this entry
                                                            result.push(json[i]);
                                                        } else { 
                                                            //console.log("no match for STR: " + str + " filter_criteria.keywords[k]: " + filter_criteria.types[r] ); 
                                                        }

                                                    }
                                                }

                                                if ( filter_criteria.types[l] === "Part of a Book" ) { 

                                                    //console.log( "Part of a Book!" );

                                                    if (   ( json[i].entryType === "inbook")  
                                                    || ( json[i].entryType === "incollection" ) ) {

                                                        //console.log( "really a Part of a Book!" );

                                                        //fetch keyword from json
                                                        str = json[i].entryTags.author;
                                                        //str = words_displayed[i].tex

                                                        str = str.replace(/[^\w\s\-]/gi, ''); //remove all special chars and whitespaces except the . and -
                                                        
                                                        //start every word with upper case
                                                        str = to_title_case( str );

                                                        //console.log( "str: " + str );

                                                        //lookup if filtered word match in the keywords of this entry
                                                        n = str.search( searched_word ); //if not contained n = -1 else it retruns the index

                                                        if ( n !== (-1) ) {
                                                            //if match was found add this entry
                                                            result.push(json[i]);
                                                        } else { 
                                                            //console.log("no match for STR: " + str + " filter_criteria.keywords[k]: " + filter_criteria.types[r] ); 
                                                        }

                                                    }
                                                }

                                                if ( filter_criteria.types[l] === "Conference" ) { 

                                                    //console.log( "Conference!" );

                                                    if (   ( json[i].entryType === "conference") 
                                                    || ( json[i].entryType === "proceedings" )
                                                    || ( json[i].entryType === "inproceedings" ) ) {

                                                        //console.log( "really a Conference!" );

                                                        //fetch keyword from json
                                                        str = json[i].entryTags.author;
                                                        //str = words_displayed[i].tex

                                                        str = str.replace(/[^\w\s\-]/gi, ''); //remove all special chars and whitespaces except the . and -
                                                        
                                                        //start every word with upper case
                                                        str = to_title_case( str );

                                                        //console.log( "str: " + str );

                                                        //lookup if filtered word match in the keywords of this entry
                                                        n = str.search( searched_word ); //if not contained n = -1 else it retruns the index

                                                        if ( n !== (-1) ) {
                                                            //if match was found add this entry
                                                            result.push(json[i]);
                                                        } else { 
                                                            //console.log("no match for STR: " + str + " filter_criteria.keywords[k]: " + filter_criteria.types[r] ); 
                                                        }

                                                    }
                                                }

                                                if ( filter_criteria.types[l] === "Thesis" ) { 

                                                    //console.log( "Thesis!" );

                                                    if (   ( json[i].entryType === "thesis") 
                                                    || ( json[i].entryType === "mastersthesis" )
                                                    || ( json[i].entryType === "phdthesis" ) ) {

                                                        //console.log( "really a Thesis!" );

                                                        //fetch keyword from json
                                                        str = json[i].entryTags.author;
                                                        //str = words_displayed[i].tex

                                                        str = str.replace(/[^\w\s\-]/gi, ''); //remove all special chars and whitespaces except the . and -
                                                        
                                                        //start every word with upper case
                                                        str = to_title_case( str );

                                                        //console.log( "str: " + str );

                                                        //lookup if filtered word match in the keywords of this entry
                                                        n = str.search( searched_word ); //if not contained n = -1 else it retruns the index

                                                        if ( n !== (-1) ) {
                                                            //if match was found add this entry
                                                            result.push(json[i]);
                                                        } else { 
                                                            //console.log("no match for STR: " + str + " filter_criteria.keywords[k]: " + filter_criteria.types[r] ); 
                                                        }

                                                    }
                                                }

                                                if ( filter_criteria.types[l] === "Report" ) { 

                                                    //console.log( "Report!" );

                                                    if (   ( json[i].entryType === "manual") 
                                                    || ( json[i].entryType === "techreport" ) ) {

                                                        //console.log( "really a Report!" );

                                                        //fetch keyword from json
                                                        str = json[i].entryTags.author;
                                                        //str = words_displayed[i].tex

                                                        str = str.replace(/[^\w\s\-]/gi, ''); //remove all special chars and whitespaces except the . and -
                                                        
                                                        //start every word with upper case
                                                        str = to_title_case( str );

                                                        //console.log( "str: " + str );

                                                        //lookup if filtered word match in the keywords of this entry
                                                        n = str.search( searched_word ); //if not contained n = -1 else it retruns the index

                                                        if ( n !== (-1) ) {
                                                            //if match was found add this entry
                                                            result.push(json[i]);
                                                        } else { 
                                                            //console.log("no match for STR: " + str + " filter_criteria.keywords[k]: " + filter_criteria.types[r] ); 
                                                        }

                                                    }
                                                }

                                                if ( filter_criteria.types[l] === "Misc" ) { 

                                                    //console.log( "Misc!" );

                                                    if ( json[i].entryType === "misc" ) {

                                                        //console.log( "really a misc!" );

                                                        //fetch keyword from json
                                                        str = json[i].entryTags.author;
                                                        //str = words_displayed[i].tex

                                                        str = str.replace(/[^\w\s\-]/gi, ''); //remove all special chars and whitespaces except the . and -
                                                        
                                                        //start every word with upper case
                                                        str = to_title_case( str );

                                                        //console.log( "str: " + str );

                                                        //lookup if filtered word match in the keywords of this entry
                                                        n = str.search( searched_word ); //if not contained n = -1 else it retruns the index

                                                        if ( n !== (-1) ) {
                                                            //if match was found add this entry
                                                            result.push(json[i]);
                                                        } else { 
                                                            //console.log("no match for STR: " + str + " filter_criteria.keywords[k]: " + filter_criteria.types[r] ); 
                                                        }

                                                    }
                                                }

                                            } else { 
                                                //console.log("no match for STR: " + str + " filter_criteria.keywords[k]: " + filter_criteria.keywords[k] ); 
                                            }            

                                        }

                                    }
                                
                                }
                            
                            }
                        
                        }
                    }

                    //types, keywords and authors
                    else if ((filter_criteria.types.length >= 1) 
                        &&   (filter_criteria.years.length === 0)
                        &&   (filter_criteria.authors.length >= 1) 
                        &&   (filter_criteria.keywords.length >= 1) ){ 

                        //console.log( "years, types and authors are selected" );

                        for ( var a = 0; a < filter_criteria.authors.length; a++ ){

                            for ( var b = 0; b < filter_criteria.keywords.length; b++ ){
                            
                                for ( var c = 0; c < filter_criteria.types.length; c++ ){

                                    if (   (json[i].entryTags.keywords !== undefined)
                                    && (item_already_selected( {array:words_displayed, key:"id", value:filter_criteria.keywords[b] } )) ){ 

                                        searched_word = lookup_wordtext({ array: words_displayed, word_id:  filter_criteria.keywords[b] });

                                        //fetch keyword from json
                                        str = json[i].entryTags.keywords;

                                        //remove all special chars and whitespaces except the -
                                        str = str.replace(/[^\w\s\-]/gi, ''); 
                                        
                                        //start every word with upper case
                                        str = to_title_case( str );

                                        //lookup if filtered word match in the keywords of this entry
                                        n = str.search( searched_word ); //if not contained n = -1 else it retruns the index

                                        if ( n !== (-1) ) {
                                            
                                            //console.log( "keyword found: " + json[i].entryTags.keywords );
                                            //if match was found, check if the author is contained in the current entry
                                            //searched_word = lookup_wordtext({ array: authors_displayed, word_id:  filter_criteria.authors[s] });

                                            if (   (json[i].entryTags.author !== undefined)
                                                && (item_already_selected( {array:authors_displayed, key:"id", value:filter_criteria.authors[a] } ))) {

                                                searched_word = lookup_wordtext({ array:authors_displayed, word_id: filter_criteria.authors[a] });

                                                //fetch keyword from json
                                                str = json[i].entryTags.author;

                                                //remove all special chars and whitespaces except the -
                                                str = str.replace(/[^\w\s\-]/gi, ''); 
                                                
                                                //start every word with upper case
                                                str = to_title_case( str );

                                                //lookup if filtered word match in the keywords of this entry
                                                n = str.search( searched_word ); //if not contained n = -1 else it retruns the index

                                                if ( n !== (-1) ) {
                                                    //if match was found add this entry
                                                    //console.log( "author found: " + json[i].entryTags.author );
                                                    //console.dir( json[i] );

                                                    if ( filter_criteria.types[c] === "Article" ) { 

                                                        //console.log( "Article!" );

                                                        if ( json[i].entryType === "article" ) {

                                                            //fetch keyword from json
                                                            str = json[i].entryTags.author;
                                                            //str = words_displayed[i].tex

                                                            str = str.replace(/[^\w\s\-]/gi, ''); //remove all special chars and whitespaces except the . and -
                                                            
                                                            //start every word with upper case
                                                            str = to_title_case( str );

                                                            //console.log( "str: " + str );

                                                            //lookup if filtered word match in the keywords of this entry
                                                            n = str.search( searched_word ); //if not contained n = -1 else it retruns the index

                                                            if ( n !== (-1) ) {
                                                                //if match was found add this entry
                                                                result.push(json[i]);
                                                            } else { 
                                                                //console.log("no match for STR: " + str + " filter_criteria.keywords[k]: " + filter_criteria.types[r] ); 
                                                            }
                                                        }  
                                                    }

                                                    if ( filter_criteria.types[c] === "Book" ) { 

                                                        //console.log( "Book!" );

                                                        if (   ( json[i].entryType === "book") 
                                                        || ( json[i].entryType === "booklet" ) ) {

                                                            //console.log( "really a Book!" );

                                                            //fetch keyword from json
                                                            str = json[i].entryTags.author;
                                                            //str = words_displayed[i].tex

                                                            str = str.replace(/[^\w\s\-]/gi, ''); //remove all special chars and whitespaces except the . and -
                                                            
                                                            //start every word with upper case
                                                            str = to_title_case( str );

                                                            //console.log( "str: " + str );

                                                            //lookup if filtered word match in the keywords of this entry
                                                            n = str.search( searched_word ); //if not contained n = -1 else it retruns the index

                                                            if ( n !== (-1) ) {
                                                                //if match was found add this entry
                                                                result.push(json[i]);
                                                            } else { 
                                                                //console.log("no match for STR: " + str + " filter_criteria.keywords[k]: " + filter_criteria.types[r] ); 
                                                            }

                                                        }
                                                    }

                                                    if ( filter_criteria.types[c] === "Part of a Book" ) { 

                                                        //console.log( "Part of a Book!" );

                                                        if (   ( json[i].entryType === "inbook")  
                                                        || ( json[i].entryType === "incollection" ) ) {

                                                            //console.log( "really a Part of a Book!" );

                                                            //fetch keyword from json
                                                            str = json[i].entryTags.author;
                                                            //str = words_displayed[i].tex

                                                            str = str.replace(/[^\w\s\-]/gi, ''); //remove all special chars and whitespaces except the . and -
                                                            
                                                            //start every word with upper case
                                                            str = to_title_case( str );

                                                            //console.log( "str: " + str );

                                                            //lookup if filtered word match in the keywords of this entry
                                                            n = str.search( searched_word ); //if not contained n = -1 else it retruns the index

                                                            if ( n !== (-1) ) {
                                                                //if match was found add this entry
                                                                result.push(json[i]);
                                                            } else { 
                                                                //console.log("no match for STR: " + str + " filter_criteria.keywords[k]: " + filter_criteria.types[r] ); 
                                                            }

                                                        }
                                                    }

                                                    if ( filter_criteria.types[c] === "Conference" ) { 

                                                        //console.log( "Conference!" );

                                                        if (   ( json[i].entryType === "conference") 
                                                        || ( json[i].entryType === "proceedings" )
                                                        || ( json[i].entryType === "inproceedings" ) ) {

                                                            //console.log( "really a Conference!" );

                                                            //fetch keyword from json
                                                            str = json[i].entryTags.author;
                                                            //str = words_displayed[i].tex

                                                            str = str.replace(/[^\w\s\-]/gi, ''); //remove all special chars and whitespaces except the . and -
                                                            
                                                            //start every word with upper case
                                                            str = to_title_case( str );

                                                            //console.log( "str: " + str );

                                                            //lookup if filtered word match in the keywords of this entry
                                                            n = str.search( searched_word ); //if not contained n = -1 else it retruns the index

                                                            if ( n !== (-1) ) {
                                                                //if match was found add this entry
                                                                result.push(json[i]);
                                                            } else { 
                                                                //console.log("no match for STR: " + str + " filter_criteria.keywords[k]: " + filter_criteria.types[r] ); 
                                                            }

                                                        }
                                                    }

                                                    if ( filter_criteria.types[c] === "Thesis" ) { 

                                                        //console.log( "Thesis!" );

                                                        if (   ( json[i].entryType === "thesis") 
                                                        || ( json[i].entryType === "mastersthesis" )
                                                        || ( json[i].entryType === "phdthesis" ) ) {

                                                            //console.log( "really a Thesis!" );

                                                            //fetch keyword from json
                                                            str = json[i].entryTags.author;
                                                            //str = words_displayed[i].tex

                                                            str = str.replace(/[^\w\s\-]/gi, ''); //remove all special chars and whitespaces except the . and -
                                                            
                                                            //start every word with upper case
                                                            str = to_title_case( str );

                                                            //console.log( "str: " + str );

                                                            //lookup if filtered word match in the keywords of this entry
                                                            n = str.search( searched_word ); //if not contained n = -1 else it retruns the index

                                                            if ( n !== (-1) ) {
                                                                //if match was found add this entry
                                                                result.push(json[i]);
                                                            } else { 
                                                                //console.log("no match for STR: " + str + " filter_criteria.keywords[k]: " + filter_criteria.types[r] ); 
                                                            }

                                                        }
                                                    }

                                                    if ( filter_criteria.types[c] === "Report" ) { 

                                                        //console.log( "Report!" );

                                                        if (   ( json[i].entryType === "manual") 
                                                        || ( json[i].entryType === "techreport" ) ) {

                                                            //console.log( "really a Report!" );

                                                            //fetch keyword from json
                                                            str = json[i].entryTags.author;
                                                            //str = words_displayed[i].tex

                                                            str = str.replace(/[^\w\s\-]/gi, ''); //remove all special chars and whitespaces except the . and -
                                                            
                                                            //start every word with upper case
                                                            str = to_title_case( str );

                                                            //console.log( "str: " + str );

                                                            //lookup if filtered word match in the keywords of this entry
                                                            n = str.search( searched_word ); //if not contained n = -1 else it retruns the index

                                                            if ( n !== (-1) ) {
                                                                //if match was found add this entry
                                                                result.push(json[i]);
                                                            } else { 
                                                                //console.log("no match for STR: " + str + " filter_criteria.keywords[k]: " + filter_criteria.types[r] ); 
                                                            }

                                                        }
                                                    }

                                                    if ( filter_criteria.types[c] === "Misc" ) { 

                                                        //console.log( "Misc!" );

                                                        if ( json[i].entryType === "misc" ) {

                                                            //console.log( "really a misc!" );

                                                            //fetch keyword from json
                                                            str = json[i].entryTags.author;
                                                            //str = words_displayed[i].tex

                                                            str = str.replace(/[^\w\s\-]/gi, ''); //remove all special chars and whitespaces except the . and -
                                                            
                                                            //start every word with upper case
                                                            str = to_title_case( str );

                                                            //console.log( "str: " + str );

                                                            //lookup if filtered word match in the keywords of this entry
                                                            n = str.search( searched_word ); //if not contained n = -1 else it retruns the index

                                                            if ( n !== (-1) ) {
                                                                //if match was found add this entry
                                                                result.push(json[i]);
                                                            } else { 
                                                                //console.log("no match for STR: " + str + " filter_criteria.keywords[k]: " + filter_criteria.types[r] ); 
                                                            }

                                                        }
                                                    }

                                                } else { 
                                                    //console.log("no match for STR: " + str + " filter_criteria.keywords[k]: " + filter_criteria.keywords[k] ); 
                                                }
                                           // }

                                            } else { 
                                                //console.log("no match for STR: " + str + " filter_criteria.keywords[k]: " + filter_criteria.keywords[k] ); 
                                            }
                                        } 

                                    }
                                }
                            }
                        }
                    }

                    //years, keywords and authors
                    else if ((filter_criteria.types.length === 0) 
                        &&   (filter_criteria.years.length >= 1)
                        &&   (filter_criteria.authors.length >= 1) 
                        &&   (filter_criteria.keywords.length >= 1) ){ 

                        //console.log( "years, keywords and authors are selected" );

                        for ( var e = 0; e < filter_criteria.years.length; e++ ){

                            for ( var f = 0; f < filter_criteria.keywords.length; f++ ){
                            
                                for ( var g = 0; g < filter_criteria.authors.length; g++ ){

                                    if (   (json[i].entryTags.year === filter_criteria.years[e]) ){

                                        if (   (json[i].entryTags.keywords !== undefined)
                                            && (item_already_selected( {array:words_displayed, key:"id", value:filter_criteria.keywords[f] } )) ){ 

                                            searched_word = lookup_wordtext({ array: words_displayed, word_id:  filter_criteria.keywords[f] });

                                            //fetch keyword from json
                                            str = json[i].entryTags.keywords;

                                            //remove all special chars and whitespaces except the -
                                            str = str.replace(/[^\w\s\-]/gi, ''); 
                                            
                                            //start every word with upper case
                                            str = to_title_case( str );

                                            //lookup if filtered word match in the keywords of this entry
                                            n = str.search( searched_word ); //if not contained n = -1 else it retruns the index

                                            if ( n !== (-1) ) {
                                                
                                                //console.log( "keyword found: " + json[i].entryTags.keywords );
                                                //if match was found, check if the author is contained in the current entry
                                                //searched_word = lookup_wordtext({ array: authors_displayed, word_id:  filter_criteria.authors[s] });

                                                if (   (json[i].entryTags.author !== undefined)
                                                    && (item_already_selected( {array:authors_displayed, key:"id", value:filter_criteria.authors[g] } ))) {

                                                    searched_word = lookup_wordtext({ array:authors_displayed, word_id: filter_criteria.authors[g] });

                                                    //fetch keyword from json
                                                    str = json[i].entryTags.author;

                                                    //remove all special chars and whitespaces except the -
                                                    str = str.replace(/[^\w\s\-]/gi, ''); 
                                                    
                                                    //start every word with upper case
                                                    str = to_title_case( str );

                                                    //lookup if filtered word match in the keywords of this entry
                                                    n = str.search( searched_word ); //if not contained n = -1 else it retruns the index

                                                    if ( n !== (-1) ) {
                                                        //if match was found add this entry
                                                        //console.log( "author found: " + json[i].entryTags.author );
                                                        //console.dir( json[i] );
                                                        result.push(json[i]);
                                                        //console.log( "pushed!" );
                                                    } else { 
                                                        //console.log("no match for STR: " + str + " filter_criteria.keywords[k]: " + filter_criteria.keywords[k] ); 
                                                    }
                                                }

                                            } else { 
                                                //console.log("no match for STR: " + str + " filter_criteria.keywords[k]: " + filter_criteria.keywords[k] ); 
                                            }
                                        }
                                    }

                                }
                            }
                        }
                    }
                    
                    //years, types, authors and keywords  
                    else if ((filter_criteria.types.length >= 1) 
                        &&   (filter_criteria.years.length === 0)
                        &&   (filter_criteria.authors.length >= 1) 
                        &&   (filter_criteria.keywords.length >= 1) ){ 

                        //console.log( "years, types and authors are selected" );
                        for ( var y = 0; y < filter_criteria.authors.length; y++ ){

                            for ( var a = 0; a < filter_criteria.authors.length; a++ ){

                                for ( var b = 0; b < filter_criteria.keywords.length; b++ ){
                                
                                    for ( var c = 0; c < filter_criteria.types.length; c++ ){

                                        if (   (json[i].entryTags.year === filter_criteria.years[y]) ) {

                                            if (   (json[i].entryTags.keywords !== undefined)
                                            && (item_already_selected( {array:words_displayed, key:"id", value:filter_criteria.keywords[b] } )) ){ 

                                                searched_word = lookup_wordtext({ array: words_displayed, word_id:  filter_criteria.keywords[b] });

                                                //fetch keyword from json
                                                str = json[i].entryTags.keywords;

                                                //remove all special chars and whitespaces except the -
                                                str = str.replace(/[^\w\s\-]/gi, ''); 
                                                
                                                //start every word with upper case
                                                str = to_title_case( str );

                                                //lookup if filtered word match in the keywords of this entry
                                                n = str.search( searched_word ); //if not contained n = -1 else it retruns the index

                                                if ( n !== (-1) ) {
                                                    
                                                    //console.log( "keyword found: " + json[i].entryTags.keywords );
                                                    //if match was found, check if the author is contained in the current entry
                                                    //searched_word = lookup_wordtext({ array: authors_displayed, word_id:  filter_criteria.authors[s] });

                                                    if (   (json[i].entryTags.author !== undefined)
                                                        && (item_already_selected( {array:authors_displayed, key:"id", value:filter_criteria.authors[a] } ))) {

                                                        searched_word = lookup_wordtext({ array:authors_displayed, word_id: filter_criteria.authors[a] });

                                                        //fetch keyword from json
                                                        str = json[i].entryTags.author;

                                                        //remove all special chars and whitespaces except the -
                                                        str = str.replace(/[^\w\s\-]/gi, ''); 
                                                        
                                                        //start every word with upper case
                                                        str = to_title_case( str );

                                                        //lookup if filtered word match in the keywords of this entry
                                                        n = str.search( searched_word ); //if not contained n = -1 else it retruns the index

                                                        if ( n !== (-1) ) {
                                                            //if match was found add this entry
                                                            //console.log( "author found: " + json[i].entryTags.author );
                                                            //console.dir( json[i] );

                                                            if ( filter_criteria.types[c] === "Article" ) { 

                                                                //console.log( "Article!" );

                                                                if ( json[i].entryType === "article" ) {

                                                                    //fetch keyword from json
                                                                    str = json[i].entryTags.author;
                                                                    //str = words_displayed[i].tex

                                                                    str = str.replace(/[^\w\s\-]/gi, ''); //remove all special chars and whitespaces except the . and -
                                                                    
                                                                    //start every word with upper case
                                                                    str = to_title_case( str );

                                                                    //console.log( "str: " + str );

                                                                    //lookup if filtered word match in the keywords of this entry
                                                                    n = str.search( searched_word ); //if not contained n = -1 else it retruns the index

                                                                    if ( n !== (-1) ) {
                                                                        //if match was found add this entry
                                                                        result.push(json[i]);
                                                                    } else { 
                                                                        //console.log("no match for STR: " + str + " filter_criteria.keywords[k]: " + filter_criteria.types[r] ); 
                                                                    }
                                                                }  
                                                            }

                                                            if ( filter_criteria.types[c] === "Book" ) { 

                                                                //console.log( "Book!" );

                                                                if (   ( json[i].entryType === "book") 
                                                                || ( json[i].entryType === "booklet" ) ) {

                                                                    //console.log( "really a Book!" );

                                                                    //fetch keyword from json
                                                                    str = json[i].entryTags.author;
                                                                    //str = words_displayed[i].tex

                                                                    str = str.replace(/[^\w\s\-]/gi, ''); //remove all special chars and whitespaces except the . and -
                                                                    
                                                                    //start every word with upper case
                                                                    str = to_title_case( str );

                                                                    //console.log( "str: " + str );

                                                                    //lookup if filtered word match in the keywords of this entry
                                                                    n = str.search( searched_word ); //if not contained n = -1 else it retruns the index

                                                                    if ( n !== (-1) ) {
                                                                        //if match was found add this entry
                                                                        result.push(json[i]);
                                                                    } else { 
                                                                        //console.log("no match for STR: " + str + " filter_criteria.keywords[k]: " + filter_criteria.types[r] ); 
                                                                    }

                                                                }
                                                            }

                                                            if ( filter_criteria.types[c] === "Part of a Book" ) { 

                                                                //console.log( "Part of a Book!" );

                                                                if (   ( json[i].entryType === "inbook")  
                                                                || ( json[i].entryType === "incollection" ) ) {

                                                                    //console.log( "really a Part of a Book!" );

                                                                    //fetch keyword from json
                                                                    str = json[i].entryTags.author;
                                                                    //str = words_displayed[i].tex

                                                                    str = str.replace(/[^\w\s\-]/gi, ''); //remove all special chars and whitespaces except the . and -
                                                                    
                                                                    //start every word with upper case
                                                                    str = to_title_case( str );

                                                                    //console.log( "str: " + str );

                                                                    //lookup if filtered word match in the keywords of this entry
                                                                    n = str.search( searched_word ); //if not contained n = -1 else it retruns the index

                                                                    if ( n !== (-1) ) {
                                                                        //if match was found add this entry
                                                                        result.push(json[i]);
                                                                    } else { 
                                                                        //console.log("no match for STR: " + str + " filter_criteria.keywords[k]: " + filter_criteria.types[r] ); 
                                                                    }

                                                                }
                                                            }

                                                            if ( filter_criteria.types[c] === "Conference" ) { 

                                                                //console.log( "Conference!" );

                                                                if (   ( json[i].entryType === "conference") 
                                                                || ( json[i].entryType === "proceedings" )
                                                                || ( json[i].entryType === "inproceedings" ) ) {

                                                                    //console.log( "really a Conference!" );

                                                                    //fetch keyword from json
                                                                    str = json[i].entryTags.author;
                                                                    //str = words_displayed[i].tex

                                                                    str = str.replace(/[^\w\s\-]/gi, ''); //remove all special chars and whitespaces except the . and -
                                                                    
                                                                    //start every word with upper case
                                                                    str = to_title_case( str );

                                                                    //console.log( "str: " + str );

                                                                    //lookup if filtered word match in the keywords of this entry
                                                                    n = str.search( searched_word ); //if not contained n = -1 else it retruns the index

                                                                    if ( n !== (-1) ) {
                                                                        //if match was found add this entry
                                                                        result.push(json[i]);
                                                                    } else { 
                                                                        //console.log("no match for STR: " + str + " filter_criteria.keywords[k]: " + filter_criteria.types[r] ); 
                                                                    }

                                                                }
                                                            }

                                                            if ( filter_criteria.types[c] === "Thesis" ) { 

                                                                //console.log( "Thesis!" );

                                                                if (   ( json[i].entryType === "thesis") 
                                                                || ( json[i].entryType === "mastersthesis" )
                                                                || ( json[i].entryType === "phdthesis" ) ) {

                                                                    //console.log( "really a Thesis!" );

                                                                    //fetch keyword from json
                                                                    str = json[i].entryTags.author;
                                                                    //str = words_displayed[i].tex

                                                                    str = str.replace(/[^\w\s\-]/gi, ''); //remove all special chars and whitespaces except the . and -
                                                                    
                                                                    //start every word with upper case
                                                                    str = to_title_case( str );

                                                                    //console.log( "str: " + str );

                                                                    //lookup if filtered word match in the keywords of this entry
                                                                    n = str.search( searched_word ); //if not contained n = -1 else it retruns the index

                                                                    if ( n !== (-1) ) {
                                                                        //if match was found add this entry
                                                                        result.push(json[i]);
                                                                    } else { 
                                                                        //console.log("no match for STR: " + str + " filter_criteria.keywords[k]: " + filter_criteria.types[r] ); 
                                                                    }

                                                                }
                                                            }

                                                            if ( filter_criteria.types[c] === "Report" ) { 

                                                                //console.log( "Report!" );

                                                                if (   ( json[i].entryType === "manual") 
                                                                || ( json[i].entryType === "techreport" ) ) {

                                                                    //console.log( "really a Report!" );

                                                                    //fetch keyword from json
                                                                    str = json[i].entryTags.author;
                                                                    //str = words_displayed[i].tex

                                                                    str = str.replace(/[^\w\s\-]/gi, ''); //remove all special chars and whitespaces except the . and -
                                                                    
                                                                    //start every word with upper case
                                                                    str = to_title_case( str );

                                                                    //console.log( "str: " + str );

                                                                    //lookup if filtered word match in the keywords of this entry
                                                                    n = str.search( searched_word ); //if not contained n = -1 else it retruns the index

                                                                    if ( n !== (-1) ) {
                                                                        //if match was found add this entry
                                                                        result.push(json[i]);
                                                                    } else { 
                                                                        //console.log("no match for STR: " + str + " filter_criteria.keywords[k]: " + filter_criteria.types[r] ); 
                                                                    }

                                                                }
                                                            }

                                                            if ( filter_criteria.types[c] === "Misc" ) { 

                                                                //console.log( "Misc!" );

                                                                if ( json[i].entryType === "misc" ) {

                                                                    //console.log( "really a misc!" );

                                                                    //fetch keyword from json
                                                                    str = json[i].entryTags.author;
                                                                    //str = words_displayed[i].tex

                                                                    str = str.replace(/[^\w\s\-]/gi, ''); //remove all special chars and whitespaces except the . and -
                                                                    
                                                                    //start every word with upper case
                                                                    str = to_title_case( str );

                                                                    //console.log( "str: " + str );

                                                                    //lookup if filtered word match in the keywords of this entry
                                                                    n = str.search( searched_word ); //if not contained n = -1 else it retruns the index

                                                                    if ( n !== (-1) ) {
                                                                        //if match was found add this entry
                                                                        result.push(json[i]);
                                                                    } else { 
                                                                        //console.log("no match for STR: " + str + " filter_criteria.keywords[k]: " + filter_criteria.types[r] ); 
                                                                    }

                                                                }
                                                            }

                                                        } else { 
                                                            //console.log("no match for STR: " + str + " filter_criteria.keywords[k]: " + filter_criteria.keywords[k] ); 
                                                        }
                                                   // }

                                                    } else { 
                                                        //console.log("no match for STR: " + str + " filter_criteria.keywords[k]: " + filter_criteria.keywords[k] ); 
                                                    }
                                                } 

                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }   
                }


                console.log( "length of filterd_json: " + result.length );
                //console.log( "result: " )
                //console.dir( result );
                return { entries: result };
            }

            //function that capitalize fist letters of each word in the given string
            //returns string
            //source: http://stackoverflow.com/questions/4878756/javascript-how-to-capitalize-first-letter-of-each-word-like-a-2-word-city
            var to_title_case = function (str) {
                //console.log( "to_title_case: str: " + str );
                return str.replace(/\w\S*/g, function(txt) {
                                                    //console.log( "txt.charAt(0): " + txt.charAt(0) );
                                                    //console.log( "txt.substr(1): " + txt.substr(1) );
                                                    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                                                }
                                        );
            }

            //fetch all keywords of the given object and count their occuance 
            //returns a new object with elements. Each element has 
            //a text (no longer than 30 characters)
            //a size (occurence) and 
            //a long_size (the whole text) property.
            var get_words = function ( json ) {
                //console.log( "get_words aufgerufen" );
                var all_words = [];
                var all_words_str;
                var all_words_single;
                var all_words_single_upperCase = [];
                //var all_words_trimed = [];
                var result = [];
                //var item;
                var count = 1;
                var current, next;
                var short_text, long_text
                var word;

                //fetch all words from json
                all_words = collect_key_in_entryTags( { json: json, key: "keywords", value: "" } ).values;
                //console.dir( all_words );
                
                all_words_str = all_words.toString();

                //cleanup commas - only needed if the split will take place at any whitespace
                //all_words_str = all_words_str.replace (/,/g, "");
                
                //only needed if the split will take place at any whitespace
                //all_words_str = all_words_str.replace (/,|\[|\]|\(|\)/g, "");

                all_words_str = all_words_str.replace (/_/g, " ");

                //split string at every whitspace
                all_words_single = all_words_str.split( "," );
                //console.dir( all_words_single );

                for (var y = 0; y < all_words_single.length; y++) {   
                    //change all words to start with upper case and trim them
                    word = to_title_case( $.trim( all_words_single[y] ) );
                    word = word.replace(/[^\w\s\-]/gi, ''); //remove all special chars and whitespaces except the  -
                    all_words_single_upperCase.push( word );
                    //all_words_single_upperCase.push( to_title_case( $.trim( all_words_single[y] ) ) );
                }             
                
                //sort the array ignoring upper and lower case
                all_words_single_upperCase.sort(
                    function(a, b) {
                        var a_lowerCase = a.toLowerCase();
                        var b_lowerCase = b.toLowerCase();

                        if (a_lowerCase < b_lowerCase) return -1;
                        if (a_lowerCase > b_lowerCase) return 1;

                        return 0;
                    }
                );
                //console.dir( all_words_single_upperCase );



                //compare words and count their occurance
                for (var i = 0; i < all_words_single_upperCase.length; i++) {
                    //all words have to start with upper case 
                    //current = to_title_case( all_words_single[i] );
                    current = all_words_single_upperCase[i];
                    long_text = all_words_single_upperCase[i];
                    
                    if ( i < all_words_single_upperCase.length-1 ) { 
                        //next = to_title_case( all_words_single[( i + 1 )] );
                        next = all_words_single_upperCase[( i + 1 )];
                    } else {
                        next = "";  
                    } 
                                     

                    if ( current === next ){ 
                        
                        count += 1;
                        //console.log( "current: " + current + " next: " + next + " count: "+ count); 
                        
                    } 
                     else {

                        if ( current.length > 30 ){ 

                            //console.log( "bin zu lang: " + current );
                            short_text = current.substring( 0, 30 ) + "..." ;
                            //console.log( "shortText: " + shor_text );
                            long_text = current;
                            current = short_text;

                        } 

                        //console.log( "PUSH: current: " + current + " count: "+ count);
                        result.push( {text: current, size: count, long_text: long_text} );
                        //console.dir( result );
                        count = 1;
                    }
                    
                }
                //console.log( "get_words result.length: " + result.length );
                //console.log( "result" );
                //console.dir( result );  
                return{ words: result };             
            }

            //reduce the length of the given object
            //lookup the size of the element at the given optimum length. Count up till the size change
            //if the size changes before the absolut max value is reached the object will be cut
            //if the maximum size is exceeded and the size of the ojects hasn't changed the function will
            //go back to the optimum object and count down till the size of the object changes and then cut
            //@params.words = json
            //@params.optimum_size = number
            //@params.min = absolut minimum
            var limit_words = function ( params ) {
                var words = params.words;
                var optimum_length = params.optimum_size;
                var min = params.min;
                var absolut_max = 40;
                var optimum_size;
                var new_length;
                var number_to_remove;

                //sort the array descend according to the size of the elements
                words.sort( function ( a, b ) {
                    //console.log( "a[1]: " + a[1] ); 
                    return b.size - a.size;
                });

                //console.dir( words );
                //console.log( "words.length: " + words.length );
                //console.log( "optimum_length: " + optimum_length );

                //check if the length of the given array exceeds the given optimum size
                if (words.length >= optimum_length) {
                    optimum_size = words[optimum_length].size;
                    //console.log( "optimum_size: " + optimum_size );
                    //console.log( "optimum_text: " + words[optimum_length].text );

                    //look downward if to the element where the size get smaller
                    for ( var i = optimum_length; i >= 0; i-- ) {

                        if ( optimum_size < words[i].size ){ 
                            //console.log( "optimum_size: " + optimum_size + " words[i].size: " + words[i].size);
                            //remember the new length
                            new_length = i;

                            //check if the new length is not lower than the given minimum length
                            if ( new_length < min ){
                                //console.log( "new length lower than given minimum" );

                                for ( var i = optimum_length; i < words.length; i++ ) {
                                    
                                    //check at which element the size grows
                                    if ( optimum_size > words[i].size ){ 

                                        //take care the size don't get bigger than the absolut maximum size
                                        if ( i < absolut_max ) { 

                                            //console.log( "size of element smaller, new length: " + i );
                                            new_length = i;
                                            break;

                                        } else {
                                            //console.log( "absolut max exceeded" );
                                        }

                                    } else {
                                        //console.log( "optimum size not changed" );
                                    }
                                }    
                            } else { 
                                //console.log( "size of elements grow, new length: " + new_length )
                                number_to_remove = words.length - new_length ;
                                //console.log( "remove: " + remove );
                                words.splice( (new_length), number_to_remove);
                                break;
                            }
                        }
                    }
                }

                //console.log( "words from limit function:" );
                //console.dir( words );

                return words;
            }

            //fetch all authors of the given object and count their occuance 
            //returns a new object with elements. Each element has 
            //a text ( last name of author )
            //a size (occurence) and 
            //a first_name ( first name of the author ) property.
            var get_authors = function ( json ) {
                //console.log( "CALL: get_authors" );
                var all_authors;
                var all_authors_str;
                var all_authors_split;
                var all_authors_split_str;
                var all_authors_single;
                var str, n;
                var result = [];//{ text:[], size:[], first_name:[] };
                var first_name, last_name;
                var next, current;
                var count = 1;
                var final_result = [];

                //fetch all words from json
                all_authors = collect_key_in_entryTags( { json: json, key: "author", value: "" } ).values;
                //console.dir( all_authors );

                all_authors_str = all_authors.toString();
                //console.log( all_authors_str );

                //split string at every whitspace
                all_authors_split = all_authors_str.split( " and " );
                //console.dir( all_authors_split );

                all_authors_split_str = all_authors_split.toString();

                //split at comma only if there is no whitespace before or after the comma
                all_authors_single = all_authors_split_str.split( /,(?!\s)/ );

                //the last name is before the comma
                for ( var i = 0; i < all_authors_single.length; i++ ){ 
                    
                    str = all_authors_single[i];
                    n = str.search( "," ); //n = -1 if there is no comma

                    if ( n === (-1) ) { //no comma found
                        //console.log( "no comma found" );
                        
                        //console.log( "str: " + str );

                        first_name = $.trim( str.substr( 0, str.indexOf(' ') ) );
                        //console.log( "first_name: " + first_name );
                        
                        last_name = $.trim(str.substr( str.indexOf(' ') ) );
                        //console.log( "last_name: " + last_name );
                        result.push( {text: last_name, first_name: first_name} );

                    } else { //comma found
                        //console.log( "comma found" );

                        //console.log( "str: " + str );

                        last_name = $.trim(str.substr( 0, str.indexOf(',') ) );
                        //console.log( "last_name: " + last_name );

                        first_name = str.substr( str.indexOf(',') );
                        first_name = first_name.replace (/,/g, "");
                        first_name = $.trim( first_name );
                        //console.log( "first_name: " + first_name );

                        result.push( {text: last_name, first_name: first_name} );

                    }
                }

                //sort the array by the last name
                result.sort( function ( a, b) {
                    if (a.text < b.text)
                        return -1;
                    if (a.text > b.text)
                        return 1;
                    return 0;
                } )

                //console.dir( result );

                //comapre words and count their occurance
                for (var x = 0; x < result.length; x++) {
                    //all words have to start with upper case 
                    //current = to_title_case( all_words_single[i] );
                    current = result[x].text;
                    
                    if ( x < result.length-1 ) { 
                        //next = to_title_case( all_words_single[( i + 1 )] );
                        next = result[( x + 1 )].text;
                    } else {
                        next = "";  
                    } 
                    //console.log( "current: " + current + " next: " + next + " count: "+ count);

                    if ( current === next ){ 
                        
                        count += 1;
                        //console.log( "current: " + current + " next: " + next + " count: "+ count); 
                        
                    } else {

                            //console.log( "PUSH: current: " + current + " count: "+ count);
                            //result.push( {text: current, size: count, long_text: long_text} );
                            //result[x].size.push({size:count});
                            result[x].size = count;
                            final_result.push( {text: result[x].text, size: count, first_name: result[x].first_name} );
                            //console.dir( result );
                            count = 1;
                    }
                }

                //sort the array by the size
                final_result.sort( function ( a, b ) {
                    //console.log( "a[1]: " + a[1] ); 
                    return b.size - a.size;
                });
                //console.dir( final_result );
                return{ authors: final_result };
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
                var point_1 = "", point_2 = "", point_3 = "";
                var logo_div_width = (width - button_width - 11);
                var home_link = "http://www.w3schools.com"; //will be replaced with our 'about page'

                var logo = d3.select( "#header" )
                                .append("g")
                                .attr( "id", "logo_div" )


                var logo_div = logo.append( "rect" )
                                    .attr({
                                            x: 0, 
                                            y: 0, 
                                            width: logo_div_width,//(width - button_width - 11),//509,
                                            height: 30,
                                            fill: "#333333",
                                            id: "div_logo"
                                    })

                var txt_logo = d3.select( "#header" )
                                .append("g")
                                .attr( "id", "txt_logo" ) 
                                


                var text_bold = txt_logo.append("a")
                                    .attr("xlink:href", home_link)
                                    .append( "text" )
                                    .text( "PUB" )
                                    .attr({
                                            x: 35, 
                                            y: 23, 
                                            width: 509,
                                            height: 30,
                                            fill: "#333333",
                                            id: "text_bold",
                                            fill: "#f5f5f5",
                                            "text-anchor": "start",
                                            "font-weight": "bold"

                                    })
                                    .style("font-size", "22px")


                var text_regular = txt_logo.append("a")
                                    .attr("xlink:href", home_link)
                                    .append( "text" )
                                    .text( "VIZ" )
                                    .attr({
                                            x: 81, 
                                            y: 23, 
                                            width: 509,
                                            height: 30,
                                            fill: "#333333",
                                            id: "text_regular",
                                            fill: "#f5f5f5",
                                            "text-anchor": "start",
                                            "font-weight": "lighter"

                                    })
                                    .style("font-size", "22px")


                txt_logo.on( "mouseover", function() {
                            //console.log( "mouseover About" );
                            d3.select("#text_regular").style("text-decoration", "underline");
                            d3.select("#text_bold").style("text-decoration", "underline");
                            d3.select(this).style("cursor", "pointer");
                        })
                        .on( "mouseout", function() {
                            //console.log( "mouseover out About" );
                            d3.select("#text_regular").style("text-decoration", "none");
                            d3.select("#text_bold").style("text-decoration", "none");
                        })
                        .append("title") //show text on hover
                        .text( "go to PubVIZ website" )



                var about = logo.append("a")
                                    .attr("xlink:href", home_link)
                                    .append( "text" )
                                    .text( "About PubVIZ" )
                                    .attr({
                                            x: logo_div_width - 20, 
                                            y: 20, 
                                            id: "txt_about",
                                            fill: "#f5f5f5",
                                            "text-anchor": "end",
                                            "font-weight": "lighter"

                                    })
                                    .style("font-size", "11px")
                                    .on( "mouseover", function() {
                                        //console.log( "mouseover About" );
                                        d3.select(this).style("cursor", "pointer");
                                        d3.select("#txt_about").style("text-decoration", "underline");
                                    })
                                    .on( "mouseout", function() {
                                        //console.log( "mouseover out About" );
                                        //d3.select(this).style("cursor", "pointer");
                                        d3.select("#txt_about").style("text-decoration", "none");
                                    })
                                    .append("title") //show text on hover
                                    .text( "go to PubVIZ website" )

                
                //show warn-triangle only if error occured
                if ( error_text !== "" ){ 

                    point_1 = logo_div_width - 120;
                    point_2 = point_1 + 10;
                    point_3 = point_2 + 10;


                    var warining = d3.select( "#header" )
                                    .append("g")
                                    .attr( "id", "warning_sign" )
                                    

                    var polygon = warining.append( "polygon" )
                                            .attr({
                                                points: point_1 + ",22 "+ " " + point_2 + ",9 "+ " " + point_3 + ",22 ",
                                                fill: selection_color,
                                            })
                                            
                                            


                    var call_sign = warining.append( "text" )
                                        .text( "!" )
                                        .attr({
                                                x: point_2, 
                                                y: 21, 
                                                fill: "#333333",
                                                id: "call_sign",
                                                "text-anchor": "middle",
                                                "font-weight": "600"

                                        })
                                        .style("font-size", "12px")


                    warining.on("click", function() {
                                                //alert( error_text );
                                                console.log( "clicked!" );

                                                if ($("#error_text").length > 0){
                                                    show('error_text', true);
                                                } else { 

                                                    $( target ).append( "<div id='error_text'> " + error_text + " </div>" );
                                                    $( '#error_text' ).append( '<input id="btn_cancel" type="button" value="Quit"/>' );
                                                    $( '#btn_cancel' ).on('click', function(){ show('error_text', false); })
                                                }

                                            })
                                            .on( "mouseover", function() {
                                                //console.log( "mouseover bar_subset_group" );
                                                d3.select(this).style("cursor", "pointer");
                                            })
                                            .append("title") //show text on hover
                                            .text( "Warning: data errors. Click for more info" )
                }
                

                /*//old header  
                    var search = d3.select( "#header" )
                                    .append("g")
                                    .attr( "id", "search_div" );

                    var search_div = search.append( "rect" )
                                        .attr({
                                                x: 514, 
                                                y: 0, 
                                                width: (width/2 - button_width - 11),//480,
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
                */
            }

        //***************************CLEAR ALL******************************//

            var CLEAR_ALL = function(){
                //var empty = [];
                var btn_clearAll;
                var clearAll;
                var btn_text

                btn_clearAll = d3.select( "#clearAll" )
                                .append("g")
                                .attr( "id", "btn_clearAll" )
                                .on("click", function( d, i ) {
                                    //console.log( "clearAll" );
                                    //console.dir( selected_items );
                                    clearAll_pushed = true;
                                    selected_items = { years: [], types: [], keywords: [], authors:[] };
                                    update_views({ changed_data: empty });
                                    remove_highlight_selection_items_years();
                                    remove_highlight_selection_items_types();
                                    remove_highlight_selection_items_keywords();
                                    remove_highlight_selection_items_authors();

                                }).on("mouseover", function() {
                                        d3.select("#btn_clearAll_line").attr( "stroke", selection_color );
                                        d3.select(this).style("cursor", "pointer");

                                }).on("mouseout", function() {
                                        d3.select("#btn_clearAll_line").attr( "stroke", "#333333" );

                                }).on("mousedown", function() {
                                        d3.select("#txt_clearAll").attr( "fill", selection_color );
                                }).on("mouseup", function() {
                                        d3.select("#txt_clearAll").attr( "fill", "#f5f5f5" );
                                });

                                

                clearAll = btn_clearAll.append ( "rect" )
                                        .attr({
                                            x: 0, 
                                            y: 0, 
                                            width: button_width,
                                            height: button_height,
                                            fill: "#333333",
                                            id: "clearAll_div"
                                    });

                var lines = btn_clearAll.append( "line" )
                                    .attr({
                                        x1: 0,
                                        y1: 0,
                                        x2: 0,
                                        y2: button_height,
                                        id: "btn_clearAll_line",
                                        "shape-rendering": "crispEdges",
                                        "stroke": "#333333",
                                        "stroke-width": "5"
                                    });


                btn_text = btn_clearAll.append( "text" )
                                    .text( "ClearAll" )
                                    .attr({
                                            x: 20, 
                                            y: 20, 
                                            id: "txt_clearAll",
                                            fill: "#f5f5f5",
                                            "text-anchor": "start",
                                            "font-weight": "lighter"

                                    });

            }

        //***************************OVERVIEW******************************//
            var CHART = function () {
                //@param.view_height = number, gives the height of the availabel space; margins will be subtracted
                //@param.list_of_margins = eg. margin = {top: 20, right: 30, bottom: 20, left: 10}
                var create_bar_chart = function ( params ){ 
                    //console.log( "start create_bar_cart" );
                    //*** declare vars
                    var chart = {};
                    var view_width, view_height = 0;
                    var group, groupH, groupW;
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
                    groupH = view_height - margin.top - margin.bottom;
                    groupW =  view_width - margin.left - margin.right;
                    //console.log( "groupH: " + groupH );

                    //public functions
                    //*** create group append it to the overview
                    chart.set_svg_group = function ( params ) { 
                        var id = params.id;
                        var transform_xPos = params.transform_xPos;
                        var transform_yPos = params.transform_yPos;

                        group = d3.select( "#overview" )
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

                    chart.get_group = function() { return group };
                    chart.get_groupH = function() { return groupH };
                    chart.get_groupW = function() { return groupW };
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
                    var label_width, label_height;

                    var data_years_all = params.data_years_all; 
                    var data_amount_all = params.data_amount_all;  
                    var color_background_div = params.color_background_div;           
                    
                    var new_bar_years = CHART.create_bar_chart( params );
                    
                    new_bar_years.set_svg_group({ id:"chart", 
                                            transform_xPos: new_bar_years.get_margins().left, 
                                            transform_yPos: (new_bar_years.get_margins().top + 30) //because it don't includes the space between header and overview
                                          });            
                    var svg = new_bar_years.get_group();
                    var svgH = new_bar_years.get_groupH();
                    var svgW = new_bar_years.get_groupW();  
                    var get_current_displayed_years;
                    var count_clicks = 0;             
                    
                    var label_space = 19;
                    var max_number_of_bars = 30;
                    var steps = 5;
                    var overlap = 0.5 //percent how much the background div should extend the lable-width
                    var tooltip_subset_height;
                    var hoovered_year;
                    var ids;

                    //check if number of years contained in the data, extend the number of planed bars that will be shown
                    if ( data_years_all.length > max_number_of_bars ) { 
                        
                        overlap = 0.2;  
                        //claculate the number of needed periods that have to be slidable
                        number_of_periods = Math.floor( ( (data_years_all.length - 1) - max_number_of_bars ) / steps ); 

                        data_amount = set_data_period( data_amount_all, 0, steps, max_number_of_bars, number_of_periods);
                        data_years = set_data_period( data_years_all, 0, steps, max_number_of_bars, number_of_periods);
                        current_timeline = data_years;
                        //console.dir( data_years );

                    } else {

                        data_amount = data_amount_all;
                        data_years = data_years_all;
                        current_timeline = data_years;
                            
                    }

                    new_bar_years.set_scale( data_amount, svgH, svgW, 0.2 ); 
                    xScale = new_bar_years.get_oridinal_scale();
                    yScale = new_bar_years.get_linear_scale();
                    

                    //create group for bars
                    bar_group = svg.append( "g" )
                                   .attr( "class", "bar_group" ) 
                                   .on( "mouseover", function() {
                                        //console.log( "mouseover bar_subset_group" );
                                        d3.select(this).style("cursor", "pointer");
                                    });

                    var bar_highlight = svg.append( "g" )
                                            .attr( "class", "bar_subset_group" ) 
                                            .on( "mouseover", function() {
                                                //console.log( "mouseover bar_subset_group" );
                                                //element.style.cursor = "pointer";
                                                //$('#selector').css('cursor', 'pointer');
                                                d3.select(this).style("cursor", "pointer");
                                            });

                    //create group for labels years and move y to the bottom of the chart-svg
                    label_group = svg.append( "g" )
                                    .attr( "class", "label_group" ) 
                                    .attr("transform", "translate(0," + (svgH) + ")")
                                    .on( "mouseover", function() {
                                        //console.log( "mouseover bar_subset_group" );
                                        d3.select(this).style("cursor", "pointer");
                                    });

                    btn_group = svg.append( "g" )
                                    .attr( "class", "btn_group" ) 
                                    .attr("transform", "translate(-5," + svgH + ")")
                                    .on( "mouseover", function() {
                                        //console.log( "mouseover bar_subset_group" );
                                        d3.select(this).style("cursor", "pointer");
                                    });

                    var label_height = get_width_of_text_element({ svg: svg, group: label_group, data: dataset_years }).height;

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
                                        //class: "bar",
                                        class: function( d,i ) { return "bar " + data_years[i]; },
                                        id: function( d,i ) { 
                                            return "bar_" + data_years[i]; }
                                    }) 
                                    .on( "click", function( d, j ) {
                                        //console.log( "CLICK: create_bars" );
                                        
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
                                    })
                                    .on("mouseover", function( d, i ) {
                                        //console.log( "mouseover create_bar" );

                                        hoovered_year = data_years[ i ].toString();

                                        tooltip_change_visibility( hoovered_year, true );

                                    })
                                    .on("mouseout", function( d, i ) {
                                        //console.log( "mouseoverout create_bar" );

                                        hoovered_year = data_years[ i ].toString();
                                        ids = get_tooltip_ids( hoovered_year).ids;

                                        if ( d3.select(ids[0]).attr( "class") !== "permanent" ){
                                            //console.log( "class is not permanent" );
                                            tooltip_change_visibility( hoovered_year, false );
                                        }else{
                                            //console.log( "class is permanent" );
                                            tooltip_change_visibility( hoovered_year, true );
                                        }

                                    });                                         
                    }; 

                    var create_tooltip = function(){
                        //console.log("tooltip aufgerufen");
                        var distance_to_bar = 3;
                        var selected_dataset = [];
                        
                        tooltip_subset_height = get_width_of_text_element({ svg: svg, group: bar_group, data: data_amount }).height;
                        //console.log( "tooltip_subset_height: " + tooltip_subset_height );
                        
                        var  tooltips = bar_group.selectAll( "text" )
                                        .data( data_amount )
                                        .enter()
                                        .append( "text" )
                                        .text ( function( d ) { return d; } )
                                        .attr({
                                            x: function( d, i ){ return xScale( i ) + (xScale.rangeBand()/2)},
                                            y: function( d ){ return svgH - yScale( d ) - label_space - tooltip_subset_height - distance_to_bar; }, //3 space between bar and label
                                            fill: "black",
                                            opacity: 0,
                                            "font-weight": "normal",
                                            id: function( d,i ) { return "tooltip_normal_" + data_years[i]; },
                                            "text-anchor": "end"
                                        })

                        //if no data is selected we need an array which contains 0 for each selected data 
                        for( var i = 0; i < dataset_amount.length; i++ ){
                            selected_dataset.push(0);
                        }

                        var  tooltips_subset = bar_highlight.selectAll( "text" )
                                        .data( data_amount )
                                        .enter()
                                        .append( "text" )
                                        .text ( function( d,i ) { return selected_dataset[i]; } )
                                        .attr({
                                            x: function( d, i ){ return xScale( i ) + (xScale.rangeBand()/2)},
                                            y: function( d ){ return svgH - yScale( d ) - label_space - distance_to_bar; }, //3 space between bar and label
                                            fill: "black",
                                            opacity: 0,
                                            id: function( d,i ) { return "tooltip_subset_" + data_years[i]; },
                                            "font-weight": "bold",
                                            "text-anchor": "end"
                                        })
                    }

                    var update_tooltip = function( params ){
                        //console.log("update tooltip aufgerufen");
                        var data_amount = params.data_amount;
                        var dataset_years = params.data_years;
                        var selected_dataset = params.selected_dataset;
                        var distance_to_bar = 3;

                        var tooltips = bar_group.selectAll( "text" )
                                        .data( data_amount )
                                        .text ( function( d ) { return d; } )
                                        .attr({
                                            x: function( d, i ){ return xScale( i ) + (xScale.rangeBand()/2)},
                                            y: function( d ){ return svgH - yScale( d ) - label_space - tooltip_subset_height - distance_to_bar; }, //3 space between bar and label
                                            fill: "black",
                                            opacity: 0,
                                            id: function( d,i ) { return "tooltip_normal_" + dataset_years[i]; },
                                            "font-weight": "normal",
                                            class: "tooltip_normal",
                                            "text-anchor": "end"
                                        })

                        if ( selected_dataset === undefined ){
                            //console.log( "selected_dataset undefined" );
                            selected_dataset = [];
                            for( var i = 0; i < data_amount.length; i++ ){
                                selected_dataset.push(0);
                            }
                        }

                        var  tooltips_subset = bar_highlight.selectAll( "text" )
                                        .data( data_amount )
                                        .text ( function( d,i ) { return selected_dataset[i]; } )
                                        .attr({
                                            x: function( d, i ){ return xScale( i ) + (xScale.rangeBand()/2)},
                                            y: function( d ){ return svgH - yScale( d ) - label_space - distance_to_bar; }, //3 space between bar and label
                                            fill: "black",
                                            opacity: 0,
                                            id: function( d,i ) { return "tooltip_subset_" + dataset_years[i]; },
                                            "font-weight": "bold",
                                            class: "tooltip_subset",
                                            "text-anchor": "end"
                                        })
                    }

                    var update_bars = function ( dataset_amount, dataset_years ){
                            //console.log( "update_bars aufgerufen" );
                            
                            update_tooltip({ data_amount: dataset_amount, data_years: dataset_years });

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
                                        //console.log( "CLICK: update_bars" );

                                        item_value = data_years[ j ].toString();
                                        item_key = "years";


                                        if ( item_already_selected( { array: selected_items, list: item_key, value: item_value} ) ) {
                                             
                                             remove_selected_item( { value: item_value, key: item_key} ); 
                                        } else {
                                            
                                            add_selected_item( { value: item_value, key: item_key} );

                                        }
                                    
                                    })
                                    .on("mouseover", function( d, i ) {
                                        //console.log( "mouseover update_bars" );

                                        hoovered_year = data_years[ i ].toString();
                                        tooltip_change_visibility( hoovered_year, true );

                                    })
                                    .on("mouseout", function( d, i ) {
                                        //console.log( "mouseoverout update_bars" );

                                        hoovered_year = data_years[ i ].toString();
                                        ids = get_tooltip_ids( hoovered_year ).ids;

                                        if ( d3.select(ids[0]).attr( "class") !== "permanent" ){
                                            console.log( "class is permanent" );
                                            tooltip_change_visibility( hoovered_year, false );
                                        }else{
                                            console.log( "class is permanent" );
                                            tooltip_change_visibility( hoovered_year, true );
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
                                        class: function( d,i ) { return "bar subset " + data_years[i]; },
                                        id: function( d,i ) { 
                                            return "bar_subset" + data_years[i]; }
                                    }) 
                                    .on( "click", function( d, j ) {

                                        item_value = data_years[ j ].toString();
                                        item_key = "years";


                                        if ( item_already_selected( {array: selected_items, list: item_key, value: item_value} ) ) {
                                             //console.log( "arleady sel" );
                                             remove_selected_item( {value: item_value, key: item_key} ); 

                                        } else {
                                            
                                            add_selected_item( {value: item_value, key: item_key} );


                                        } 
                                    })
                                    .on("mouseover", function( d, i ) {
                                        //console.log( "mouseover: create_bars_subset" );

                                        hoovered_year = data_years[ i ].toString();
                                        tooltip_change_visibility( hoovered_year, true );

                                    })
                                    .on("mouseout", function( d, i ) {
                                        //console.log( "mouseoverOut: create_bars_subset" );

                                        hoovered_year = data_years[ i ].toString();
                                        ids = get_tooltip_ids( hoovered_year ).ids;

                                        if ( d3.select(ids[0]).attr( "class") !== "permanent" ){
                                            //console.log( "class is not permanent" );
                                            tooltip_change_visibility( hoovered_year, false );
                                        }else{
                                            //console.log( "class is permanent" );
                                            tooltip_change_visibility( hoovered_year, true );
                                        }
                                    });                                        
                    };

                    new_bar_years.highlight_subset = function ( data_selected ) {
                        //console.log( "years: highlight_subset aufgerufen" );
                        
                        update_tooltip({ selected_dataset: data_selected, data_amount: data_amount, data_years: data_years });

                        bar = bar_highlight.selectAll( "rect" )
                                    .data( data_selected )
                                    .attr ({
                                        x: function( d, i ){ return xScale( i ) },
                                        y: function( d ){ return svgH - yScale( d ) - label_space; }, //subtract space for labels to have space for labels ;o)
                                        width: xScale.rangeBand(),
                                        height: function( d, i ) { 
                                                    ids = get_tooltip_ids( data_years[i] ).ids;
                                                    var item_label = "#label_year_" + data_years[ i ];
                                                    
                                                    if ( yScale( d ) > 0 ){
                                                        tooltip_change_visibility( data_years[i], true );
                                                        d3.select(ids[0]).attr( "class", "permanent" );
                                                        d3.select(ids[1]).attr( "class", "permanent" );
                                                        //d3.select( item_label ).style( "font-weight", "900" );
                                                        //console.log( "item_label fett: " + item_label );

                                                    }else{
                                                        d3.select(ids[0]).attr( "class", "" );
                                                        d3.select(ids[1]).attr( "class", "" );
                                                        //d3.select( item_label ).style( "font-weight", "300" );
                                                        //console.log( "item_label nicht fett: " + item_label );
                                                    }
                                                    return yScale( d ); 
                                                },
                                        fill: highligth_color, //selection_color,
                                        

                                        opacity: 1,
                                        class: function( d,i ) { return "bar subset highlight " + data_years[i]; },
                                        id: function( d,i ) { 
                                            return "bar_subset" + data_years[i]; }
                                    }) 
                                    .on( "click", function( d, j ) {
                                        //console.log( "CLICK: highlight_subset_bar" );
                                        
                                        item_value = data_years[ j ].toString();
                                        item_key = "years";
                                        //var item_label = "#label_year_" + data_years[ j ].toString();

                                        if ( item_already_selected( {array: selected_items, list: item_key, value: item_value} ) ) {
                                             
                                             remove_selected_item( {value: item_value, key: item_key} );
                                             tooltip_change_visibility( item_value, false ); 
                                        } else {
                                            
                                            add_selected_item( {value: item_value, key: item_key} );  
                                            tooltip_change_visibility( item_value, true );                                    
                                        }                                       
                                    })             
                    };

                    var create_background_divs = function () {
                        //console.log( "create_background_divs" );
                        var background_div;

                        label_width = get_width_of_text_element({ svg: svg, group: label_group, data: data_years }).width;
                        label_height = get_width_of_text_element({ svg: svg, group: label_group, data: data_years }).height;


                        background_div = label_group.selectAll( "rect" )
                                        .data( data_years )
                                        .enter()
                                        .append( "rect" )
                                        .text ( function( d ) { return d; } )
                                        .attr({
                                            x: function( d, i ){ return xScale( i ) - ( (label_width * overlap / 2) ) },
                                            y: 0 - label_height-4,  
                                            id: function( d, i ){ return "background_div_" + d },
                                            width: xScale.rangeBand() + ( label_width * overlap ), //label_width + ( label_width * overlap ),
                                            height: label_height ,
                                            fill: color_background_div
                                        })
                                        .on( "click", function( d, j ) {

                                        item_value = data_years[ j ].toString();
                                        item_key = "years";

                                        //add selected item to selectionArray
                                        if ( item_already_selected( {array: selected_items, list: item_key, value: item_value} ) ) {
                                             
                                             //console.log( "arleady sel" );
                                             remove_selected_item( {value: item_value, key: item_key} ); 
                                        } else {
                                            
                                            add_selected_item( {value: item_value, key: item_key} );

                                        }
                                        
                                     });  
                    };

                    var update_background_divs = function ( dataset_years ) {
                        //console.log( "update_background_divs" );
                        var background_div;

                        console.dir( dataset_years );

                        //label_width = //get_width_of_text_element({ svg: svg, group: label_group, data: dataset_years }).width;
                        //label_height = //get_width_of_text_element({ svg: svg, group: label_group, data: dataset_years }).height;

                        console.log( "label_width" + label_width );
                        console.log( "label_height" + label_height );

                        /*label_group.on( "click", function( d, j ) { 
                                        console.log( "click label_group" );
                                        console.log( "d3.select(this).attr('id'): " + d3.select(this).attr('class') );
                                        console.dir( d3.select(this) );
                                    })*/

                        background_div = label_group.selectAll( "rect" )
                                        .data( dataset_years )
                                        //.enter()
                                        //.append( "rect" )
                                        .text ( function( d ) { return d; } )
                                        .attr({
                                            x: function( d, i ){ console.log( "xxx: " + xScale( i ) - ( (label_width * overlap / 2) ) ); return xScale( i ) - ( (label_width * overlap / 2) ) },
                                            y: 0 - label_height-4,  
                                            id: function( d, i ){ return "background_div_" + d },
                                            width: xScale.rangeBand() + ( label_width * overlap ), //label_width + ( label_width * overlap ),
                                            height: label_height ,
                                            fill: color_background_div
                                        })
                                        .on( "click", function( d, j ) {

                                        item_value = dataset_years[ j ].toString();
                                        item_key = "years";

                                        //add selected item to selectionArray
                                        if ( item_already_selected( {array: selected_items, list: item_key, value: item_value} ) ) {
                                             
                                             //console.log( "arleady sel" );
                                             remove_selected_item( {value: item_value, key: item_key} ); 
                                        } else {
                                            
                                            add_selected_item( {value: item_value, key: item_key} );

                                        }
                                        
                                     });  
                    }; 

                    var create_labels = function () {
                        //console.log( "create_labels aufgerufen" );
                        var labels;
                        //var label_height = get_width_of_text_element({ svg: svg, group: label_group, data: dataset_years }).height;
                        //console.log( "lable_height: " + label_height );
                        //create labels for years
                        labels = label_group.selectAll( "text" )
                                    .data( data_years )
                                    .enter()
                                    .append( "text" )
                                    .text ( function( d ) { return d; } )
                                    .attr({
                                        x: function( d, i ){ return xScale( i ) + (xScale.rangeBand()/2) },
                                        y: -label_height/2, 
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
                        //var label_height = get_width_of_text_element({ svg: svg, group: label_group, data: dataset_years }).height;
                        //create labels for years
                        labels = label_group.selectAll( "text" )
                                    .data( dataset_years )
                                    .text ( function( d ) { return d; } )
                                    .attr({
                                        x: function( d, i ){ return xScale( i ) + (xScale.rangeBand()/2) },
                                        y: -label_height/2, //cause of grouping and transform of the labels_group
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
                                        .attr("transform", "translate(-5," + (svgH-19) + ")");
               
                        
                        buttons_width = get_width_of_text_element({ svg: svg, group: btn_group, data: buttons_text }).width;
                        buttons_height = get_width_of_text_element({ svg: svg, group: btn_group, data: buttons_text }).height;

                        background_div = btn_group.selectAll( "rect" )
                                        .data( buttons_text )
                                        .enter()
                                        .append( "rect" )
                                        .text ( function( d ) { return d; } )
                                        .attr({
                                            x: function( d, i ){ return i * svgW }, //later to include the width of the button image
                                            y: 0,
                                            id: function( d, i ){ return d },
                                            width: buttons_width,
                                            height: label_height ,
                                            fill: color_background_div
                                        })


                        buttons = btn_group.selectAll( "text" )
                                    .data( buttons_text )
                                    .enter()
                                    .append( "text" )
                                    .text ( function( d ) { return d; } )
                                    .attr({
                                        x: function( d, i ){ return i * svgW }, //later to include the width of the button image
                                        y: label_height/1.25,
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
                                        update_background_divs( data_years );
                                        update_labels( data_years );
                                        
                                        update_tooltip({ data_amount: data_amount, data_years: data_years });

                                        timeline_changed = true;
                                        current_timeline = data_years;

                                        remove_highlight_selection_items_years();
                                        highlight_selection_items;

                                            
                                    }); 
                    };

                    new_bar_years.render = function () {
                        create_bars();
                        create_tooltip();
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
                    svg = new_bar_types.get_group();
                    svgH = new_bar_types.get_groupH();
                    svgW = new_bar_types.get_groupW();

                    //new_bar_years.set_scale( data_amount, svgH, svgW, 0.2 ); 
                    new_bar_types.set_scale( all_entry_types, (svgW/2), svgH, 0 ); 
                    xScale = new_bar_types.get_linear_scale();
                    yScale = new_bar_types.get_oridinal_scale();
                    text_color_for_types = new_bar_types.get_color_text();

                    //create svg-group
                    bar_group = svg.append( "g" )
                                    .attr( "class", "bar_group" ) 
                                    .on( "mouseover", function() {
                                        //console.log( "mouseover bar_group" );
                                        d3.select(this).style("cursor", "pointer");
                                    });

                    var bar_highlight = svg.append( "g" )
                                            .attr( "class", "bar_subset_group" ) 
                                            .on( "mouseover", function() {
                                                //console.log( "mouseover bar_subset_group" );
                                                d3.select(this).style("cursor", "pointer");
                                            });

                    //create group for labels years and move y to the bottom of the chart-svg
                    label_group = svg.append( "g" )
                                    .attr( "class", "label_group" ) 
                                    .on( "mouseover", function() {
                                        //console.log( "mouseover label_group" );
                                        d3.select(this).style("cursor", "pointer");
                                    });

                    data_label_group = svg.append( "g" )
                                        .attr( "class", "data_label_group" );

                    var data_lbl_subset_group = svg.append( "g" )
                                                    .attr( "class", "data_lbl_subset_group" );
                    
                    line_group = svg.append("g")
                                    .attr( "class", "line_group" );

                    label_height = get_width_of_text_element({ svg: svg, group: label_group, data: entry_types_text }).height;
                    //var bar_height = get_width_of_text_element({ svg: svg, group: bar_group, data: all_entry_types }).height;
                    //console.log( "bar_height: " + bar_height );

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
                        var type_lable_id, id;

                        bar = bar_highlight.selectAll( "rect" )
                                    .data( data_selected )
                                    .attr ({
                                        x: 0,
                                        y: function( d, i ){ return yScale( i ) },
                                        //width: function( d ){ return xScale( d ); },
                                        width: function( d, i ) { 
                                               /* needed if labels of matching typs should be bold
                                                type_label_id = generate_words_id({ text: entry_types_text[i], group: "type", element: "text" }).exist_id;
                                                
                                                if ( xScale( d ) > 0 ){
                                                    d3.select( type_label_id ).style( "font-weight", "900" );

                                                }else{
                                                    d3.select( type_label_id ).style( "font-weight", "300" );
                                                }*/
                                                return xScale( d ); 
                                            },
                                
                                        height: yScale.rangeBand(),
                                        fill: highligth_color, //selection_color,
                                        class: "bar_type_highlight",
                                        id: function( d,i ) { 
                                            id = generate_words_id({ text: entry_types_text[i], group: "type", element: "div" }).new_id;
                                            //console.log( "id: " + id );
                                            return id;
                                            //return "bar_type_highlight" + i; 
                                        }
                                    }) 
                                    .on( "click", function( d, i ) {

                                        item_value = entry_types_text[ i ].toString();
                                        item_key = "types";


                                        if ( item_already_selected( {array: selected_items, list: item_key, value: item_value} ) ) {
                                            
                                            //console.log( "arleady sel" );
                                            remove_selected_item( {value: item_value, key: item_key} ); 
                                        
                                        } else {
                                            
                                            add_selected_item( {value: item_value, key: item_key} );
                                        }
                                    }) 

                                    highlight_data_lbl_subset( data_selected );
                    }; 

                    var create_selection_divs = function () {
                        var selection_div, 
                        //var label_height;

                        //label_width = get_width_of_text_element({ svg: svg, group: label_group, data: entry_types_text }).width;
                        //label_height = get_width_of_text_element({ svg: svg, group: label_group, data: entry_types_text }).height;

                        selection_div = label_group.selectAll( "rect" )
                                        .data( entry_types_text )
                                        .enter()
                                        .append( "rect" )
                                        .text ( function( d ) { return d; } )
                                        .attr({
                                            y: function( d, i ){ return yScale( i ) + label_height +(label_height/2) * (-1)}, 
                                            x: function( d, i ){ return (d.length * 6 - distance_label_to_bars)* (-1) },  
                                            id: function( d, i ){ 
                                                    if ( d === "Part of a Book") { 
                                                        return "background_div_type_Part_of_a_Book"; 
                                                    } else {
                                                        return "background_div_type_" + d; 
                                                    }
                                                },
                                            width: function( d, i ){ return d.length*6 } ,//label_width,
                                            height: label_height ,
                                            fill: selection_color,
                                            opacity: 0
                                        })
                                        .on( "click", function( d, i ) {

                                            item_value = entry_types_text[ i ].toString();
                                            item_key = "types";


                                            if ( item_already_selected( {array: selected_items, list: item_key, value: item_value} ) ) {
                                                
                                                //console.log( "arleady sel" );
                                                remove_selected_item( {value: item_value, key: item_key} ); 
                                            
                                            } else {
                                                
                                                add_selected_item( {value: item_value, key: item_key} );
                                            }
                                         }); 
                    };

                    var create_labels = function () {
                        var labels, data_lbl, id;

                        labels = label_group.selectAll( "text" )
                                    .data( entry_types_text )
                                    .enter()
                                    .append( "text" )
                                    .text ( function( d ) { return d; } )
                                    .attr({
                                        y: function( d, i ){ return yScale( i ) + label_height +(label_height/3)}, 
                                        x: distance_label_to_bars, 
                                        fill: new_bar_types.get_color_text(),
                                        class: "label_type",
                                        "text-anchor": "end",
                                        id: function ( d, i ) { 
                                                id = generate_words_id({ text: d, group: "type", element: "text" }).new_id;
                                                //console.log( "id: " + id );
                                                return id;
                                                /*if ( d === "Part of a Book") { 
                                                    return "lbl_type_Part_of_a_Book"; 
                                                } else {
                                                    return "lbl_type_" + d; 
                                                }*/
                                            }
                                    })
                                    .on( "click", function( d, i ) {

                                        item_value = entry_types_text[ i ].toString();
                                        item_key = "types";


                                        if ( item_already_selected( {array: selected_items, list: item_key, value: item_value} ) ) {
                                            
                                            //console.log( "arleady sel" );
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
                                            y: function( d, i ){ return yScale( i ) + label_height +(label_height/3) }, 
                                            x: (svgW/2+label_space-6), 
                                            fill: new_bar_types.get_color_text(),
                                            class: "lbl_text_data",
                                            "text-anchor": "end"
                                        })
                    };

                    var create_data_lbl_subset = function(){
                        var data_lbl_subset = data_lbl_subset_group.selectAll( "text" )
                                        .data( all_entry_types )
                                        .enter()
                                        .append( "text" )
                                        .text ( function( d ) { return d; } )
                                        .attr({
                                            y: function( d, i ){ return yScale( i ) + label_height +(label_height/3)}, 
                                            x: (svgW/2 + (label_space/2)), 
                                            fill: "white",
                                            class: "lbl_text_data",
                                            "text-anchor": "end"
                                        })
                    }

                    var highlight_data_lbl_subset = function( data_selected ){
                        data_lbl_subset = data_lbl_subset_group.selectAll( "text" )
                                        .data( data_selected )
                                        .text ( function( d ) { return d; } )
                                        .attr({
                                            y: function( d, i ){ return yScale( i ) + label_height + (label_height/3)}, 
                                            x: (svgW/2 + (label_space/2)), 
                                            fill: new_bar_types.get_color_text(),
                                            "font-weight": "bold",
                                            class: "lbl_text_data_subset",
                                            "text-anchor": "end"
                                        })
                    }

                    var create_lines = function() {
                        var lines, vertical_line;

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
                                        "stroke": "#898989",
                                        "stroke-width": "0,3"
                                    })

                        vertical_line = line_group//.selectAll( "line" )
                                    //.data( all_entry_types )
                                    //.enter()
                                    .append( "line" )
                                    .attr({
                                        x1: 0,
                                        y1: 2,//function( d, i ){ return yScale( i ) + yScale.rangeBand() },
                                        x2: 0,
                                        y2: yScale.rangeBand() * entryTypes_grouped_text.length,//function( d, i ){ return yScale( i ) + yScale.rangeBand()},
                                        "class": "vertical_line",
                                        "shape-rendering": "crispEdges",
                                        "stroke": "#898989",
                                        "stroke-width": "0,3"
                                    })
                    };


                    new_bar_types.render = function () {
                            create_bars_total();
                            create_bars_subset();
                            create_data_lbl_subset();
                            create_selection_divs(); 
                            create_labels();
                            create_lines();
                    }
                    return new_bar_types;
                };


                return { create_bar_type: create_bar_type };
            }();

            var AMOUNT = function ( params ) {
                //console.log( "amount aufgerufen" );
                var amount;
                var total_nb = params.total;
                var selected_nb = params.selected;
                var margin = params.margin;
                var color_text = params.color_text;
                var text_size = params.text_size;
                var width = params.width;

                var xPos = width/2 - margin.left - (space_between_view) - 20; //20 because of the space for the types_labels
                //console.log( "xPos: " + xPos );

                var amount = d3.select( "#overview" )
                                .append("g")
                                .attr( "id", "amount" )
                                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                var total_amount = amount.append( "text" )
                                    //.text ( format_nb_total ) if zeros should be shown when the number has less than three digit
                                    .text ( total_nb )
                                    .attr({
                                            x: xPos,
                                            y: 125, 
                                            fill: color_text,
                                            "text-anchor": "start",
                                            "font-weight": "300",
                                            id: "lbl_total_amount"
                                    })
                                    .style("font-size", text_size)

                var slash = amount.append( "text" )
                                    //.text ( format_nb_total ) if zeros should be shown when the number has less than three digit
                                    .text ( " / " )
                                    .attr({
                                            x: (xPos + 13),
                                            y: 122, 
                                            fill: color_text,
                                            "text-anchor": "start",
                                            "font-weight": "300",
                                            opacity: 0,
                                            id: "lbl_slash_amount"
                                    })
                                    .style("font-size", text_size)


                var selected_amount = amount.append( "text" )
                                    .text ( selected_nb )
                                    .attr({
                                            x: xPos,
                                            y: 125,  
                                            fill: selection_color,//color_text, 
                                            "text-anchor": "end",
                                            "font-weight": "900",
                                            opacity: 0,
                                            id: "lbl_selected_amount"
                                    })
                                    .style("font-size", text_size)

                var update_selected_amount = function( params ) { 
                    var new_selected_nb = params.selected_new;
                    //var format_nb = zeroFilled = ('000' + new_selected_nb).substr(-3); will draw zeros if number has less than three digits
                    //new_selected_nb += " / ";
                   
                    if ( new_selected_nb === 0 ) {
                        d3.select("#lbl_selected_amount").attr("fill", color_text);
                    } else {
                        d3.select("#lbl_selected_amount").attr("fill", selection_color);
                    }
                    
                    d3.select("#lbl_total_amount").attr("x", (xPos + 50));
                    d3.select("#lbl_selected_amount").text(new_selected_nb);
                    d3.select("#lbl_selected_amount").attr("opacity", "1");
                    d3.select("#lbl_slash_amount").attr("opacity", "1");

                }
             
                return { update_selected_amount: update_selected_amount };               
            }   

        //*****************************CLOUDS******************************// 

            //@params.type = "keywords" or "authors" (only this two types are allowed!)
            var CLOUD = function ( params ) {
                //console.log( "cloud aufgerufen" );
                var type = params.type //to distinguish if a keyword was clicked or an author
                var wordcloud;
                //var size = [450, 340];
                var size = params.size;
                var fontSize = d3.scale.log().domain([params.words[(params.words.length-1)].size ,params.words[0].size])
                                             .range( [15, 50] )
                                             .clamp( true );
                var margin = 10;
                var update = false;

                var dataset_words = params.words;
                //console.dir( dataset_words );
                //console.log( "dataset_words[0].long_text: " + dataset_words[0].long_text );
                var xPos = params.xPos;
                var yPos = params.yPos;
                var id_name = type;
                var selection = params.selection;
                var color_text = params.color_text;

                if ( selection !== undefined ) {
                    update = true;
                }

                var cloud = d3.select( "#clouds" )
                                .append("g")
                                .attr( "id", id_name )
                                .attr("transform", "translate(" + (xPos + margin) + "," + (yPos + margin) + ")")
                                .attr("width", size[0])
                                .attr("height", size[1])
                                .append("g")
                                .attr("transform", "translate(" + (size[0]/2) + "," + (size[1]/2) + ")")
                                .on( "mouseover", function() {
                                        //console.log( "mouseover cloud" );
                                        d3.select(this).style("cursor", "pointer");
                                });
              
                if ( update === false) {
                    d3.layout.cloud()
                        .size(size)
                        .words( dataset_words )
                        .fontSize(function(d) { return fontSize( +d.size ); })
                        .rotate(function() { return ~~(Math.random() ) * 90; })                    
                        .on("end", draw)
                        .start();
                }

                function draw( words ) {
                    //console.log( "draw aufgerufen" );
                    var txt, id;
                    var iem_text, item_id;

                    //console.log( "words.length: " + words.length );
                    //console.dir( words );

                    if ( type === "keywords" ){

                        //console.log( "type of cloud = keywords" );
                        id_name = "keywords";
                        //save the list with all words that are really displayed
                        words_displayed = save_wordtext_and_wordid({ array: words, id:id_name });

                    } else if ( type === "authors" ){

                        //console.log( "type of cloud = authors" );
                        id_name = "authors";
                        //save the list with all words that are really displayed
                        authors_displayed = save_wordtext_and_wordid({ array: words, id:id_name });

                    } else {
                        console.log( "WARNING: type of cloud is not determined! Please add the params.key 'type' with the value-stirng if the cloud is for 'authors' or 'keywords' '" );
                    }

                    if ( !update ){
                        //console.log("its no update");
                        
                        selection_div = cloud.selectAll( "rect" )
                                        .data( words )
                                        .enter()
                                        .append( "rect" )
                                        .text ( function( d ) { return d; } )
                                        .attr("transform", function(d) {
                                                    var x,y
                                                    x = d.x;
                                                    y = d.y;
                                                    x = x - (d.width/2);
                                                    y = y - (d.height/2-6);
                                                    return "translate(" + [x, y] + ")rotate(" + d.rotate + ")";
                                            })
                                        .attr({  
                                            id: function( d ){ 
                                                    
                                                    txt = d.text;
                                                    id = generate_words_id({ text: txt, group: id_name, element: "div" }).new_id;
                                                    return id;
                                                },

                                            width: ( function( d ) { return d.width; } ) ,
                                            height: ( function( d ) { return d.height/2 + 3; } ) ,
                                            fill: selection_color,
                                            opacity: 0
                                        });

                        wordcloud = cloud.selectAll("text")
                                    .data( words )
                                    .enter()
                                    .append("text")
                                    .style("font-size", function(d) { return d.size + "px"; })
                                    .style("fill", color_text )
                                    .attr("text-anchor", "middle")
                                    .attr("id", function( d ){
                                        
                                        txt = d.text;
                                        id = generate_words_id({ text: txt, group: id_name, element: "text" }).new_id;
                                        return id;
                                    })
                                    .attr("transform", function(d) {
                                            return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                                    })
                                    .style("font-weight", "300")
                                    .text(function( d ) { return d.text; })
                                    .on("click", function( d ){
                                            //console.log( "call: clicked keyword" );

                                            item_value = generate_words_id({ text: d.text, group: id_name, element: "text" }).exist_id;                                          
                                            item_key = id_name;

                                            //console.log( "item_value: " + item_value );
                                            //console.log( "id_name: " + id_name );

                                            if ( item_already_selected( { array: selected_items, 
                                                                          list: item_key, 
                                                                          value: item_value} ) ) {

                                                 //console.log("before remove item");
                                                 remove_selected_item( {value: item_value, 
                                                                        key: item_key} ); 
                                            } else {
                                                //console.log("before add item");
                                                add_selected_item( {value: item_value, 
                                                                    key: item_key} );
                                            } 
                                               
                                    })
                                    .append("title") //show text on hover
                                    .text(function(d) {
                                        var text;

                                        for ( var i = 0; i < dataset_words.length; i++ ){ 
                                            
                                            if ( dataset_words[i].text === d.text ) { 
                                               
                                                if ( type === "keywords" ) { 
                                                    text = dataset_words[i].long_text + ", found: " + dataset_words[i].size + "x";
                                                    return text;
                                                }
                                               
                                                if ( type === "authors" ) { 
                                                    text = dataset_words[i].text + ", found: " + dataset_words[i].size + "x";
                                                    return text;
                                                }
                                            }
                                        }

                                    });                                  
                    }                   
                }
            }    

        //*****************************LIST******************************// 
            var LIST = function( params ) {
                var t;
                var y;
                var data = params.data;
                var update = params.update;
                //var update;
                //location
                if ( !update ){ 
                    $('#pubvis_container').append("<div id='list'><div id='sortdiv'><button class='btn' id='year'>Year</button><button class='btn' id='type'>Type</button></div><div id='s_acc'><div class='accordion'></div></div></div>");
                    generate(0);
                } else {
                    $('#list').replaceWith("<div id='list'><div id='sortdiv'><button class='btn' id='year'>Year</button><button class='btn' id='type'>Type</button></div><div id='s_acc'><div class='accordion'></div></div></div>");
                    generate(0);
                }

                $("#year").click(function() {
                    if(y) {
                        y = false;
                        $("#year").css({
                            "border-right": "5px solid #d9d9d9"
                        });
                        $(".accordion").html('');
                        generate(0);
                    } else {
                        y = true;
                        t = false;
                        $("#year").css({
                            "border-right": "5px solid #ffc200"
                        });
                        $("#type").css({
                            "border-right": "5px solid #d9d9d9"
                        });
                        $(".accordion").html('');
                        $(".accordion").css({"margin-top": "-20px"});
                        generate(1);
                    }
                    //console.log("year = " + y);
                    //console.log("type = " + t);
                });
                $("#type").click(function() {
                    if(t) {
                        t = false;
                        $("#type").css({
                            "border-right": "5px solid #d9d9d9"
                        });
                        $(".accordion").html('');
                        generate(0);
                    } else {
                        t = true;
                        y = false;
                        $("#type").css({
                            "border-right": "5px solid #ffc200"
                        });
                        $("#year").css({
                            "border-right": "5px solid #d9d9d9"
                        })
                        $(".accordion").html('');
                        $(".accordion").css({"margin-top": "-20px"});
                        generate(2);
                    }
                    //console.log("year = " + y);
                    //console.log("type = " + t);
                });

                function generate(sortBy) {

                    this.sortBy = sortBy;
                    //console.log(sortBy);

                    function subgenerate() {

                        var type;
                        var url;
                        var abs;
                        var title;
                        var author;
                        var notes;

                        if(data[j].list_authors != undefined) {
                            author = data[j].list_authors;
                            //console.log( "author: " + author );
                        } else {
                            author = "<i style='font-style: italic;'>Unknown Author</i>";
                        }

                        if(data[j].entryTags['title'] != undefined) {
                            title = "<span style='font-weight: bold;'>" + data[j].entryTags['title'] + "</span>";
                        } else {
                            title = '<i>Unknown Title</i>';
                        }
                        
                        if(data[j].entryTags['url'] != undefined) {
                            url = "     <a target='_blank' style='float: right;' href='" + data[j].entryTags['url'] + "'><svg version='1.1' baseProfile='basic' id='Ebene_1'xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' width='22px' height='22px' viewBox='0 0 22 22' xml:space='preserve' class='download'><g><g><path d='M11.31,5.236l-4.161,8.315l-4.16-8.315H11.31z'/></g><rect x='2.928' y='13.591' width='8.433' height='0.943'/></g></svg></a>";
                        } else {
                            url = '';
                        }

                        type = cap(data[j].entryType);

                        if (data[j].entryTags['notes'] != undefined){

                            notes = "<br>&nbsp" + data[j].entryTags['notes'];

                        }else{

                            notes = "";

                        }

                        $(".accordion").append("<h3>" + author + url + "<br>" + title + "<br>" + data[j].entryTags['year'] + ", " + type + "</h3>");

                        if(data[j].entryTags['abstract'] != undefined) {
                            abs = data[j].entryTags['abstract'];
                            $(".accordion").append("<div class='pane'>" + "<p style='text-align: justify;'>" + abs + "</p>" + "</div>");
                        } else {
                            abs = "";
                        }

                    }
                    var key, count = 0;

                    for(key in data) {
                        if(data.hasOwnProperty(key)) {
                            count++;
                        }
                    }

                    function cap(string) {
                        return string.charAt(0).toUpperCase() + string.slice(1);
                    }

                    if(sortBy == 0) {

                        for(var j = 0; j < count; j++) {
                            subgenerate();
                        }

                    } else if(sortBy == 1) {

                        var yeararr = new Array();;

                        for(var n = 0; n < count; n++) {

                            yeararr.push(data[n].entryTags['year']);

                        }
                        var uniqueYear = [];
                        $.each(yeararr, function(i, el) {
                            if($.inArray(el, uniqueYear) === -1) uniqueYear.push(el);
                        });
                        uniqueYear.sort(function(a, b) {
                            return b - a
                        });
                        //console.log(uniqueYear);

                        for(i = 0; i < uniqueYear.length; i++) {
                       
                            $(".accordion").append("<h1>" + uniqueYear[i] + "</h1>");
                            for(var j = 0; j < count; j++) {

                                if(uniqueYear[i] == data[j].entryTags['year']) {
                                    subgenerate();
                                }
                            }
                        }
                    } else if(sortBy == 2) {
                        var typearr = new Array();
                        for(var n = 0; n < count; n++) {
                            typearr.push(data[n].entryType);
                        }
                        var TypeArray = ["article", "book", "conference", "miscellaneous","part of book", "report", "thesis"];
                        for(i = 0; i < TypeArray.length; i++) {
                            $(".accordion").append("<h1>" + cap(TypeArray[i]) + "</h1>");
                            for(var j = 0; j < count; j++) {                
                                var entry = data[j].entryType;
                                if(TypeArray[i] == entry) {
                                    subgenerate();
                                }else if((TypeArray[i] == "book") && ((entry == "booklet") || (entry == "buch")) ){
                                    subgenerate();
                                }else if((TypeArray[i] == "conference") && ((entry == "inproceedings") || (entry == "proceedings")) ){
                                    subgenerate();
                                }else if((TypeArray[i] == "part of book") && ((entry == "inbook") || (entry == "incollection")) ){
                                    subgenerate();
                                }else if((TypeArray[i] == "report") && ((entry == "manual") || (entry == "techreport")) ){
                                    subgenerate();
                                }else if((TypeArray[i] == "thesis") && ((entry == "mastersthesis") || (entry == "phdthesis")) ){
                                    subgenerate();
                                }else if((TypeArray[i] == "miscellaneous") && (entry != "article") && (entry != "book") && (entry != "conference") && (entry != "part of book") && (entry != "report") && (entry != "thesis") &&((entry != "booklet") && (entry != "buch")) && ((entry != "inproceedings") && (entry != "proceedings")) && ((entry != "inbook") && (entry != "incollection")) && ((entry != "manual") && (entry != "techreport")) && ((entry != "mastersthesis") && (entry != "phdthesis"))){
                                    subgenerate();
                                }
                            }
                        }
                    }
                      //  Accordion Panels
                      $(".accordion div").show();
                      setTimeout("$('.accordion div').slideToggle('slow');", 1);
                      $(".accordion h3").click(function () {
                        $(this).next(".pane").slideToggle("slow").siblings(".pane:visible").slideUp("slow");
                        $(this).toggleClass("current");
                        $(this).siblings("h3").removeClass("current");
                      });
                }
            }

        //*****************************CALL**************************//
        

            calculate_width();
            
            //build html structure
            setup_layout();

            //display the view
            display_all_views();

           //window.onresize = update_window;
            //console.log( "parseInt(d3.select('#pubVis')...?: " + parseInt(d3.select('#pubVis').attr('width')) );
            
            
            //hide the loading-div after successfully loaded
            onReady(function () {
                show('loading', false);
                $( ".target" ).show();
            });





            $( "svg" ).click(function(event) {

                //console.log( "selected_items" );
                //console.dir( selected_items );

                //actions if sth was selected or the time period changed
                if ( selected_items_changed || timeline_changed ) { 
                    //console.log( "selected_items_changed || timeline_changed" );

                    clearAll_pushed = false;
                    
                    filtered_json = create_filtered_json({ filter_criteria: selected_items }).entries;

                    //highlight_selection_items();

                    update_views({ changed_data: filtered_json });

                    highlight_selection_items();

                    selected_items_changed = false;
                    timeline_changed = false;
                   
                
                } else {

                    clearAll_pushed = true;
                    selected_items = { years: [], types: [], keywords: [], authors: [] };
                    
                    remove_highlight_selection_items_years();
                    remove_highlight_selection_items_types();
                    remove_highlight_selection_items_keywords();
                    remove_highlight_selection_items_authors();

                    update_views({ changed_data: empty });
                }

            });   
    } 


    //@param.errors = list with entries that were not able to parst into a json
    var display_error = function ( errors ) {
        var text;
        //console.dir ( errors ); 
        //console.log("errors.errorEntry.length: " + errors.errorEntry.length);

        if( errors.errorEntry.length > 0 ) { 
            text = "<h1>DATA ERROR! </h1></br>The following " + errors.errorEntry.length + " listed entries of the file '" + filename + "' do not come up with the common bibTeX syntax and won't be contained in the PubVIZ visalization. </br></br> If you would like those entries to be contained, please correct the syntax in the '" + filename + "' and reload the page. </br></br>";

            for ( var i = 0; i < errors.errorEntry.length; i++ ){
                
                text += errors.errorEntry[i] + "</br>" + "</br>";
            }
        }else {
            text = ""
        }

        //console.log( "text:" + text ); 
        //alert( text );
        return { error_text: text };     
    }

    return { make_it_all : make_it_all };
} ();





