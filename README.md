# sftp-client-s3
SFTP client to exchange files between SFTP server and S3 bucket.

## Available Commands

### Help
```sh
$ docker run brainstation/sftp-client-s3 --help
sftp-client <command>

Commands:
  sftp-client server-to-s3  Download files from SFTP server and put them in S3
                            bucket
  sftp-client s3-to-server  Get a file from S3 and upload that on the SFTP
                            server

Options:
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]
```

### Server to S3
```sh
$ docker run brainstation/sftp-client-s3 server-to-s3 --help
sftp-client server-to-s3

Download files from SFTP server and put them in S3 bucket

Options:
      --version                             Show version number        [boolean]
      --help                                Show help                  [boolean]
  -h, --host, --sftp-host                   SFTP host IP address or URL
                                                             [string] [required]
  -p, --port, --sftp-port                   SFTP host port number
                                                          [number] [default: 22]
  -u, --user, --sftp-user, --username       SFTP username    [string] [required]
      --private-key-s3-uri                  S3 URI for the private key to
                                            authenticate SFTP session
                                                             [string] [required]
  -l, --location, --remote-location         Path to the file location in SFTP
                                            server           [string] [required]
  -r, --remove, --rm, --delete              Delete remote files after
                                            successfull upload to S3
                                                      [boolean] [default: false]
  -f, --filename, --filename-pattern        Name of the file or a regular
                                            expression to find a subset [string]
  -b, --bucket, --bucket-name               S3 bucket name   [string] [required]
      --key-prefix-pattern,                 A string to pass through [moment
      --s3-key-prefix-pattern               format](https://momentjs.com/docs/#/
                                            displaying/format/) to get S3 key
                                            prefix           [string] [required]
      --timezone                            Name of the timezone to translate
                                            key-prefix-pattern
                                                       [string] [default: \\"UTC\\"]
      --gunzip, --uncompress                Uncompress file content if
                                            compressed[boolean] [default: false]
```

**The value for --key-prefix option will be passed through [moment format](https://momentjs.com/docs/#/displaying/format/) function to enable date time values in the S3 key.**

### S3 to Server
```sh
$ docker run brainstation/sftp-client-s3 s3-to-server --help
sftp-client s3-to-server

Get a file from S3 and upload that on the SFTP server

Options:
      --version                        Show version number             [boolean]
      --help                           Show help                       [boolean]
  -h, --host, --sftp-host              SFTP host IP address or URL
                                                             [string] [required]
  -p, --port, --sftp-port              SFTP host port number
                                                          [number] [default: 22]
  -u, --user, --sftp-user, --username  SFTP username         [string] [required]
      --private-key-s3-uri             S3 URI for the private key to
                                       authenticate SFTP session
                                                             [string] [required]
  -l, --location, --remote-location    Path to the file location in SFTP server
                                                             [string] [required]
  -b, --bucket, --bucket-name          S3 bucket name        [string] [required]
      --s3-key                         S3 key for the file to upload
                                                             [string] [required]
      --override                       Override a file in SFTP server if already
                                       exists         [boolean] [default: false]
      --gzip, --compress               Compress file content if not already
                                       compressed     [boolean] [default: false]
```

## Environment variables
| Name  | Description |
| --- | --- |
| SFTP_HOST  | SFTP host IP address or URL  |
| SFTP_PORT  | SFTP host port number  |
| SFTP_USER  | SFTP username  |
| PRIVATE_KEY_S3_URI  | S3 URI for the private key to authenticate SFTP session  |
| REMOTE_LOCATION  | Path to the file location in SFTP server  |
| FILENAME  | Name of the file or a regular expression to find a subset  |
| BUCKET_NAME  | S3 bucket name  |
| S3_KEY  | S3 key for the file to upload  |
| KEY_PREFIX_PATTERN  | A string to pass through [moment format](https://momentjs.com/docs/#/displaying/format/) to get S3 key prefix  |
| TIMEZONE  | Name of the timezone to translate key-prefix-pattern  |
| OVERRIDE  | Override a file in SFTP server if already exists  |
| COMPRESS  | Compress file content if not already compressed  |
| UNCOMPRESS  | Uncompress file content if compressed  |

*When a combination of the above environment variables are present, corresponding command options become optional. But if you provide value for a command option, that has higher priority over environemnt variable.*

## Examples

### SFTP server to s3
```sh
$ docker run brainstation/sftp-client-s3 server-to-s3 \
    -h example.com \
    -p 22 \
    -u test_user \
    --private-key-s3-uri s3://bucket-name/foo/bar/id_rsa \
    -l /outbox \
    -b my-bucket \
    --key-prefix-pattern [my-project/section-1/year=]YYYY/[month=]MM/[day=]DD/
```

*Suppose you ran the above command on 2021-01-01 UTC, the actual --key-prefix would have been `my-project/section-1/year=2021/month=01/day=01/`*

### S3 to SFTP server
```sh
$ docker run brainstation/sftp-client-s3 s3-to-server \
    -h example.com \
    -p 22 \
    -u test_user \
    --private-key-s3-uri s3://bucket-name/foo/bar/id_rsa \
    -l /inbox \
    -b my-bucket \
    -s3-key my-project/file-to-upload.txt
```

## Parameters

| Name  | server-to-s3  | s3-to-server  |
| ---  | ---  | ---  |
| -h, --host, --sftp-host              | :heavy_check_mark:  | :heavy_check_mark:  |
| -p, --port, --sftp-port              | :heavy_check_mark:  | :heavy_check_mark:  |
| -u, --user, --sftp-user, --username  | :heavy_check_mark:  | :heavy_check_mark:  |
|     --private-key-s3-uri             | :heavy_check_mark:  | :heavy_check_mark:  |
| -l, --location, --remote-location    | :heavy_check_mark:  | :heavy_check_mark:  |
| -r, --remove, --rm, --delete         | :heavy_check_mark:  | :heavy_multiplication_x:  |
|     --override                       | :heavy_multiplication_x:  | :heavy_check_mark:  |
| -f, --filename, --filename-pattern   | :heavy_check_mark:  | :heavy_multiplication_x:  |
| -b, --bucket, --bucket-name          | :heavy_check_mark:  | :heavy_check_mark:  |
|     --s3-key                         | :heavy_multiplication_x:  | :heavy_check_mark:  |
|     --key-prefix-pattern             | :heavy_check_mark:  | :heavy_multiplication_x:  |
|     --timezone                       | :heavy_check_mark:  | :heavy_multiplication_x:  |
|     --gunzip, --uncompress           | :heavy_check_mark:  | :heavy_multiplication_x:  |
|     --gzip, --compress               | :heavy_multiplication_x:  | :heavy_check_mark:  |
