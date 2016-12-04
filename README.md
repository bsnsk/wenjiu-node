# 温酒 Wenjiu

敬请期待

## API 

### HTTP Requests

`userid` and `token` are routinely in the headers while others should be sent 
in the body.

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

- publish a request, [POST] @ `/api/requests` with 
  - `userid`,
  - `token`,
  - `title`,
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

- view request history, [GET] @ `/api/users/requests` with 
  - `userid` and 
  - `token`.

- view response history, [GET] @ `/api/users/responses` with 
  - `userid` and 
  - `token`.

- upload a file, [POST] @ `/api/multimedia/` with 
  - `userid`,
  - `token` and
  - `data` (the file to be uploaded).

- download a file, [GET] @ `/api/multimedia` with 
  - `userid`,
  - `token` and 
  - `fileid` (as a GET query parameter).

### API Responses

Responses are in JSON format and have at least two fields:

- `status`, normally `"success"` or `"failure"`, and
- `message`.

For user login, `userid` and `token` are also sent back.
