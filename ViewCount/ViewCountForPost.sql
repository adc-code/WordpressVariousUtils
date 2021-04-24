#
# ViewCountForPost.sql - Used to get the total views for a particular post by ID number
#
SELECT post_id as 'PostID', meta_value as 'ViewCount'
    FROM wp_postmeta 
    WHERE post_id = [POST_ID] AND meta_key = 'post_views_count';
