//
// In the central while loop, a call to set_post_views needs to be added 
// (as shown below)
//

         .
         .
         .
         .

                <div class="post-item">
                    <?php
                    if (have_posts()):
                        while (have_posts()):
                            the_post();
                            get_template_part('template-parts/content', 'single');
  
                            // Added to count post views, see https://www.isitwp.com/track-post-views-without-a-plugin-using-post-meta/
                            set_post_views (get_the_ID());
                        endwhile;
                    else :
                        get_template_part('template-parts/content', 'none');
                    endif;
                    ?>
                </div>

         .
         .
         .
         .


