//
// The following code needs to be added to functions.php
//


/*
 * Functions to add view counters and display the value in the Admin's Posts overview
 *
 * Code base found at https://www.isitwp.com/track-post-views-without-a-plugin-using-post-meta/
 */

//
// get_post_views: Used whenever the view count is needed internally by wordpress
//
function get_post_views ($postID)
{
    $count_key = 'post_views_count';
    $count = get_post_meta($postID, $count_key, true);

    // If the key is NULL then...
    if ($count=='')
    {
        // Add it in and set it to zero.
        delete_post_meta ($postID, $count_key);
        add_post_meta ($postID, $count_key, '0');

        return "0 Views";
    }
 
    // For one view... note view is singular
    if ($count=='1')
    {
        return "1 View";
    }

    // Otherwise result the count and view is plurral
    return $count.' Views';
}


//
// set_post_views: Used to update the view count for a post
//
function set_post_views ($postID)
{
    // Only count views on published posts; that is not in preview mode
    if (get_post_status ($postID) !== 'publish')
    {
        return;
    }

    $count_key = 'post_views_count';
    $count = get_post_meta ($postID, $count_key, true);

    // if the key is NULL then this is the first time it is being used...
    if ($count=='')
    {
        // This is the first view
        $count = 1;
        delete_post_meta ($postID, $count_key);
        add_post_meta ($postID, $count_key, '1');
    }
    else
    {
        // Otherwise increment the view count...
        $count++;
        update_post_meta($postID, $count_key, $count);
    }
}


// Remove issues with prefetching adding extra views
remove_action( 'wp_head', 'adjacent_posts_rel_link_wp_head', 10, 0); 


//
// posts_column_views: Add to a column in WP-Admin
//
function posts_column_views($defaults)
{
    $defaults['post_views'] = __('Views');
    return $defaults;
}


//
// posts_custom_column_views: Add content to the views column
//
function posts_custom_column_views($column_name, $id)
{
    if ($column_name === 'post_views')
    {
        echo get_post_views (get_the_ID());
    }
}

add_filter ('manage_posts_columns', 'posts_column_views');
add_action ('manage_posts_custom_column', 'posts_custom_column_views',5,2);

/*
 * End of view counter functions; see also single.php for changes
 */

