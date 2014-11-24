PUBVIS = function () {
    var make_it_all = function (params) {
        filename = params.filename;
        target = params.target;

        console.log ('filename: ' + filename); 
        console.log ('target: ' + target);

        fetch_bibfile ( filename );

       // var data = bib2json( fetch_bibfile( filename ) );       
       // display_data( data.KEYJSON ) ;
       // display_error( data.KEYERROR ) ;

        
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
               // console.log ( e );
            }

            //combine lists 
            bigJson = bigJson.concat (jsonFormat);

            //console.log ("entry #" + i + " added");
            //console.log ("3. entry content: " + jsonFormatString);
        };

        //console.dir( bigJson );
        console.log("ende Bib2Json");
        return { json: bigJson,
                 errors: errors }; 

    }

    var display_data = function ( json ) {

        //draw data
        //console.dir( json );

        //d3.select("body").style("background-color", "black");

        var get_years = function () {
            var all_years_distinct = [], all_years_double = [], amount_per_years = [], actual_year, time_span;
            var oldest_year;

            //@param.array = array
            //@param.value = string (example "year") 
            var count_value_in_array = function (array, value) {
                var counter = 0;
                console.log ("array.length: " + array.length );

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
                     amount_per_years: amount_per_years };
        }

        //lists all years counted from the oldest in the file.bib
        console.dir( get_years(json).time_list );

        //lists the amounts per year in the same order as the years are listed 
        //(obj[0] = amount of oldest year in bib.file)
        console.dir( get_years(json).amount_per_years );
    }


    var display_error = function ( errors ) {

        //draw errors
        console.dir ( errors ); 
    }

    return { make_it_all : make_it_all };
} ();