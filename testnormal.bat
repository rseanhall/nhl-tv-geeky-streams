move config.yaml config.yaml.template
move src\config.yaml.local config.yaml
docker-compose run --rm nhltv
move config.yaml src\config.yaml.local
move config.yaml.template config.yaml