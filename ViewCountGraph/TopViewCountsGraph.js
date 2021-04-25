function D3App ()
{
    // The data...
    var dataFile = 'Results_ViewCounts_ByCategory.dsv';

    var dataset, xScale, yScale;

    var selected = 0;

    var colours = [ '#0059b3', '#5900b3', '#59b300', '#b30059' ];

    // SVG Width, height, and some added spacing
    var margin = {
            top:    0,
            right:  5,
            bottom: 15,
            left:   55
    };

    var width  = 570 - margin.left - margin.right;
    var height = 550 - margin.top - margin.bottom;

    var updateDuration = 500;


    //
    // Function used to parse the CSV.  
    // 
    var rowConverter = function (d) 
    {
        // console.log (d);

        return [
            parseInt (d['PostID']), 
            d['PostTitle'], 
            d['URL'], 
            parseInt (d['ViewCount'])
        ];  
    }


    //
    // Read the CSV...
    //
    d3.dsv ('|', dataFile, rowConverter).then (function (data) 
    {
        // console.log (data);            
        dataset = data;

        // Find various Max values
        var maxCol = [ dataset[0][3], dataset[10][3], dataset[20][3], dataset[30][3] ];

        var svg = d3.select ('#graph').append('svg')
                    .attr ('width', width + margin.left + margin.right)
                    .attr ('height', height + margin.top + margin.bottom)
                    .append ('g')
                    .attr ('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        // Define the scales to convert our data to screen coordinates
        xScale = d3.scaleLinear ()
                   .domain ( [ 0, maxCol[0] ] )
                   .range ( [ 0, width ] ); 

        yScale = d3.scaleLinear ()
                   .domain ( [ 0, 10 ] )
                   .range ( [ height, 0 ] ); 

        var space     = 3;
        var barHeight = yScale(1) - yScale(1.42);

        // Draw bars and text for the post titles and view counts
        for (var j = 0; j < 10; j++)
        {
            svg.append ('rect')
               .attr ('x', xScale (0))
               .attr ('y', yScale (10 - j - 0.58) )
               .attr ('width', xScale (dataset[j][3]))
               .attr ('height', barHeight - space)
               .attr ('id', 'bar_' + j )
               .attr ('fill', colours [0]);

            svg.append ('a')
               .attr ('xlink:href', dataset[j][2] )
               .append ('text')
               .attr ('x', 2)
               .attr ('y', yScale (10 - 0.25 - j) )
               .attr ('text-anchor', 'start')
               .text (dataset[j][1])
               .attr ('class', 'textTitle')
               .attr ('id', 'title_' + j);

            svg.append ('text')
               .attr ('x', 2)
               .attr ('y', yScale (10 - 0.5 - j) )
               .text ('Views: ' + dataset[j][3])
               .attr ('text-anchor', 'start')
               .attr ('class', 'textViews')
               .attr ('id', 'views_' + j);  
        } // for j

        // Draw lines between data and numbers...
        for (var i = 0; i <= 10; i++)
        {
            svg.append ('line')
               .style ('stroke', '#4d4d4d')
               .style ('stroke-width', 0.5)
               .attr ('x1', -55)
               .attr ('y1', yScale (10 - i))
               .attr ('x2', width)
               .attr ('y2', yScale (10 - i)); 

            if (i != 10)
                svg.append ('text')
                   .attr ('x', -5)
                   .attr ('y', yScale (10 - 0.75 - i) )
                   .text (i+1)
                   .attr ('class', 'textNum')
                   .attr ('fill', 'white')
                   .attr ('stroke', 'black')
                   .attr ('stroke-width', '1')
                   .attr ('text-anchor', 'end');
        }

        //
        // Callback used to handle the total cases/resolved/not resolved/fatal buttons
        //
        d3.selectAll ('.datarange').on ('click', function()
        {
            // console.log ('dataRange button CB');  

            var selBtnID  = +d3.select(this).node().getAttribute ('stateID');
            var dataColID = +d3.select(this).node().getAttribute ('dataColID');

            if (selBtnID != selected)
            {
                // update the UI
                d3.selectAll ('.datarange').classed ('button_sel', false);
                d3.select ('#btnID_' + (selBtnID + 1)).classed ('button_sel', true); 
            }
            else 
            {
                // do nothing...
                return;
            } 

            // update the range
            xScale.domain ( [ 0, maxCol[selBtnID] ] );

            // Get the data and modify the rects
            for (var i = 0; i < 10; i++)
            {   
                d3.select ('#bar_' + i )
                  .transition ()
                  .duration (updateDuration)
                  .attr ('width', xScale (dataset[10*selBtnID + i][3]))
                  .attr ('fill', colours [selBtnID]);
                        
                d3.select ('#title_' + i) 
                  .transition ()
                  .duration (updateDuration)
                  .text (dataset[10*selBtnID + i][1]); 

                d3.select ('#views_' + i) 
                  .transition ()
                  .duration (updateDuration)
                  .text ('Views: ' + dataset[10*selBtnID + i][3]); 
            }  

            selected = selBtnID;

        } );

    } );

}


