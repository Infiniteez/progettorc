FROM couchdb:latest

WORKDIR /usr/src/db

VOLUME [ "/usr/src/db" ]

EXPOSE 5984
