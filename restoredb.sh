#!/bin/sh
#Define init value
dbName="dbName"
dbUsr="dbUsr"
dbPass="dbPass"
dbPort=27017
dbPath=$1
extractPath="extractPath"

#Check the backup folder is exist, if not create new one
if [ ! -d "extractPath" ]; then
     echo -e "You are not have backup folder, we will create folder $extractPath for you!!!"
     mkdir $extractPath
fi
# Extract db file
tar -C $extractPath -xvzf $dbPath
#Check the backup folder is exist, if not create new one
#if [ ! -d "extractPath" ]; then
#     echo "You are not have backup folder, let check folder $extractPath is correct!!!"
#     exit $OUT
#fi

#Export mongodb
mongorestore --host localhost --port $dbPort --authenticationDatabase $dbName --db $dbName -u $dbUsr -p $dbPass "$extractPath/$dbName"
OUT=$?
if [ $OUT -ne 0 ]; then
     echo "Cannot restore mongodb database"
     #Remove folder dbName
     rm -r $extractPath
     exit $OUT
fi
#Remove folder dbName
rm -r $extractPath
#Done
echo "Restore done!!!"