#
# Query_Posts_ByCatTag.py
#
# Query the wordpress database to get the categories and tags for each post.
# Then determine groups of IDs that belong to different categories and tag groups.
#
# Note:
# since there is a chance of having commas in the post titles, the | character
# is being used as a separator in the output.  Instead of having a CSV file,
# a DSV file is used (to indicate delimited separated values).
#




import sys
import datetime
import mysql.connector


if len(sys.argv) != 5:
    print ('Error: incorrect cmd line arguments')
    print (f'Usage: {sys.argv[0]}  <USERNAME>  <PASSWORD>  <DSV_FILENAME>  <JSON_FILENAME>')
    print ()
    sys.exit ()
    

def FindCategoryCode (categoryStr):

    code = 0
    categoryList = categoryStr.split (',')
    if 'Portfolio Project' in categoryList:
        code = 1
    elif 'Side Projects' in categoryList:
        code = 2
    elif 'Blog Post' in categoryList:
        code = 3
    return code


def GetNumberOfTags (tagsStr):
    
    numTags = 0
    if tagsStr is not None:
        tags = tagsStr.split (',')
        numTags = len (tags)
    return numTags


def GetSubCategoryNames (category, results):

    subCategoryNames = set ()

    for result in results:
        categories = result['Categories'].split (',')
        if category in categories:
            for catElement in categories:
                if catElement != category:
                    subCategoryNames.add (catElement.replace(' ', ''))

    return list(subCategoryNames)



cnx = mysql.connector.connect (user=sys.argv[1], password=sys.argv[2], database='wpSite')
FileName     = sys.argv[3]  
JSONFileName = sys.argv[4]


# make a cursor object so that we can query the database
cursor = cnx.cursor ()

# the query done...
query = "SELECT DISTINCT "\
        "    ID, "\
	"    post_title AS 'PostTitle', "\
        "    LENGTH(post_content) AS 'PostSize', "\
        "    guid as 'URL', "\
        "    ( SELECT group_concat(wp_terms.name separator ', ') "\
        "          FROM wp_terms "\
        "          INNER JOIN wp_term_taxonomy on wp_terms.term_id = wp_term_taxonomy.term_id "\
        "          INNER JOIN wp_term_relationships wpr on wpr.term_taxonomy_id = wp_term_taxonomy.term_taxonomy_id "\
        "          WHERE taxonomy= 'category' and wp_posts.ID = wpr.object_id ) AS 'Categories', "\
        "    ( SELECT group_concat(wp_terms.name separator ', ') "\
        "          FROM wp_terms "\
        "          INNER JOIN wp_term_taxonomy on wp_terms.term_id = wp_term_taxonomy.term_id "\
        "          INNER JOIN wp_term_relationships wpr on wpr.term_taxonomy_id = wp_term_taxonomy.term_taxonomy_id "\
        "          WHERE taxonomy= 'post_tag' and wp_posts.ID = wpr.object_id ) AS 'Tags' "\
        "    FROM wp_posts "\
        "    WHERE post_type = 'post' AND post_status = 'publish' "\
        "    ORDER BY ID "

cursor.execute (query);


# open a CSV file and write the header to it...
f = open (FileName, 'w')   
f.write ('PostID|PostTitle|PostSize|URL|Category|CategoryCode|Tags|NumTags\n')
postWriteCount = 0;

# go through all the results and output them to a file... 
results = []
for (postID, postTitle, postSize, URL, categories, tags) in cursor:
    
    # uncomment for debugging/testing...
    # print (postID, postTitle, postSize, URL, categories, FindCategoryCode(categories), tags, GetNumberOfTags (tags))

    # write out the results to a file
    f.write (f"{postID}|{postTitle}|{postSize}|{URL}|{categories}|{FindCategoryCode(categories)}|{tags}|{GetNumberOfTags(tags)}\n")

    # also keep track of the id with the categories and tags to establish various relationships...
    results.append ( { 'ID': postID, 'Categories': categories, 'Tags': tags } )
    postWriteCount += 1    


f.close ()
cursor.close()
cnx.close ()



#
# Part 2... determine the relationships between posts and the different groups that they belong to
# 

# categories used to make queries...
categoryFilterNames = [ 'Portfolio Project', 'Side Projects', 'Blog Post' ]
tagGroupFilterNames = [ { 'TagGroup': 'Electronic Music', 'Tags': ['Music-Electronic', 'Music-Techno', 'Music-DrumAndBass', 'Music-GhettoTech'] },
                        { 'TagGroup': 'Down-tempo Party Music', 'Tags': ['Music-InstramentalHiphop', 'Music-AfroFunk', 'Music-Funk'] },
                        { 'TagGroup': 'Soul & Jazz', 'Tags': ['Music-Jazz', 'Music-Soul', 'Music-Motown' ] },
                        { 'TagGroup': 'Math Related', 'Tags': ['Math', 'Fractals', 'DifferentialEquations', 'Math-Fourier', 'Math-Regression', 'Math-Modelling' ] },
                        { 'TagGroup': 'Various Physics & Engineering', 'Tags': ['Arduino', 'Physics', 'Lagrangian', 'MachineVision'] } ]


filterResults = []

# first the categories...
for filterName in categoryFilterNames:

    subCategories = GetSubCategoryNames (filterName, results)

    IDList = []
    for result in results:
        if filterName in result['Categories'].split (','):
            IDList.append (result['ID'])

    filterResults.append ( { 'FilterName': filterName, \
                             'FilterType': 'Category', \
                             'FilterElements': subCategories, \
                             'IDs': IDList } )


# and then the various tag group combinations...
for tagGroupFilter in tagGroupFilterNames:

     IDList = []    

     # print (tagGroupFilter['Tags'])
     for tag in tagGroupFilter['Tags']:
        
         for result in results:

             if result['Tags'] is None:
                 continue

             if tag in result['Tags']:
                 IDList.append (result['ID'])

     IDList = list(set(IDList))    

     filterResults.append ( { 'FilterName': tagGroupFilter['TagGroup'], \
                              'FilterType': 'TagGroup', \
                              'FilterElements': tagGroupFilter['Tags'], \
                              'IDs': IDList } )

# uncomment for testing/debugging
#print (filterResults)

f = open (JSONFileName, 'w')   
f.write ('[\n')

for i in range (len(filterResults)):
    f.write ('{\n')

    f.write ('    "FilterName":"' + filterResults[i]['FilterName'] + '",\n')
    f.write ('    "FilterType":"' + filterResults[i]['FilterType'] + '",\n')

    f.write ('    "FilterElements": [ ')
    for j in range(len(filterResults[i]['FilterElements'])):
        f.write ('"' + filterResults[i]['FilterElements'][j] + '"')
        if j != len(filterResults[i]['FilterElements'])-1:
            f.write (', ')
    f.write (' ], \n')
    
    f.write ('    "IDs": [ ')
    for j in range (len(filterResults[i]['IDs'])):
        f.write (str(filterResults[i]['IDs'][j]))
        if j != len(filterResults[i]['IDs'])-1:
            f.write (', ')
    f.write (' ]\n')

    if i != len(filterResults)-1:
        f.write ('},\n')
    else:
        f.write ('}\n')

f.write (']\n')
f.close ()


print (f'{sys.argv[0]}: Wrote {postWriteCount} lines to {FileName}')
print (f'{sys.argv[0]}: Wrote results for {len(filterResults)} filters to {JSONFileName}')


