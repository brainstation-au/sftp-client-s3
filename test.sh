#!/usr/bin/env bash

docker build -t sftp-local .

docker run --rm -v ~/.aws:/root/.aws -e AWS_PROFILE=kmart-ams-dev sftp-local s3-to-server --host "prepb2bgw01.jdadelivers.com" -u kmarepdltst --private-key-s3-uri s3://kmart-ep-test/keys/ssh/id_rsa --location /inbox --bucket kmart-ep-test --s3-key kmart/kdw/002.txt
