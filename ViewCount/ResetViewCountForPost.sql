#
# ResetViewCountForPost.sql - reset the view count back to zero for a 
#                             particular post (of POST_ID).
#
UPDATE wp_postmeta 
   SET meta_value = '0' 
   WHERE post_id = [POST_ID] AND meta_key = 'post_views_count';

