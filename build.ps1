<# 
  .Synopsis
    ...
	
  .Description
    ...
#>

$pwd = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition

if (Test-Path $pwd/node_modules) {
  Remove-Item -force -recurse $pwd/node_modules
}
docker stop app
docker system prune -f
docker run -d -v $pwd/:/app --name=app buildkite/puppeteer:v1.10.0 /bin/sh -c 'sleep 999'
docker exec app /bin/sh -c 'cd /app; npm install -g npm@latest'
docker exec app /bin/sh -c 'apt-get -y update; apt-get -y install build-essential'
docker exec app /bin/sh -c 'cd /app; npm install --no-package-lock --no-save web3@1.3.1'

rm -force -recurse $pwd/node_modules/tar
rm -force -recurse $pwd/node_modules/.bin