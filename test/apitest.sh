#!/usr/bin/env bash 

testUserId=1
testUserToken="testusertoken"
hostUrl="http://101.200.163.140:8001"
# hostUrl="http://localhost:3000"
declare -a urls

function checkResult() {
  if [[ $2 -eq 200 ]]; then
    echo "[Success] API test at $1"
  else
    echo "[Failed] API test at $1"
  fi
}

# POST @ /api/users
checkResult "/api/users" \
    $(curl --write-out "%{http_code}\n" --silent --output /dev/null \
      "$hostUrl/api/users" \
      -X POST \
      -F "username=18888888888" -F "password=thisissuperpassword")

# POST @ /api/sessions
checkResult "/api/sessions" \
    $(curl --write-out "%{http_code}\n" --silent --output /dev/null \
      "$hostUrl/api/sessions" \
      -X POST \
      -F "username=18888888888" -F "password=thisissuperpassword")

# DELETE @ /api/sessions 
# TODO 

# GET @ /api/users/:userid
checkResult "/api/users/1" \
    $(curl --write-out "%{http_code}\n" --silent --output /dev/null \
      "$hostUrl/api/users/1" \
      -H "userid:1" -H "token:testusertoken" \
      -X GET)

checkResult "/api/users/443391467334284500" \
    $(curl --write-out "%{http_code}\n" --silent --output /dev/null \
      "$hostUrl/api/users/443391467334284500" \
      -H "userid:1" -H "token:testusertoken" \
      -X GET)

# PUT @ /api/users/:userid 
checkResult "/api/users/1" \
    $(curl --write-out "%{http_code}\n" --silent --output /dev/null \
      "$hostUrl/api/users/1" \
      -H "userid:1" -H "token:testusertoken" \
      -H "Content-Type: application/json" \
      -X PUT \
      -d '{"gender": "female"}')

checkResult "/api/users/443391467334284500" \
    $(curl --write-out "%{http_code}\n" --silent --output /dev/null \
      "$hostUrl/api/users/443391467334284500" \
      -H "userid:1" -H "token:testusertoken" \
      -X PUT \
      -F "gender=female")

# POST @ /api/users/:user_id/reset_password
checkResult "/api/users/1/reset_password" \
    $(curl --write-out "%{http_code}\n" --silent --output /dev/null \
      "$hostUrl/api/users/1/reset_password" \
      -H "userid:1" -H "token:testusertoken" \
      -X POST \
      -F "old_password=incorrectpassword" \
      -F "new_password=whatever" )

checkResult "/api/users/1/reset_password" \
    $(curl --write-out "%{http_code}\n" --silent --output /dev/null \
      "$hostUrl/api/users/1/reset_password" \
      -H "userid:1" -H "token:testusertoken" \
      -X POST \
      -F "old_password=passwordforalice" \
      -F "new_password=tmppasswordfortest" )

checkResult "/api/users/1/reset_password" \
    $(curl --write-out "%{http_code}\n" --silent --output /dev/null \
      "$hostUrl/api/users/1/reset_password" \
      -H "userid:1" -H "token:testusertoken" \
      -X POST \
      -F "old_password=tmppasswordfortest" \
      -F "new_password=passwordforalice" )

checkResult "/api/users/443391467334284500/reset_password" \
    $(curl --write-out "%{http_code}\n" --silent --output /dev/null \
      "$hostUrl/api/users/443391467334284500/reset_password" \
      -H "userid:1" -H "token:testusertoken" \
      -X POST \
      -F "old_password=passwordforalice" \
      -F "new_password=tmppasswordfortest" )

# POST @ /api/requests 
curTime=$(date +%s)
checkResult "/api/requests" \
    $(curl --write-out "%{http_code}\n" --silent --output /dev/null \
      "$hostUrl/api/requests" \
      -H "userid:1" -H "token:testusertoken" \
      -X POST \
      -F "title=automatedTestTitle" \
      -F "text=automatedTestText" \
      -F "endtime=$curTime" \
      -F "multimedia='[1,2,3]'" )

# GET @ /api/requests/:request_id
checkResult "/api/requests/2" \
    $(curl --write-out "%{http_code}\n" --silent --output /dev/null \
      "$hostUrl/api/requests/2" \
      -H "userid:1" -H "token:testusertoken" \
      -X GET )

# DELETE @ /api/requests/:request_id
checkResult "/api/requests/3" \
    $(curl --write-out "%{http_code}\n" --silent --output /dev/null \
      "$hostUrl/api/requests/3" \
      -H "userid:1" -H "token:testusertoken" \
      -X DELETE )

# GET @ /api/requests 
checkResult "/api/requests" \
    $(curl --write-out "%{http_code}\n" --silent --output /dev/null \
      "$hostUrl/api/requests" \
      -H "userid:1" -H "token:testusertoken" \
      -X GET )

# POST @ /api/responses 
checkResult "/api/responses" \
    $(curl --write-out "%{http_code}\n" --silent --output /dev/null \
      "$hostUrl/api/responses" \
      -H "userid:1" -H "token:testusertoken" \
      -X POST \
      -F "text=automatedResponseText" \
      -F "request_id=2" )

# GET @ /api/responses/:response_id
checkResult "/api/responses/3" \
    $(curl --write-out "%{http_code}\n" --silent --output /dev/null \
      "$hostUrl/api/responses/3" \
      -H "userid:1" -H "token:testusertoken" \
      -X GET )

# DELETE @ /api/responses/:response_id
checkResult "/api/responses/3" \
    $(curl --write-out "%{http_code}\n" --silent --output /dev/null \
      "$hostUrl/api/responses/3" \
      -H "userid:1" -H "token:testusertoken" \
      -X DELETE )

# GET @ /api/users/requests 
checkResult "/api/users/requests" \
    $(curl --write-out "%{http_code}\n" --silent --output /dev/null \
      "$hostUrl/api/users/requests" \
      -H "userid:1" -H "token:testusertoken" \
      -X GET )

# GET @ /api/users/responses
checkResult "/api/users/responses" \
    $(curl --write-out "%{http_code}\n" --silent --output /dev/null \
      "$hostUrl/api/users/responses" \
      -H "userid:1" -H "token:testusertoken" \
      -X GET )

# POST @ /api/multimedia 
curDirectory=$(pwd)
checkResult "/api/multimedia" \
    $(curl --write-out "%{http_code}\n" --silent --output /dev/null \
      "$hostUrl/api/multimedia" \
      -H "userid:1" -H "token:testusertoken" \
      -X POST \
      -F "data=@$curDirectory/test/apitest.sh" )

# GET @ /api/multimedia 
checkResult "/api/multimedia" \
    $(curl --write-out "%{http_code}\n" --silent --output /dev/null \
      "$hostUrl/api/multimedia" \
      -H "userid:1" -H "token:testusertoken" \
      -X GET \
      -F "fileid=123" )

