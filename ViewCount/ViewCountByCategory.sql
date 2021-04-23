#
# Used to get the top 10 views 
#
SELECT pm.post_id as 'PostID', po.post_title as 'PostTitle', po.guid as 'URL', pm.meta_value as 'ViewCount'
    FROM wp_postmeta AS pm
    INNER JOIN wp_posts AS po
        ON pm.post_id = po.ID
    INNER JOIN wp_term_relationships as termRels
       ON termRels.object_id = po.id
    INNER JOIN wp_term_taxonomy as termTax
       ON termRels.term_taxonomy_id = termTax.term_id
    INNER JOIN wp_terms as terms
       ON terms.term_id = termTax.term_id
    # Note that terms.name is the name of the category
    WHERE pm.meta_key = 'post_views_count' AND terms.name = 'Blog Post'
    ORDER BY meta_value DESC, post_id ASC
    LIMIT 10
