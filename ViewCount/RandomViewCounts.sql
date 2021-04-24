#
# RandomViewCounts.sql - set the view counts to some random values
#                        (for testing).
#
UPDATE wp_postmeta 
   SET meta_value = FLOOR(RAND()*15)+1 
   WHERE meta_key = 'post_views_count';
