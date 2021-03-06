<!-- TOC depthFrom:1 depthTo:6 withLinks:1 updateOnSave:1 orderedList:0 -->

- [温酒 Wenjiu](#温酒-wenjiu)
	- [Functionalities](#functionalities)
	- [Explanation](#explanation)
	- [API Details](#api-details)
		- [HTTP API Requests](#http-api-requests)
			- [User and session](#user-and-session)
			- [Request](#request)
			- [Response](#response)
			- [History](#history)
			- [Multimedia file](#multimedia-file)
		- [HTTP API Responses](#http-api-responses)

<!-- /TOC -->

# 温酒 Wenjiu

This is a node.js (`Express.js` + `Typescript` + `MySQL`) server for a social
application Wenjiu, which has a corresponding Android client.

## Functionalities

The main functions of this server are

- to provide a set of HTTP APIs for user activities,
- to schedule timely scanning and send push requests to push notification
platform, and
- to store and manage multimedia files on the server disk.

## Explanation

This was firstly written in pure javascript (with `--harmony-async-await`),
and later converted to Microsoft's Typescript in consideration of providing
more type security and reducing possible bugs. Due to this conversion,
code styles may have a *mysterious* (actually, not so mysterious) mixture.

## API Details

### HTTP API Requests

`userid` and `token` are routinely in the headers while others should be sent
in the body.

#### User and session

- user registration, [POST] @ `/api/users` with
  - `username` (string with length at most 30),
  - `password`,
  - and other optional fields (to be implemented).

- user login, [POST] @ `/api/sessions` with
  - `username`, and
  - `password`.

- user logout, [DELETE] @ `/api/sessions` with
  - `userid` (integer), and
  - `token` (string).

- view basic profile of a user, [GET] @ `/api/users/:user_id` with
  - `userid` and
  - `token`.

- update profile of a user, [PUT] @ `/api/users/:user_id` with
  - `userid`,
  - `token`, and
  - (optional) `gender` (`'female'` or `'male'`),
  - (optional) `nickname` (`string`),
  - (optional) `signature` (`string` within length of 256),
  - (optional) `figure_id` (`int`),

- reset password for a user, [POST] @ `/api/users/:user_id/reset_password` with
  - `userid`,
  - `token`,
  - `old_password`, and
  - `new_password`.

#### Request

- publish a request, [POST] @ `/api/requests` with
  - `userid`,
  - `token`,
  - `title`, (`title` is **DEPRECATED** and should be ignored)
  - `text`, and
  - `endtime`.
  - (optional) `multimedia` as a string of JSON array, e.g. "[1,2,3,4]"

- view a request, [GET] @ `/api/requests/:request_id` with
  - `userid`,
  - `token`.

- delete a request, [DELETE] @ `/api/requests/:request_id` with
  - `userid`,
  - `token`, and
  - `request_id`.

- view recent requests, [GET] @ `/api/requests` with
  - `userid`, and
  - `token`.
  - (optional) `last_time` , a timestamp in ms indicating used as a cursor for
    request creation time. e.g. `/api/requests?last_time=1480832617296`.
    If provided with this parameter, the server will only send back requests
    created in prior to this time.

#### Response

- publish a response, [POST] @ `/api/responses` with
  - `userid`,
  - `token`,
  - `text`, and
  - `request_id`.
  - (optional) `multimedia` as a string of JSON array, e.g. "[1,2,3,4]"

- view a response, [GET] @ `/api/responses/:response_id` with
  - `userid`,
  - `token`.

- delete a response, [DELETE] @ `/api/responses/:response_id` with
  - `userid`,
  - `token`, and
  - `response_id`.

- like a response, [POST] @ `/api/responses/:response_id/like` with
  - `userid`, and
  - `token`.

#### History

- view request history, [GET] @ `/api/users/requests` with
  - `userid` and
  - `token`.
  - (optional) `last_time` , a timestamp in ms indicating used as a cursor for
    request creation time. e.g. `/api/users/requests?last_time=1480832617296`.
    If provided with this parameter, the server will only send back requests
    created in prior to this time.

- view response history, [GET] @ `/api/users/responses` with
  - `userid` and
  - `token`.

- view user history (both requests and responses), [GET] @ `/api/users/history`
  with
  - `userid`, and
  - `token`.
  - (optional) `last_time`, as is stated above in request history API.

#### Multimedia file

- upload a file, [POST] @ `/api/multimedia/` with
  - `userid`,
  - `token` and
  - `data` (the file to be uploaded).
  - Hint: make sure the file extension is one of `IMG`, `VID`, or `SND`, because
  these will be the identifier for the multimedia types (images, videos, or sounds).

- download a file, [GET] @ `/api/multimedia` with
  - `userid`,
  - `token` and
  - `fileid` (as a GET query parameter).
  - (optional) In the header if there is `'imageonly': 'yes'`, then file content will be
  sent if and only if this file is an image, i.e. with an extension as `IMG`.
  - Hint: For responses, there will be an entry in the header of
`'Multimedia-Type': FILE_EXTENTION`. An example of response header is below.

```
200, OK
Date: Sun, 11 Dec 2016 07:32:00 GMT
Last-Modified: Wed, 07 Dec 2016 16:37:20 GMT
Server: Apache/2.4.7 (Ubuntu)
X-Powered-By: Express
ETag: W/"ae18-158da258188"
Content-Type: application/octet-stream
Multimedia-Type: jpg
Cache-Control: public, max-age=0
Connection: Keep-Alive
Accept-Ranges: bytes
Keep-Alive: timeout=5, max=100
Content-Length: 44568
```

- fetch dimensions of an image, [GET] @ `/api/multimedia/:imageid/dimensions`
  with
  - `userid`,
  - `token`, and
  - `imageid` (as a parameter inside of the url).

### HTTP API Responses

Responses are in JSON format and have at least two fields:

- `status`, normally `"success"` or `"failure"`, and
- `message`.

For user login, `userid` and `token` are also sent back.
