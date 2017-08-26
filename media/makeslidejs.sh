#!/bin/tcsh
# Alf 20170826 hacky make js array of folder filenames

if ($#argv != 1) then
 echo "need a folder parameter"
 exit
endif

set count=`ls -1 $1 | wc -l`

set i = 0

echo 'var slide = ['

foreach file (`ls $1`)
 @ i = $i + 1
 echo -n "'"$1/$file"'"
 if ( $i < $count ) then
  echo ','
 endif
end

echo ''
echo '];'
