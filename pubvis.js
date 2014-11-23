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
        console.log("DataArr filled ");

        bigJson = [];
        errors = { index: [], errorMessage: [] };
        for (var i = 1 ; i <= dataArr.length-1; i++) {

            entry = dataArr[i].toString();
            entryAt = "@" + entry;
            //console.log("1. entryAt: " + entryAt);

            try {

                //pars bib-entry to JSON list with one object
                jsonFormat = bibtexParse.toJSON( entryAt );
                //console.log( "2. dataArr i: " + dataArr[i] );
                console.dir( jsonFormat );


            } catch (e) {
                errors.index.push( i );
                errors.errorMessage.push( e );
                console.log ( e );
            }

            //combine lists 
            bigJson = bigJson.concat (jsonFormat);

            console.log ("entry #" + i + " added");
            //console.log ("3. entry content: " + jsonFormatString);
        };

        //console.log ("bigJson: " + bigJson);
        console.dir( bigJson );
        //console.log("ende");
        return { json: bigJson,
                 errors: errors }; 

    }

    var display_data = function ( json ) {

        //draw data
        console.dir( json );
    }

    var display_error = function ( errors ) {

        //draw errors
        console.dir ( errors ); 
    }

    return { make_it_all : make_it_all };
} ();