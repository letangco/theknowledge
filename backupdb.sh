#!/bin/sh
#Define init value
dbName="dbName"
dbUsr="dbUsr"
dbPass="dbPass"
dbPort="dbPort"
bkPath="Backup"
bkCompressFile="prefix-`date '+%d-%b-%Y-%H-%M-%S'`.tar.gz"
echo $bkCompressFile
#Check the backup folder is exist, if not create new one
if [ ! -d "bkPath" ]; then
     echo -e "You are not have backup folder, we will create folder $bkPath for you!!!"
     mkdir $bkPath
fi
#Check the folder dbName is exist, if have remove it before export
if [ -d "dbName" ]; then
     echo -e "You are already have backup folder, we will remove it and export new one!!!"
     rm -r $dbName
fi
#Export mongodb
mongodump --host localhost --port $dbPort --db $dbName -u $dbUsr -p $dbPass --out $bkPath
OUT=$?
if [ $OUT -ne 0 ]; then
     echo -e "Cannot export mongodb database"
     exit $OUT
fi
#Cd to bkPath
cd $bkPath
#Compress database
tar -zcvf $bkCompressFile $dbName
#Remove folder dbName
rm -r $dbName
#Done
echo "Backup done!!!"