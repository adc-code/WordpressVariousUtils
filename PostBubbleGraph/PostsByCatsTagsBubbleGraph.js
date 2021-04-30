function D3BubbleApp ()
{ 
    const IDFileName    = 'PostCatTags.dsv';
    const GroupFileName = 'PostGroups.json';

    const regBaseColour   = '#bfbfbf';
    const selBaseColour   = '#009999';
    const mouseOverColour = '#ff3300';

    const width  = 800;
    const height = 500;

    // location to center the bubbles
    const centerPos  = { x: width/2, y: height/2 };
    const filterXPos = [ 0.2 * width, 0.8 * width ];

    // strength to apply to the position forces
    const forceStrength = 0.035;

    let svg     = null;
    let bubbles = null;
    let nodes   = [];

    let currSelected = 'btnID_0';


    //
    // Function used to parse the CSV.  
    // 
    var rowConverter = function (d) 
    {
        // console.log (d);

        return { 'PostID':       parseInt (d['PostID']), 
                 'PostTitle':    d['PostTitle'], 
                 'PostSize':     parseInt (d['PostSize']),
                 'URL':          d['URL'], 
                 'Category':     d['Category'],
                 'CategoryCode': parseInt (d['CategoryCode']),
                 'Tags':         d['Tags'],
                 'NumTags':      parseInt (d['NumTags']) };  
    }


    // 
    // charge: used by the bubble simulation...
    // charge is dependent on size of the bubble, so bigger towards the middle
    //
    function charge (d)
    {   
        return Math.pow (d.radius, 2.0) * 0.01;
    }


    //
    // adjustColour: used to make shades of colours depending on the category and 
    // number of associated tags.
    //
    function adjustColour (baseColour, catCode, numTags)
    {
        var colourRGB = hexToRgb (baseColour);
        var colourHSV = rgbToHsv (colourRGB.r, colourRGB.g, colourRGB.b);

        colourHSV[2] -= ( (catCode - 1) * 0.1 + (numTags * 0.01) );

        colourRGB = hsvToRgb (colourHSV[0], colourHSV[1], colourHSV[2]);

        return rgbToHex (Math.floor (colourRGB[0]), Math.floor (colourRGB[1]), Math.floor (colourRGB[2]));
    }

  
    //
    // createNodes: makes 'nodes' for the bubble graph simulation
    //
    function createNodes (rawData) 
    {
        // use the length of the post to establish the radius
        const maxSize = d3.max (rawData, d => d.PostSize); 

        // size bubbles based on area
        const radiusScale = d3.scaleSqrt ()
                              .domain ( [0, maxSize] )
                              .range ( [0, 40] );

        // use map() to convert raw data into node data
        const myNodes = rawData.map(d => ({
                                            ...d,
                                            radius: radiusScale (d.PostSize), 
                                            size: d.PostSize, 
                                            selected: false,
                                            regFillColour: adjustColour (regBaseColour, d.CategoryCode, d.NumTags),
                                            selFillColour: adjustColour (selBaseColour, d.CategoryCode, d.NumTags),
                                            x: Math.random() * width,
                                            y: Math.random() * height
                                          }))

        return myNodes;
    }


    // 
    // ticked: callback function called after every tick of the force simulation
    // here we do the actual repositioning of the circles based on current x and y value of their bound node data
    // x and y values are modified by the force simulation
    function ticked ()
    {   
        bubbles.attr ('cx', d => d.x)
               .attr ('cy', d => d.y);
    }


    // 
    // EventMouseEnter: callback to deal with when the mouse has entered a bubble
    //
    function EventMouseEnter (obj, data)
    {
        // console.log ('MouseEnter: ' + data.PostID);
        d3.select (obj).style ('fill', mouseOverColour);

        //var xPosition = d3.event.pageX + 15;
        var yPosition = d3.event.pageY;

        d3.select ('#tooltip')
          .style ('left', (data.x + 15) + 'px')
          .style ('top', yPosition + 'px')
          .select ('#label').html ( data.PostTitle );

        d3.select ('#tooltip').classed ('hidden', false);
    }


    //
    // EventMouseLeave: callback to deal with when the mouse has left a bubble
    //
    function EventMouseLeave (obj, data)
    {
        // console.log ('MouseLeave ' + data.PostID);

        d3.select ('#tooltip').classed ('hidden', true);

        if (data.selected)
            d3.select (obj).style ('fill', data.selFillColour);
        else
            d3.select (obj).style ('fill', data.refFillColour);
    }


    //
    // EventMouseDblClick: callback to deal with when the mouse was clicked on a 
    // bubble.  Note all the stuff here is used to display a pop-up dialog
    // to ask if the user want to go to the associated link
    //
    function EventMouseDblClick (obj, data)
    {
        //console.log ('MouseDblClick ' + data.PostID);
        //console.log ('URL: ' + data.URL);
 
        // temporarily store some values
        let postTitle = data.PostTitle;
        let URL = data.URL;

        // put everything in a group to make clean up easier
        var gotoURL = svg.append ('g')
                         .attr ('id', 'gotoURL');

        // background element... used to disable clicks on the graph
        gotoURL.append ('rect')
               .attr ('id', 'goToUrlBG')
               .attr ('x', 0)
               .attr ('y', 0)
               .attr ('width', width)
               .attr ('height', height)
               .attr ('fill', '#aabbcc')
               .attr ('opacity', 0.7);

        // pop-up element
        gotoURL.append ('rect')
               .attr ('x', 0.2 * width)
               .attr ('y', 0.4 * height)
               .attr ('width', 0.6 * width)
               .attr ('height', 0.2 * height)
               .attr ('rx', 4)
               .attr ('ry', 4)
               .attr ('fill', '#dddddd')
               .attr ('stroke', '#000000')
               .attr ('opacity', 0.6);

        // cancel button...
        var gotoURLCancelBtn = gotoURL.append ('g')
                                      .attr ('id', 'gotoURLCancelBtn');

        gotoURLCancelBtn.append ('rect')
                        .attr ('id', 'cancel')
                        .attr ('x', 0.725 * width)
                        .attr ('y', 0.55 * height)
                        .attr ('width', 0.065 * width)
                        .attr ('height', 0.035 * height)
                        .attr ('rx', 2)
                        .attr ('ry', 2)
                        .attr ('stroke', '#000000')
                        .attr ('fill', '#dd0000')
                        .attr ('opacity', 0.5);

        gotoURLCancelBtn.append ('text')
                        .attr ('x', 0.7575 * width)
                        .attr ('y', 0.575 * height)
                        .style('text-anchor', 'middle')
                        .text ( 'Cancel'); 
 
        // ok button...
        var gotoURLOkBtn = gotoURL.append ('g')
                                  .attr ('id', 'gotoURLOkBtn');

        gotoURLOkBtn.append ('rect')
                    .attr ('id', 'ok')
                    .attr ('x', 0.65 * width)
                    .attr ('y', 0.55 * height)
                    .attr ('width', 0.065 * width)
                    .attr ('height', 0.035 * height)
                    .attr ('rx', 2)
                    .attr ('ry', 2)
                    .attr ('stroke', '#000000')
                    .attr ('fill', '#00dd00')
                    .attr ('opacity', 0.5);

        gotoURLOkBtn.append ('text')
                    .attr ('x', 0.6825 * width)
                    .attr ('y', 0.575 * height)
                    .style('text-anchor', 'middle')
                    .text ( 'Ok'); 

        // the 'go to post' label
        gotoURL.append ('text')
               .attr ('x', 0.22 * width)
               .attr ('y', 0.44 * height)
               .style('text-anchor', 'start')
               .text ( 'Go to post: '); 

        // the postTitle label
        gotoURL.append ('text')
               .attr ('x', 0.22 * width)
               .attr ('y', 0.48 * height)
               .style('text-anchor', 'start')
               .text ( postTitle ); 

        d3.select ('#gotoURLCancelBtn').on ('click', function ()
        {
            // console.log ('cancel button');

            // remove the goto URL 'screen'
            d3.select ('#gotoURL')
              .remove ();
        } );

        d3.select ('#gotoURLOkBtn').on ('click', function (d)
        {
            // Open the link in a new window...           
            window.open (URL, '_blank').focus();
        } );
    }


    // load data
    d3.dsv ('|', IDFileName, rowConverter).then ( function (data) 
    {
        var nodeData = data;

        d3.json (GroupFileName).then (function (data) 
        {
            var filterData = data;

            // create a force simulation and add forces to it
            const simulation = d3.forceSimulation ()
                                 .force ('charge', d3.forceManyBody().strength (charge))
                                 .force ('x', d3.forceX().strength(forceStrength).x (centerPos.x))
                                 .force ('y', d3.forceY().strength(forceStrength).y (centerPos.y))
                                 .force ('collision', d3.forceCollide().radius ( function (d) { return d.radius + 1; }));

            // force simulation starts up automatically, so stop it until it is populated
            simulation.stop (); 

            // convert raw data into nodes data
            nodes = createNodes (nodeData);

            // create svg element inside provided selector
            svg = d3.select ('#graph')
                    .append ('svg')
                    .attr ('width', width)
                    .attr ('height', height);

            const elements = svg.selectAll ('.bubble')
                                .data (nodes, d => d.PostID)
                                .enter ()
                                .append ('g')

            bubbles = elements.append ('circle')
                              .classed ('bubble', true)
                              .attr ('r', 0)
                              .attr ('id', function(d) { return 'bubble_' + d.PostID; } )
                              .attr ('stroke', '#333333')
                              .attr ('stroke-width', 2)
                              .attr ('fill', function (d) { return d.regFillColour; } ) 
                              .on ('mouseenter', function (d) { return EventMouseEnter (this, d); } )
                              .on ('mouseleave', function (d) { return EventMouseLeave (this, d); } )
                              .on ('dblclick', function (d) { return EventMouseDblClick (this, d); } );

            // nice element to have the bubbles enlarge on creation
            bubbles.transition ()
                   .duration (1000)
                   .attr ('r', function (d) { return d.radius; });

            // set simulation's nodes to our newly created nodes array
            // simulation starts running automatically once nodes are set
            simulation.nodes (nodes)
                      .on ('tick', ticked)
                      .restart ();

            // Make Filters
            for (var i = 0; i < filterData.length; i++)
            {
                // console.log (filterData[i].FilterName);
                
                var newDiv  = document.createElement ('div'); 

                var newContent = document.createTextNode (filterData[i].FilterName);

                newDiv.setAttribute ('id', 'btnID_' + (i+1))
                newDiv.className = 'filterButton';

                newDiv.setAttribute ('filterNum', i)
                newDiv.appendChild (newContent);

                var currentDiv = document.getElementById ('filters').appendChild (newDiv);
            }

            var filterType = 0;
            function filternodes (d)
            {
                if (filterType == -1)
                {
                    d3.select ('#bubble_' + d.PostID)
                      .transition ()
                      .duration (1000)
                      .attr ('fill', d.regFillColour);

                    return centerPos.x;
                }

                if (filterData[filterType]['IDs'].includes (d.PostID))
                {
                    d3.select ('#bubble_' + d.PostID)
                      .transition ()
                      .duration (1000)
                      .attr ('fill', d.selFillColour);

                    return filterXPos[0];
                }
                else
                {
                    d3.select ('#bubble_' + d.PostID)
                      .transition ()
                      .duration (1000)
                      .attr ('fill', d.regFillColour);

                    return filterXPos[1];
                }
            }


            //
            // Callback for any/all of the filter buttons...
            //
            d3.selectAll ('.filterButton').on ('click', function (d)
            {
                // console.log ('on filter...');

                // update the UI first
                var isSelected = d3.select(this).classed ('filterButtonSel');
                if (isSelected == false)
                {
                    d3.select ('#' + currSelected).node().classList = ['filterButton'];
                    d3.select (this).node().classList = ['filterButton filterButtonSel'];
                    currSelected = d3.select(this).attr('id');
                }

                // figure out which filter button was pressed
                filterType = d3.select(this).attr('filterNum');

                // update the details div...
                var txt = '';  
                if (filterType == -1)
                    txt = '-';
                else
                {
                    if (filterData[filterType].FilterType == 'Category')
                        txt = 'Includes sub-categories: ';
                    else if (filterData[filterType].FilterType == 'TagGroup')
                        txt = 'Includes tags: ';

                    for (var i = 0; i < filterData[filterType].FilterElements.length; i++)
                    {
                        txt += filterData[filterType].FilterElements[i];
                        if (i != filterData[filterType].FilterElements.length-1)
                            txt += ', '
                    }
                }
                document.getElementById('filterDetails').innerHTML = txt;
                       
                // A few things are done here... the filtering and updating the new positions
                simulation.force('x', d3.forceX().strength(forceStrength).x(filternodes));

                // restart the simulation... note the 2 causes the simulation toe be more snappier
                simulation.alpha(2).restart();

            }  );

        });

    } );

}



