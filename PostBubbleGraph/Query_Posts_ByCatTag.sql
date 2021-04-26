SELECT DISTINCT 
    ID, 
    post_title AS 'PostTitle',
    LENGTH(post_content) AS 'PostSize',
    guid as 'URL',
    ( SELECT group_concat(wp_terms.name separator ', ') 
          FROM wp_terms
          INNER JOIN wp_term_taxonomy on wp_terms.term_id = wp_term_taxonomy.term_id
          INNER JOIN wp_term_relationships wpr on wpr.term_taxonomy_id = wp_term_taxonomy.term_taxonomy_id
          WHERE taxonomy = 'category' and wp_posts.ID = wpr.object_id ) AS 'Categories',
    ( SELECT group_concat(wp_terms.name separator ', ') 
          FROM wp_terms
          INNER JOIN wp_term_taxonomy on wp_terms.term_id = wp_term_taxonomy.term_id
          INNER JOIN wp_term_relationships wpr on wpr.term_taxonomy_id = wp_term_taxonomy.term_taxonomy_id
          WHERE taxonomy = 'post_tag' and wp_posts.ID = wpr.object_id ) AS 'Tags'
    FROM wp_posts
    WHERE post_type = 'post' AND post_status = 'publish'
    ORDER BY ID


