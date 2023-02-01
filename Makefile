all: docker-image

APP_NAME := mev-flood
VERSION := $(shell git describe --tags --always)

docker-image:
	DOCKER_BUILDKIT=1 docker build --platform linux/amd64 --progress=plain . -t ${APP_NAME}:${VERSION}
