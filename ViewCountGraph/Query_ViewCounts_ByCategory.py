#
# Query_ViewCounts_ByCategory.py
#
# Query the wordpress database to get the top 10 view counts for the posts 
# in the 'Portfolio Project', 'Side Projects', 'Blog Post' categories and
# the overall 
#
# Note:
# since there is a chance of having commas in the post titles, the | character
# is being used as a separator in the output.  Instead of having a CSV file,
# a DSV file is used (to indicate delimited separated values).
#




import sys
import datetime
import mysql.connector


if len(sys.argv) != 4:
    print ('Error: incorrect cmd line arguments')
    print (f'Usage: {sys.argv[0]}  <USERNAME>  <PASSWORD>  <FILENAME>')
    print ()
    sys.exit ()
    

cnx = mysql.connector.connect (user=sys.argv[1], password=sys.argv[2], database='wpSite')
FileName = sys.argv[3]  # 'Results_ViewCounts_ByCategory.dsv'

# make a cursor object so that we can query the database
cursor = cnx.cursor ()

# open a CSV file and write the header to it...
f = open (FileName, 'w')   
f.write ('PostID|PostTitle|URL|ViewCount\n')
writeCount = 0

# categories used to make queries...
categoryNames = [ 'Portfolio Project', 'Side Projects', 'Blog Post' ]

# the query done...
baseQuery = "SELECT DISTINCT pm.post_id as 'PostID', po.post_title as 'PostTitle', po.guid as 'URL', CONVERT(pm.meta_value, SIGNED) as 'ViewCount' "\
            "    FROM wp_postmeta AS pm "\
            "    INNER JOIN wp_posts AS po "\
            "        ON pm.post_id = po.ID "\
            "    INNER JOIN wp_term_relationships as termRels "\
            "        ON termRels.object_id = po.id "\
            "    INNER JOIN wp_term_taxonomy as termTax "\
            "        ON termRels.term_taxonomy_id = termTax.term_id "\
            "    INNER JOIN wp_terms as terms "\
            "        ON terms.term_id = termTax.term_id "

# to the query and apply additional filtering...
for i in range (-1, len(categoryNames)):

    query =  baseQuery
    query += "    WHERE pm.meta_key = 'post_views_count' "
    
    if i != -1:
        query += "        AND terms.name = '" + categoryNames[i] + "' "
    
    query += "    ORDER BY ViewCount DESC, pm.post_id ASC "
    query += "    LIMIT 10 "

    cursor.execute (query);

    # write the query to the file...
    for (postID, postTitle, URL, viewCount) in cursor:
        writeCount += 1
        f.write (f"{postID}|{postTitle}|{URL}|{viewCount}\n")


f.close ()
cursor.close()
cnx.close ()


print (f'{sys.argv[0]}: Wrote {writeCount} lines to {FileName}')



