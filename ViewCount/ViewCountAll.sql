#
# Used to get the 10 view count of all the posts...
#
SELECT pm.post_id as 'PostID', po.post_title as 'PostTitle', po.guid as 'URL', pm.meta_value as 'ViewCount' 
    FROM wp_postmeta AS pm
    INNER JOIN wp_posts AS po ON pm.post_id = po.ID
    WHERE pm.meta_key = 'post_views_count' 
    ORDER BY meta_value DESC, post_id ASC
    LIMIT 10
