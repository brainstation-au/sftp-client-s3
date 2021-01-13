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
  -k, --key, --private-key                  Private key to authenticate SFTP
                                            session          [string] [required]
  -l, --location, --remote-location         Path to the file location in SFTP
                                            server           [string] [required]
  -r, --remove, --rm, --delete              Delete remote files after
                                            successfull upload to S3
                                                      [boolean] [default: false]
  -f, --filename, --filename-pattern        Name of the file or a regular
                                            expression to find a subset [string]
  -b, --bucket, --bucket-name               S3 bucket name   [string] [required]
      --key-prefix-format,                  A [moment format](https://momentjs.c
      --s3-key-prefix-format                om/docs/#/displaying/format/) of S3
                                            key prefix to upload the file
                                                             [string] [required]
  -d, --decrypt                             Decrypt file content with GPG
                                            private key
                                                      [boolean] [default: false]
      --gpg-private-key                     GPG private key to decrypt file
                                            content                     [string]
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
  -k, --key, --private-key             Private key to authenticate SFTP session
                                                             [string] [required]
  -l, --location, --remote-location    Path to the file location in SFTP server
                                                             [string] [required]
  -b, --bucket, --bucket-name          S3 bucket name        [string] [required]
      --s3-key                         S3 key for the file to upload
                                                             [string] [required]
  -e, --encrypt                        Encrypt file content with GPG public key
                                                      [boolean] [default: false]
      --gpg-public-key                 GPG public key to encrypt file content
                                                                        [string]
```

*PGP encryption and decryption is not implemented yet*

## Environment variables
| Name  | Description |
| --- | --- |
| SFTP_HOST  | SFTP host IP address or URL  |
| SFTP_PORT  | SFTP host port number  |
| SFTP_USER  | SFTP username  |
| PRIVATE_KEY  | Private key to authenticate SFTP session  |
| REMOTE_LOCATION  | Path to the file location in SFTP server  |
| FILENAME  | Name of the file or a regular expression to find a subset  |
| BUCKET_NAME  | S3 bucket name  |
| S3_KEY  | S3 key for the file to upload  |
| KEY_PREFIX_FORMAT  | S3 key prefix to upload the file  |
| ENCRYPT  | Encrypt file content with PGP public key  |
| GPG_PUBLIC_KEY  | GPG public key to encrypt file content  |
| DECRYPT  | Decrypt file content with PGP private key  |
| GPG_PRIVATE_KEY  | GPG private key to decrypt file content  |

*When a combination of the above environment variables are present, corresponding command options become optional. But if you provide value for a command option, that has higher priority over environemnt variable.*

## Examples

### SFTP server to s3
```sh
$ docker run brainstation/sftp-client-s3 server-to-s3 \
    -h example.com \
    -p 22 \
    -u test_user \
    -k $(cat ~/.ssh/id_rsa) \
    -l /outbox \
    -b my-bucket \
    --key-prefix [my-project/section-1/year=]YYYY/[month=]MM/[day=]DD/
```

*Suppose you ran the above command on 2021-01-01 UTC, the actual --key-prefix would have been `my-project/section-1/year=2021/month=01/day=01/`*

### S3 to SFTP server
```sh
$ docker run brainstation/sftp-client-s3 s3-to-server \
    -h example.com \
    -p 22 \
    -u test_user \
    -k $(cat ~/.ssh/id_rsa) \
    -l /inbox \
    -b my-bucket \
    -s3-key my-project/file-to-upload.txt
```
